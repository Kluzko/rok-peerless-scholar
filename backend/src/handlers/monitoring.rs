use crate::models::StatusResponse;
use crate::services::ocr::OcrService;
use crate::state::AppState;
use actix_web::{get, post, web, HttpResponse, Responder};
use log::{debug, error, info};

/// Get the current monitoring status
#[get("/api/status")]
pub async fn get_status(state: web::Data<AppState>) -> impl Responder {
    debug!("Request for current status");

    // Create a macro to reduce boilerplate for mutex locking with error handling
    macro_rules! safe_lock {
        ($mutex:expr, $err_msg:expr) => {
            match $mutex.lock() {
                Ok(guard) => guard,
                Err(e) => {
                    error!("{}: {}", $err_msg, e);
                    return HttpResponse::InternalServerError()
                        .json(format!("Internal server error: {}", $err_msg));
                }
            }
        };
    }

    // Safely acquire all the locks we need
    let region = safe_lock!(state.region, "region lock").clone();
    let ocr_ready = *safe_lock!(state.ocr_ready, "OCR ready flag lock");
    let ocr_result = safe_lock!(state.ocr_result, "OCR result lock").clone();
    let is_monitoring = *safe_lock!(state.is_monitoring, "monitoring status lock");

    // Check if screenshot is available
    let has_screenshot = match state.latest_screenshot.lock() {
        Ok(screenshot) => screenshot.is_some(),
        Err(e) => {
            error!("Failed to lock latest screenshot: {}", e);
            false
        }
    };

    // Prepare and log the response
    debug!(
        "Preparing status response: is_monitoring={}, region={:?}, text_len={}, ocr_ready={}, has_screenshot={}",
        is_monitoring,
        region,
        ocr_result.text.len(),
        ocr_ready,
        has_screenshot
    );

    // Construct and return the response
    let status = StatusResponse {
        is_monitoring,
        region,
        last_text: ocr_result.text,
        last_update: ocr_result.timestamp,
        ocr_ready,
        has_screenshot,
    };

    debug!("Serializing status response");
    HttpResponse::Ok().json(status)
}

/// Start monitoring the selected region
#[post("/api/monitor/start")]
pub async fn start_monitoring(state: web::Data<AppState>) -> impl Responder {
    debug!("Request to start monitoring");

    // Check if already monitoring
    if let Ok(is_monitoring) = state.is_monitoring.lock() {
        if *is_monitoring {
            debug!("Monitoring already active");
            return HttpResponse::BadRequest().body("Already monitoring");
        }
    } else {
        error!("Failed to lock monitoring status");
        return HttpResponse::InternalServerError().body("Internal server error");
    }

    // Check if a region is selected
    let selected_region = match state.region.lock() {
        Ok(region) => {
            if region.is_none() {
                debug!("No region selected for monitoring");
                return HttpResponse::BadRequest().body("No region selected");
            }
            region.clone()
        }
        Err(_) => {
            error!("Failed to lock region");
            return HttpResponse::InternalServerError().body("Internal server error");
        }
    };

    // Set monitoring flag first
    if let Ok(mut is_monitoring) = state.is_monitoring.lock() {
        *is_monitoring = true;
        info!("Monitoring flag set to active");
    } else {
        error!("Failed to lock monitoring status for activation");
        return HttpResponse::InternalServerError().body("Failed to start monitoring");
    }

    // Trigger an immediate OCR processing in a separate thread
    if let Some(region) = selected_region {
        let state_clone = state.clone();
        tokio::spawn(async move {
            // Perform an immediate scan without waiting for the monitor loop
            match OcrService::new() {
                Ok(mut ocr_service) => {
                    info!("Performing initial OCR scan");
                    match ocr_service.extract_text_from_region(&region) {
                        Ok(result) => {
                            // Only update if we're still monitoring (in case it was stopped immediately)
                            if let Ok(is_monitoring) = state_clone.is_monitoring.lock() {
                                if *is_monitoring {
                                    info!(
                                        "Initial OCR scan detected: {} characters",
                                        result.text.len()
                                    );
                                    if let Ok(mut ocr_result) = state_clone.ocr_result.lock() {
                                        *ocr_result = result;
                                    }
                                } else {
                                    info!("Monitoring stopped before initial scan completed - discarding results");
                                }
                            }
                        }
                        Err(e) => error!("Failed to perform initial OCR scan: {}", e),
                    }
                }
                Err(e) => error!("Failed to initialize OCR service for initial scan: {}", e),
            }
        });
    }

    info!("Monitoring started successfully");
    HttpResponse::Ok().body("Monitoring started")
}

/// Stop monitoring
#[post("/api/monitor/stop")]
pub async fn stop_monitoring(state: web::Data<AppState>) -> impl Responder {
    debug!("Request to stop monitoring");

    // Check if we're actually monitoring first
    let was_monitoring = match state.is_monitoring.lock() {
        Ok(guard) => *guard,
        Err(e) => {
            error!("Failed to check monitoring status: {}", e);
            return HttpResponse::InternalServerError().body("Failed to stop monitoring");
        }
    };

    // Set monitoring flag to false
    if let Ok(mut is_monitoring) = state.is_monitoring.lock() {
        *is_monitoring = false;

        if was_monitoring {
            info!("Monitoring stopped successfully");

            // Clear the OCR text but keep record of when it was stopped
            if let Err(e) = state.clear_current_result() {
                error!("Failed to clear OCR result: {}", e);
                // Still continue, this isn't fatal
            }

            HttpResponse::Ok().body("Monitoring stopped")
        } else {
            debug!("Monitoring was already inactive");
            HttpResponse::Ok().body("Monitoring was already inactive")
        }
    } else {
        error!("Failed to lock monitoring status");
        HttpResponse::InternalServerError().body("Failed to stop monitoring")
    }
}
