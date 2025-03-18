use actix_web::{post, web, HttpResponse, Responder};
use log::{debug, info};

use crate::models::SetRegionRequest;
use crate::state::AppState;

/// Set the region to monitor
#[post("/api/region")]
pub async fn set_region(
    req: web::Json<SetRegionRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    let region = req.region.clone();

    if !region.is_valid() {
        debug!("Rejecting invalid region: {:?}", region);
        return HttpResponse::BadRequest().json("Invalid region: dimensions must be positive");
    }

    info!(
        "Setting monitoring region: x={}, y={}, width={}, height={}",
        region.x, region.y, region.width, region.height
    );

    let mut app_region = state.region.lock().unwrap();
    *app_region = Some(region.clone());

    HttpResponse::Ok().json(region)
}
