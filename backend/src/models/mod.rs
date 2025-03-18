pub mod ocr;
pub mod region;

// Re-export common types
pub use ocr::{OcrResult, StatusResponse};
pub use region::Region;

/// Request to set a screen region for monitoring
#[derive(serde::Deserialize)]
pub struct SetRegionRequest {
    /// The region to monitor
    pub region: Region,
}
