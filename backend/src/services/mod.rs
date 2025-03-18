pub mod ocr;
pub mod screen_capture;

pub use ocr::OcrService;
pub use screen_capture::ScreenCaptureService;

#[derive(Debug, Clone, serde::Serialize)]
pub struct DisplayInfo {
    /// Screen identifier
    pub id: u32,

    /// Display name
    pub name: String,

    /// Screen width in pixels
    pub width: u32,

    /// Screen height in pixels
    pub height: u32,
}
