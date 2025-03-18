use log::{debug, error, info, warn};
use std::sync::{Arc, Mutex};
use std::time::Instant;

use crate::models::{OcrResult, Region};
use crate::services::{OcrService, ScreenCaptureService};

/// Application state shared between API handlers and background tasks
pub struct AppState {
    /// Currently selected region (if any)
    pub region: Mutex<Option<Region>>,

    /// Most recent OCR result
    pub ocr_result: Mutex<OcrResult>,

    /// Flag to control monitoring
    pub is_monitoring: Mutex<bool>,

    /// Flag to indicate if OCR service is properly initialized
    pub ocr_ready: Mutex<bool>,

    /// Latest screenshot data in PNG format for the UI to display
    pub latest_screenshot: Mutex<Option<Vec<u8>>>,

    /// Last time a screenshot was captured
    pub last_screenshot_time: Mutex<Instant>,
}

impl AppState {
    /// Create a new application state
    pub fn new() -> Self {
        info!("Initializing application state");

        // Check if screen capture is supported
        if !ScreenCaptureService::is_supported() {
            warn!("Screen capture is not supported on this platform!");
        } else {
            info!("Screen capture is supported on this platform");

            // Check permission
            if !ScreenCaptureService::has_permission() {
                info!("Requesting screen capture permission");
                if !ScreenCaptureService::request_permission() {
                    warn!("Screen capture permission was denied");
                } else {
                    info!("Screen capture permission granted");
                }
            } else {
                info!("Screen capture permission already granted");
            }
        }

        Self {
            region: Mutex::new(None),
            ocr_result: Mutex::new(OcrResult::empty()),
            is_monitoring: Mutex::new(false),
            ocr_ready: Mutex::new(false), // Initially set to false until OCR is initialized
            latest_screenshot: Mutex::new(None),
            last_screenshot_time: Mutex::new(Instant::now()),
        }
    }

    /// Start the background OCR monitoring task
    pub fn start_monitoring_task(state: Arc<Self>) {
        info!("Starting background OCR monitoring task");

        std::thread::Builder::new()
            .name("ocr-monitor".into())
            .spawn(move || {
                if let Err(e) = Self::monitor_task(state.clone()) {
                    error!("OCR monitoring task failed: {}", e);

                    // Make sure to set ocr_ready to false if initialization fails
                    if let Ok(mut ocr_ready) = state.ocr_ready.lock() {
                        *ocr_ready = false;
                    }
                }
            })
            .expect("Failed to spawn OCR monitoring thread");
    }

    /// Background task for monitoring and OCR processing
    fn monitor_task(state: Arc<Self>) -> anyhow::Result<()> {
        // Skip monitoring if screen capture is not supported
        if !ScreenCaptureService::is_supported() {
            warn!("Screen capture is not supported on this platform. Monitoring task will exit.");
            return Ok(());
        }

        // Initialize OCR service
        let ocr_result = OcrService::new();

        match ocr_result {
            Ok(mut ocr_service) => {
                // Mark OCR as ready once initialized successfully
                if let Ok(mut ocr_ready) = state.ocr_ready.lock() {
                    *ocr_ready = true;
                    info!("OCR service initialized successfully");
                } else {
                    error!("Failed to update OCR ready status");
                }

                // Last processed text for comparison
                let mut last_text = String::new();

                // Store last captured screenshot data for change detection
                let mut last_capture: Option<Vec<u8>> = None;

                // Timestamp for tracking performance
                let mut last_capture_time = std::time::Instant::now();

                loop {
                    // Check if monitoring is active
                    let is_monitoring = match state.is_monitoring.lock() {
                        Ok(guard) => *guard,
                        Err(e) => {
                            error!("Failed to lock monitoring state: {}", e);
                            std::thread::sleep(std::time::Duration::from_secs(1));
                            continue;
                        }
                    };

                    if !is_monitoring {
                        // Sleep and check again
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        continue;
                    }

                    // Get the current region
                    let current_region = match state.region.lock() {
                        Ok(guard) => match guard.clone() {
                            Some(region) => region,
                            None => {
                                // No region selected, sleep and check again
                                std::thread::sleep(std::time::Duration::from_millis(500));
                                continue;
                            }
                        },
                        Err(e) => {
                            error!("Failed to lock region: {}", e);
                            std::thread::sleep(std::time::Duration::from_secs(1));
                            continue;
                        }
                    };

                    // Calculate time elapsed since last capture
                    let elapsed = last_capture_time.elapsed();

                    // Throttle capture frequency based on previous capture performance
                    // If last capture took more than 200ms, we'll add some delay to prevent overloading
                    if elapsed.as_millis() < 200 {
                        let delay = std::time::Duration::from_millis(200) - elapsed;
                        std::thread::sleep(delay);
                    }

                    // Record start time of this capture
                    last_capture_time = std::time::Instant::now();

                    // Capture the screen region
                    info!(
                        "Capturing region: x={}, y={}, width={}, height={}",
                        current_region.x,
                        current_region.y,
                        current_region.width,
                        current_region.height
                    );

                    let frame_result = ScreenCaptureService::capture_region(&current_region);

                    if let Err(e) = frame_result {
                        error!("Error capturing screen region: {}", e);
                        std::thread::sleep(std::time::Duration::from_secs(1));
                        continue;
                    }

                    let frame = frame_result.unwrap();
                    info!("Successfully captured frame");

                    // Convert frame to PNG data for storage and comparison
                    let png_data_result = ScreenCaptureService::to_png(&frame);

                    if let Err(e) = png_data_result {
                        error!("Error converting frame to PNG: {}", e);
                        std::thread::sleep(std::time::Duration::from_secs(1));
                        continue;
                    }

                    let png_data = png_data_result.unwrap();
                    info!("Converted frame to PNG: {} bytes", png_data.len());

                    // Always store the latest screenshot regardless of changes
                    // This ensures we always have screenshot data available for the frontend
                    if let Ok(mut latest_screenshot) = state.latest_screenshot.lock() {
                        *latest_screenshot = Some(png_data.clone());
                        info!("Updated latest screenshot in state");
                    } else {
                        error!("Failed to update latest screenshot in state");
                    }

                    // Check if the image has changed significantly
                    let image_changed = match &last_capture {
                        Some(last_data) => {
                            // Simple hash comparison for quick change detection
                            let current_hash = calculate_simple_hash(&png_data);
                            let last_hash = calculate_simple_hash(last_data);
                            current_hash != last_hash
                        }
                        None => true, // First capture
                    };

                    // If the image has changed or we need to extract text
                    if image_changed {
                        debug!("Screen region changed, performing OCR");

                        // Update the last capture
                        last_capture = Some(png_data.clone());

                        // Extract text from the region
                        let result = match ocr_service.extract_text_from_region(&current_region) {
                            Ok(result) => result,
                            Err(e) => {
                                error!("Error extracting text: {}", e);
                                std::thread::sleep(std::time::Duration::from_secs(1));
                                continue;
                            }
                        };

                        // Update state if text has changed
                        if result.text != last_text {
                            info!(
                                "New text detected ({} characters): {}",
                                result.text.len(),
                                result.text
                            );
                            last_text = result.text.clone();

                            match state.ocr_result.lock() {
                                Ok(mut ocr_result) => {
                                    *ocr_result = result;
                                }
                                Err(e) => {
                                    error!("Failed to update OCR result: {}", e);
                                }
                            }
                        }
                    } else {
                        debug!("No visual change detected in the monitored region");
                    }

                    // Log performance metrics
                    debug!(
                        "OCR cycle completed in {}ms",
                        last_capture_time.elapsed().as_millis()
                    );
                }
            }
            Err(e) => {
                error!("Failed to initialize OCR service: {}", e);

                // Make sure OCR ready flag is set to false
                if let Ok(mut ocr_ready) = state.ocr_ready.lock() {
                    *ocr_ready = false;
                }

                return Err(e);
            }
        }
    }

    pub fn clear_current_result(&self) -> Result<(), String> {
        match self.ocr_result.lock() {
            Ok(mut ocr_result) => {
                // Don't clear the entire result - keep the timestamp
                // But clear the text to indicate monitoring has stopped
                ocr_result.text = String::new();
                ocr_result.timestamp = chrono::Utc::now();
                Ok(())
            }
            Err(e) => {
                error!("Failed to clear OCR result: {}", e);
                Err(format!("Failed to clear OCR result: {}", e))
            }
        }
    }
}

fn calculate_simple_hash(data: &[u8]) -> u64 {
    let mut hash: u64 = 0;

    // Sample pixels at regular intervals for quick comparison
    let stride = data.len().max(1000) / 1000; // Sample at most 1000 points

    for i in (0..data.len()).step_by(stride) {
        if i < data.len() {
            hash = hash.wrapping_add((data[i] as u64).wrapping_mul(i as u64 + 1));
        }
    }

    hash
}

impl Clone for AppState {
    fn clone(&self) -> Self {
        Self {
            region: Mutex::new(match self.region.lock() {
                Ok(guard) => guard.clone(),
                Err(_) => {
                    warn!("Failed to lock region during clone, using empty value");
                    None
                }
            }),
            ocr_result: Mutex::new(match self.ocr_result.lock() {
                Ok(guard) => guard.clone(),
                Err(_) => {
                    warn!("Failed to lock ocr_result during clone, using empty value");
                    OcrResult::empty()
                }
            }),
            is_monitoring: Mutex::new(match self.is_monitoring.lock() {
                Ok(guard) => *guard,
                Err(_) => {
                    warn!("Failed to lock is_monitoring during clone, using default value");
                    false
                }
            }),
            ocr_ready: Mutex::new(match self.ocr_ready.lock() {
                Ok(guard) => *guard,
                Err(_) => {
                    warn!("Failed to lock ocr_ready during clone, using default value");
                    false
                }
            }),
            latest_screenshot: Mutex::new(match self.latest_screenshot.lock() {
                Ok(guard) => guard.clone(),
                Err(_) => {
                    warn!("Failed to lock latest_screenshot during clone, using empty value");
                    None
                }
            }),
            last_screenshot_time: Mutex::new(match self.last_screenshot_time.lock() {
                Ok(guard) => *guard,
                Err(_) => {
                    warn!("Failed to lock last_screenshot_time during clone, using current time");
                    Instant::now()
                }
            }),
        }
    }
}
