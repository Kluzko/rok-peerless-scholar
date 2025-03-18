use serde::{Deserialize, Serialize};

/// Represents a rectangular region on the screen
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Region {
    /// X-coordinate of the top-left corner (in pixels)
    pub x: i32,

    /// Y-coordinate of the top-left corner (in pixels)
    pub y: i32,

    /// Width of the region (in pixels)
    pub width: i32,

    /// Height of the region (in pixels)
    pub height: i32,
}

impl Region {
    /// Creates a new Region with the specified coordinates and dimensions
    pub fn new(x: i32, y: i32, width: i32, height: i32) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }

    /// Validates that the region has positive dimensions
    pub fn is_valid(&self) -> bool {
        self.width > 0 && self.height > 0
    }

    /// Returns the area of the region in pixels
    pub fn area(&self) -> i32 {
        self.width * self.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_region_validity() {
        let valid_region = Region::new(10, 20, 100, 50);
        let invalid_region = Region::new(10, 20, 0, 50);

        assert!(valid_region.is_valid());
        assert!(!invalid_region.is_valid());
    }

    #[test]
    fn test_region_area() {
        let region = Region::new(10, 20, 100, 50);
        assert_eq!(region.area(), 5000);
    }
}
