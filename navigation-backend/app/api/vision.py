from fastapi import APIRouter, UploadFile, File
from app.models.schemas import ObstacleDetectionResponse
from app.services.vision_service import detect_obstacles
from app.utils.errors import VisionAPIError

router = APIRouter(prefix="/vision", tags=["vision"])

@router.post("/detect-obstacles", response_model=ObstacleDetectionResponse)
async def analyze_frame(
    image: UploadFile = File(...),
    max_results: int = 10
):
    """
    Analyze camera frame for obstacles.
    This endpoint is INDEPENDENT of navigation.
    
    Args:
        image: Uploaded image file from camera
        max_results: Maximum number of objects to detect
    
    Returns:
        ObstacleDetectionResponse with detected obstacles
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Detect obstacles (non-blocking)
        obstacles = await detect_obstacles(image_bytes, max_results)
        
        return ObstacleDetectionResponse(
            success=True,
            obstacles=obstacles,
            message="Analysis complete"
        )
    
    except VisionAPIError as e:
        # Vision failure should NOT affect navigation
        return ObstacleDetectionResponse(
            success=False,
            obstacles=[],
            message=f"Vision API error: {str(e)}"
        )
    
    except Exception as e:
        # Graceful degradation
        return ObstacleDetectionResponse(
            success=False,
            obstacles=[],
            message=f"Unexpected error: {str(e)}"
        )


@router.get("/health")
async def vision_health_check():
    """Check if Vision API is accessible"""
    try:
        from app.core.config import settings
        return {
            "status": "healthy",
            "api_key_configured": bool(settings.GOOGLE_MAPS_API_KEY)
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
