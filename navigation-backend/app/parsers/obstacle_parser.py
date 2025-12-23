from app.models.schemas import Obstacle
from typing import Optional

# Obstacle categories for classification
HUMAN_KEYWORDS = ["person", "human", "pedestrian", "people", "man", "woman", "child"]
VEHICLE_KEYWORDS = ["car", "vehicle", "bicycle", "motorcycle", "truck", "bus", "van", "scooter"]
STATIC_KEYWORDS = ["pole", "sign", "bench", "tree", "building", "wall", "post", "barrier", "fence"]


def classify_obstacle(obj: dict) -> Optional[Obstacle]:
    """
    Classify detected object into obstacle type and position.
    
    This function determines:
    1. What type of obstacle it is (human, vehicle, static)
    2. Where it is located (LEFT, RIGHT, FRONT)
    
    Args:
        obj: Vision API object annotation containing name, score, and boundingPoly
    
    Returns:
        Obstacle object with classification, or None if not relevant
    """
    name = obj.get("name", "").lower()
    confidence = obj.get("score", 0)
    
    # Determine object type based on keywords
    if any(keyword in name for keyword in HUMAN_KEYWORDS):
        obj_type = "human"
    elif any(keyword in name for keyword in VEHICLE_KEYWORDS):
        obj_type = "vehicle"
    elif any(keyword in name for keyword in STATIC_KEYWORDS):
        obj_type = "static_obstacle"
    else:
        obj_type = "unknown"
    
    # Calculate position from bounding box
    position = _calculate_position(obj.get("boundingPoly", {}))
    
    # Generate human-readable description
    description = f"{obj_type.replace('_', ' ').title()} detected {position.lower()}"
    
    return Obstacle(
        object_type=obj_type,
        confidence=confidence,
        position=position,
        description=description
    )


def _calculate_position(bounding_poly: dict) -> str:
    """
    Determine if obstacle is LEFT, RIGHT, or FRONT based on bounding box.
    
    Position Logic:
    - X-axis: 0.0 (left edge) to 1.0 (right edge)
    - Y-axis: 0.0 (top) to 1.0 (bottom)
    
    Classification:
    - FRONT: Centered horizontally (0.33 < x < 0.66) AND in lower portion (y > 0.6)
    - LEFT: Left third of frame (x < 0.33)
    - RIGHT: Right third of frame (x > 0.66)
    
    The y > 0.6 check ensures we prioritize obstacles in the immediate path
    rather than distant objects at the top of the frame.
    
    Args:
        bounding_poly: Vision API bounding polygon with normalizedVertices
        
    Returns:
        Position string: "LEFT", "RIGHT", "FRONT", or "UNKNOWN"
    """
    vertices = bounding_poly.get("normalizedVertices", [])
    
    if not vertices:
        return "UNKNOWN"
    
    # Calculate center X coordinate and maximum Y coordinate
    x_center = sum(v.get("x", 0.5) for v in vertices) / len(vertices)
    y_max = max(v.get("y", 0) for v in vertices)
    
    # Determine position based on frame division
    if y_max > 0.6 and 0.33 < x_center < 0.66:
        # Object is in center and close (lower portion of frame)
        return "FRONT"
    elif x_center < 0.33:
        # Object is in left third
        return "LEFT"
    elif x_center > 0.66:
        # Object is in right third
        return "RIGHT"
    else:
        # Default to FRONT for safety (better to warn than miss)
        return "FRONT"
