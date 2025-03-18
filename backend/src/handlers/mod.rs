//! HTTP API handlers

pub mod monitoring;
pub mod region;
pub mod screenshot;

pub use monitoring::{get_status, start_monitoring, stop_monitoring};
pub use region::set_region;
pub use screenshot::{get_latest_screenshot, get_screens, take_screenshot};
