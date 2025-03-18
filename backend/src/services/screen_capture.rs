use anyhow::{Context, Result};
use image::{ImageBuffer, Rgba};
use log::debug;
use scap::{
    capturer::{Area, Capturer, Options, Point, Resolution, Size},
    frame::{BGRAFrame, Frame, FrameType},
};
use std::io::Cursor;

use crate::models::Region;

/// Service for screen capture using scap
pub struct ScreenCaptureService;

impl ScreenCaptureService {
    /// Check if screen capture is supported on the current platform
    pub fn is_supported() -> bool {
        scap::is_supported()
    }

    /// Check if we have permission to capture the screen
    pub fn has_permission() -> bool {
        scap::has_permission()
    }

    /// Request permission to capture the screen
    pub fn request_permission() -> bool {
        scap::request_permission()
    }

    /// Get information about available displays
    pub fn get_display_info() -> Result<Vec<super::DisplayInfo>> {
        if !Self::is_supported() {
            return Err(anyhow::anyhow!(
                "Screen capture not supported on this platform"
            ));
        }

        if !Self::has_permission() {
            if !Self::request_permission() {
                return Err(anyhow::anyhow!("Screen capture permission denied"));
            }
        }

        // For simplicity, we'll return just the primary display
        let display_info = super::DisplayInfo {
            id: 0,
            name: "Primary Display".to_string(),
            width: 1920, // Default values - can be updated if needed
            height: 1080,
        };

        Ok(vec![display_info])
    }

    /// Capture a full screenshot of the primary display
    pub fn capture_primary_display() -> Result<Frame> {
        debug!("Capturing full primary display");

        // Create options for full screen capture
        let options = Options {
            fps: 1,       // Single frame
            target: None, // Primary display
            show_cursor: false,
            show_highlight: false,
            excluded_targets: None,
            output_type: FrameType::BGRAFrame,
            output_resolution: Resolution::Captured,
            crop_area: None, // Full screen - no crop
            ..Options::default()
        };

        // Create capturer with options
        #[allow(deprecated)]
        let mut capturer = Capturer::new(options);

        // Start capture, get a frame, and stop
        capturer.start_capture();
        let frame = capturer
            .get_next_frame()
            .context("Failed to capture full screen")?;
        capturer.stop_capture();

        Ok(frame)
    }

    /// Capture a specific region of the screen
    pub fn capture_region(region: &Region) -> Result<Frame> {
        debug!(
            "Capturing region: x={}, y={}, width={}, height={}",
            region.x, region.y, region.width, region.height
        );

        // Create options for region capture
        let options = Options {
            fps: 1,       // Single frame
            target: None, // Primary display
            show_cursor: false,
            show_highlight: false,
            excluded_targets: None,
            output_type: FrameType::BGRAFrame,
            output_resolution: Resolution::Captured,
            crop_area: Some(Area {
                origin: Point {
                    x: region.x as f64,
                    y: region.y as f64,
                },
                size: Size {
                    width: region.width as f64,
                    height: region.height as f64,
                },
            }),
            ..Options::default()
        };

        // Create capturer with options
        #[allow(deprecated)]
        let mut capturer = Capturer::new(options);

        // Start capture, get a frame, and stop
        capturer.start_capture();
        let frame = capturer
            .get_next_frame()
            .context("Failed to capture screen region")?;
        capturer.stop_capture();

        Ok(frame)
    }

    /// Convert a frame to PNG data
    pub fn to_png(frame: &Frame) -> Result<Vec<u8>> {
        match frame {
            Frame::BGRA(bgra_frame) => Self::bgra_frame_to_png(bgra_frame),
            _ => Err(anyhow::anyhow!("Unsupported frame format")),
        }
    }

    /// Convert a BGRA frame to PNG data
    fn bgra_frame_to_png(frame: &BGRAFrame) -> Result<Vec<u8>> {
        let width = frame.width as u32;
        let height = frame.height as u32;

        // Create an ImageBuffer from the frame data
        let img = ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, frame.data.clone())
            .context("Failed to create image from frame data")?;

        // Create a buffer for PNG data
        let mut png_data = Vec::new();

        // Save the image to a memory buffer
        img.write_to(&mut Cursor::new(&mut png_data), image::ImageFormat::Png)
            .context("Failed to encode image as PNG")?;

        Ok(png_data)
    }

    /// Save a frame to a temporary file
    pub fn save_to_temp_file(frame: &Frame) -> Result<String> {
        let temp_dir = std::env::temp_dir();
        let timestamp = chrono::Utc::now().timestamp();
        let file_path = temp_dir
            .join(format!("screen_text_reader_{}.png", timestamp))
            .to_string_lossy()
            .to_string();

        // Convert frame to PNG
        let png_data = Self::to_png(frame)?;

        // Write to file
        std::fs::write(&file_path, png_data)?;

        Ok(file_path)
    }
}
