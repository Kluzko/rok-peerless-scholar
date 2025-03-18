use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Represents the result of an OCR operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    /// The extracted text
    pub text: String,

    /// The timestamp when the text was extracted
    pub timestamp: DateTime<Utc>,
}

impl OcrResult {
    /// Creates a new OCR result with the given text and current timestamp
    pub fn new(text: String) -> Self {
        Self {
            text,
            timestamp: Utc::now(),
        }
    }

    /// Creates an empty OCR result
    pub fn empty() -> Self {
        Self {
            text: String::new(),
            timestamp: Utc::now(),
        }
    }
}

/// Represents a response from the status API endpoint
#[derive(Debug, Serialize)]
pub struct StatusResponse {
    /// Whether monitoring is currently active
    pub is_monitoring: bool,

    /// The currently selected region (if any)
    pub region: Option<super::region::Region>,

    /// The most recently extracted text
    pub last_text: String,

    /// The timestamp of the most recent text extraction
    pub last_update: DateTime<Utc>,

    /// Whether the OCR service is ready
    pub ocr_ready: bool,

    /// Whether there is a latest screenshot available
    pub has_screenshot: bool,
}
