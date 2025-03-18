use crate::state::AppState;
use actix_web::{get, web, HttpResponse, Responder};
use log::{debug, error, info};
use once_cell::sync::Lazy;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::services::ScreenCaptureService;

/// Get information about all available screens
#[get("/api/screens")]
pub async fn get_screens() -> impl Responder {
    debug!("Request to get screen information");

    match ScreenCaptureService::get_display_info() {
        Ok(screens) => {
            debug!("Returning information for {} screens", screens.len());
            HttpResponse::Ok().json(screens)
        }
        Err(e) => {
            error!("Failed to get screen information: {}", e);
            HttpResponse::InternalServerError().json(format!("Error: {}", e))
        }
    }
}

/// Take a full screenshot of the primary screen
#[get("/api/screenshot")]
pub async fn take_screenshot() -> impl Responder {
    debug!("Request to take a full screenshot");

    let result = (|| {
        // Check platform support
        if !ScreenCaptureService::is_supported() {
            return Err(anyhow::anyhow!(
                "Screen capture not supported on this platform"
            ));
        }

        // Check permission
        if !ScreenCaptureService::has_permission() {
            debug!("No screen capture permission. Requesting permission...");
            if !ScreenCaptureService::request_permission() {
                return Err(anyhow::anyhow!("Screen capture permission denied"));
            }
        }

        // Capture full screenshot
        let frame = ScreenCaptureService::capture_primary_display()?;

        // Convert to PNG
        let png_data = ScreenCaptureService::to_png(&frame)?;

        Ok::<_, anyhow::Error>(png_data)
    })();

    match result {
        Ok(png_data) => {
            debug!("Returning screenshot ({} bytes)", png_data.len());
            HttpResponse::Ok().content_type("image/png").body(png_data)
        }
        Err(e) => {
            error!("Failed to take screenshot: {}", e);
            HttpResponse::InternalServerError().body(format!("Error: {}", e))
        }
    }
}

// Static variables for throttling
static LAST_CAPTURE_TIME: Lazy<Mutex<Instant>> = Lazy::new(|| Mutex::new(Instant::now()));
static CAPTURE_INTERVAL: Lazy<Duration> = Lazy::new(|| Duration::from_millis(500));

/// Get the latest screenshot from the monitored region
#[get("/api/latest-screenshot")]
pub async fn get_latest_screenshot(state: web::Data<AppState>) -> impl Responder {
    debug!("Request for latest screenshot");

    // Check if we should capture a new screenshot based on elapsed time
    let should_capture = {
        let now = Instant::now();
        match LAST_CAPTURE_TIME.lock() {
            Ok(mut last_time) => {
                let elapsed = now.duration_since(*last_time);
                if elapsed >= *CAPTURE_INTERVAL {
                    *last_time = now; // Update the last capture time
                    true
                } else {
                    debug!(
                        "Throttling: last capture was {}ms ago (< {}ms threshold)",
                        elapsed.as_millis(),
                        CAPTURE_INTERVAL.as_millis()
                    );
                    false
                }
            }
            Err(e) => {
                error!("Failed to lock LAST_CAPTURE_TIME: {}", e);
                false // Don't capture new screenshot if we can't get the lock
            }
        }
    };

    // Get the latest screenshot data
    let screenshot_data = match state.latest_screenshot.lock() {
        Ok(screenshot) => {
            let data = screenshot.clone();
            debug!("Screenshot data locked successfully: {:?}", data.is_some());
            data
        }
        Err(e) => {
            error!("Failed to lock latest screenshot: {}", e);
            return HttpResponse::InternalServerError().body("Internal server error");
        }
    };

    // If we have a screenshot and shouldn't capture a new one, return the existing one
    if let Some(data) = screenshot_data.clone() {
        if !should_capture {
            debug!("Using cached screenshot ({} bytes)", data.len());
            return HttpResponse::Ok().content_type("image/png").body(data);
        }
    }

    // If we should capture a new screenshot or don't have one yet
    if should_capture || screenshot_data.is_none() {
        // Check if monitoring is active
        let is_monitoring = match state.is_monitoring.lock() {
            Ok(guard) => *guard,
            Err(_) => false,
        };

        if is_monitoring {
            // Get the current region
            if let Ok(region_guard) = state.region.lock() {
                if let Some(region) = &*region_guard {
                    info!("Capturing new screenshot for region: {:?}", region);

                    // Try to capture the region
                    match ScreenCaptureService::capture_region(region) {
                        Ok(frame) => {
                            match ScreenCaptureService::to_png(&frame) {
                                Ok(png_data) => {
                                    // Store for future requests
                                    if let Ok(mut latest_screenshot) =
                                        state.latest_screenshot.lock()
                                    {
                                        *latest_screenshot = Some(png_data.clone());
                                        info!("Captured new screenshot ({} bytes)", png_data.len());
                                    }
                                    return HttpResponse::Ok()
                                        .content_type("image/png")
                                        .body(png_data);
                                }
                                Err(e) => {
                                    error!("Failed to convert capture to PNG: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            error!("Failed to capture region: {}", e);
                        }
                    }
                }
            }
        }
    }

    // If we have an existing screenshot but failed to capture a new one
    if let Some(data) = screenshot_data {
        info!("Returning existing screenshot ({} bytes)", data.len());
        return HttpResponse::Ok().content_type("image/png").body(data);
    }

    // Fall back to no content response if we have no screenshot
    debug!("No screenshot available");
    HttpResponse::NoContent().body("No screenshot available")
}
