//! Screen Text Reader Application
//!
//! An application that allows users to select regions of their screen
//! and perform OCR to extract text from those regions.

mod config;
mod handlers;
mod models;
mod services;
mod state;

use std::sync::Arc;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use log::{error, info, warn};

use crate::config::Config;
use crate::services::ScreenCaptureService;
use crate::state::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    Config::init_logging();

    // Load configuration
    let config = Config::from_env();

    // Check if screen capture is supported
    if !ScreenCaptureService::is_supported() {
        warn!("Screen capture is not supported on this platform!");
        warn!("The application may not function correctly.");
    } else {
        info!("Screen capture is supported on this platform");
        // Check permission
        if !ScreenCaptureService::has_permission() {
            info!("Requesting screen capture permission...");
            if ScreenCaptureService::request_permission() {
                info!("Screen capture permission granted");
            } else {
                error!("Screen capture permission denied!");
                error!("The application cannot function without screen capture permission");
                return Err(std::io::Error::new(
                    std::io::ErrorKind::PermissionDenied,
                    "Screen capture permission denied",
                ));
            }
        } else {
            info!("Screen capture permission already granted");
        }
    }

    // Initialize application state
    let state = AppState::new();

    // Start background monitoring task
    AppState::start_monitoring_task(Arc::new(state.clone()));
    // Create a web::Data wrapper for the state
    let app_state = web::Data::new(state);

    // Ensure static directory exists
    if let Err(e) = std::fs::create_dir_all(&config.static_dir) {
        error!("Failed to create static directory: {}", e);
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Failed to create static directory: {}", e),
        ));
    }

    // Get server URL for binding
    let server_url = config.server_url();
    // Store static directory path for use in HttpServer
    let static_dir = config.static_dir.clone();

    // Start HTTP server
    info!("Starting server at http://{}", server_url);

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone()) // Clone the wrapper, not the inner state
            // Configure CORS
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .max_age(3600),
            )
            // API routes
            .service(handlers::get_screens)
            .service(handlers::take_screenshot)
            .service(handlers::get_latest_screenshot)
            .service(handlers::set_region)
            .service(handlers::get_status)
            .service(handlers::start_monitoring)
            .service(handlers::stop_monitoring)
    })
    .bind(server_url)?
    .run()
    .await
}
