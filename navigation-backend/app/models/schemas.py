from pydantic import BaseModel
from typing import List

class Location(BaseModel):
    lat: float
    lng: float

class NavigateRequest(BaseModel):
    current_location: Location
    destination: str

class Step(BaseModel):
    instruction: str
    distance_meters: int
    duration_seconds: int
    maneuver: str
    start_location: Location
    end_location: Location

class NavigateResponse(BaseModel):
    route_mode: str
    total_distance_meters: int
    estimated_time_minutes: int
    steps: List[Step]
    polyline: str

# ============================================
# Vision API Schemas (NEW - Obstacle Detection)
# ============================================

class Obstacle(BaseModel):
    """Detected obstacle information"""
    object_type: str  # "human", "vehicle", "wall", "static_obstacle", "unknown"
    confidence: float  # 0.0 to 1.0
    position: str  # "LEFT", "RIGHT", "FRONT", "UNKNOWN"
    description: str  # Human-readable description (e.g., "Human detected in front")


class ObstacleDetectionRequest(BaseModel):
    """Request for obstacle detection (image handled via multipart/form-data)"""
    pass  # Image is uploaded as file, not in JSON body


class ObstacleDetectionResponse(BaseModel):
    """Response from obstacle detection endpoint"""
    success: bool
    obstacles: List[Obstacle]
    message: str