use anyhow::{Context, Result};
use log::{debug, error};
use std::path::Path;
use tesseract::Tesseract;

use super::screen_capture::ScreenCaptureService;
use crate::models::{OcrResult, Region};

/// Service for performing OCR on screen regions
pub struct OcrService {
    /// Tesseract OCR engine instance
    tesseract: Tesseract,
}

impl OcrService {
    /// Create a new OCR service
    pub fn new() -> Result<Self> {
        // Initialize Tesseract with English language
        let tesseract = Tesseract::new(None, Some("eng"))
            .context("Failed to initialize Tesseract OCR engine")?;

        // Create and configure service
        let mut service = Self { tesseract };
        service.configure()?;

        Ok(service)
    }

    /// Configure the OCR engine with optimal settings
    fn configure(&mut self) -> Result<()> {
        // Create a new instance for method call that takes ownership
        let tesseract = std::mem::replace(&mut self.tesseract, unsafe { std::mem::zeroed() });

        // Apply settings - PSM 6: Assume a single uniform block of text
        let updated = tesseract
            .set_variable("tessedit_pageseg_mode", "6")
            .context("Failed to set page segmentation mode")?;

        // Replace with updated instance
        self.tesseract = updated;

        Ok(())
    }

    /// Extract text from an image file
    pub fn extract_text_from_file<P: AsRef<Path>>(&mut self, image_path: P) -> Result<String> {
        let path = image_path.as_ref().to_string_lossy();
        debug!("Performing OCR on file: {}", path);

        // Create a new instance for method call that takes ownership
        let tesseract = std::mem::replace(&mut self.tesseract, unsafe { std::mem::zeroed() });

        // Set image and get updated instance
        let updated = tesseract
            .set_image(&path)
            .context("Failed to set image for OCR")?;

        // Replace with updated instance
        self.tesseract = updated;

        // Get text
        let text = self
            .tesseract
            .get_text()
            .context("Failed to extract text with OCR")?;

        Ok(text.trim().to_string())
    }

    pub fn extract_text_from_region(&mut self, region: &Region) -> Result<OcrResult> {
        debug!("Extracting text from region: {:?}", region);

        // Capture the region
        let frame = ScreenCaptureService::capture_region(region)
            .context("Failed to capture region for OCR")?;

        // Save to temporary file
        let temp_file = ScreenCaptureService::save_to_temp_file(&frame)
            .context("Failed to save captured region to file")?;

        // Clean up temporary file when done - corrected syntax
        let _cleanup = scopeguard::guard(temp_file.clone(), |path| {
            if let Err(e) = std::fs::remove_file(&path) {
                error!("Failed to remove temporary file: {}", e);
            }
        });

        // Extract text
        let text = self.extract_text_from_file(&temp_file)?;
        debug!("Extracted text: {} characters", text.len());

        Ok(OcrResult::new(text))
    }
}
