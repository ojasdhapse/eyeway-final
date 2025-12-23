import asyncio
import base64
import requests
from typing import List
from io import BytesIO
from PIL import Image
from app.core.config import settings
from app.parsers.obstacle_parser import classify_obstacle
from app.models.schemas import Obstacle
from app.utils.errors import VisionAPIError

VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate"

# Rate limiting: Max 1 request per second to prevent API quota exhaustion
_last_request_time = 0
_min_interval = 1.0  # seconds


async def detect_obstacles(
    image_bytes: bytes,
    max_results: int = 10
) -> List[Obstacle]:
    """
    Detect obstacles using Google Cloud Vision API.
    
    This function is completely isolated from navigation logic.
    Failures here will NOT affect navigation functionality.
    
    Args:
        image_bytes: Raw image data from camera
        max_results: Maximum objects to detect
    
    Returns:
        List of detected obstacles with position classification
        
    Raises:
        VisionAPIError: If Vision API request fails
    """
    global _last_request_time
    
    # Validate image data first
    try:
        img = Image.open(BytesIO(image_bytes))
        img.verify()  # Verify it's a valid image
    except Exception as e:
        raise VisionAPIError(f"Invalid image data: {str(e)}")
    
    # Rate limiting to prevent API quota exhaustion
    current_time = asyncio.get_event_loop().time()
    time_since_last = current_time - _last_request_time
    if time_since_last < _min_interval:
        await asyncio.sleep(_min_interval - time_since_last)
    
    _last_request_time = asyncio.get_event_loop().time()
    
    # Encode image to base64
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    
    # Prepare Vision API request
    payload = {
        "requests": [{
            "image": {"content": encoded_image},
            "features": [
                {"type": "OBJECT_LOCALIZATION", "maxResults": max_results},
                {"type": "LABEL_DETECTION", "maxResults": max_results}
            ]
        }]
    }
    
    # Call Vision API with timeout protection
    try:
        response = requests.post(
            f"{VISION_API_URL}?key={settings.GOOGLE_MAPS_API_KEY}",
            json=payload,
            timeout=5  # 5 second timeout to prevent hanging
        )
        response.raise_for_status()
        data = response.json()
        
        # Parse response
        vision_response = data["responses"][0]
        obstacles = _parse_vision_response(vision_response)
        
        return obstacles
    
    except requests.exceptions.Timeout:
        raise VisionAPIError("Vision API request timed out")
    except requests.exceptions.RequestException as e:
        raise VisionAPIError(f"Vision API request failed: {str(e)}")
    except KeyError as e:
        raise VisionAPIError(f"Unexpected Vision API response format: {str(e)}")
    except Exception as e:
        raise VisionAPIError(f"Unexpected error: {str(e)}")


def _parse_vision_response(response: dict) -> List[Obstacle]:
    """
    Parse Vision API response into structured obstacles.
    
    Args:
        response: Raw Vision API response
        
    Returns:
        List of classified obstacles
    """
    obstacles = []
    
    # Get detected objects and labels
    objects = response.get("localizedObjectAnnotations", [])
    labels = response.get("labelAnnotations", [])
    
    # Check for walls/corridors from labels (important for indoor navigation)
    label_names = {l["description"].lower() for l in labels}
    if any(keyword in label_names for keyword in ["wall", "corridor", "hallway"]):
        obstacles.append(Obstacle(
            object_type="wall",
            confidence=0.9,
            position="FRONT",
            description="Wall or corridor detected ahead"
        ))
    
    # Process detected objects
    for obj in objects:
        confidence = obj.get("score", 0)
        
        # Filter low-confidence detections to reduce false positives
        if confidence < 0.5:
            continue
        
        # Classify obstacle with position
        obstacle = classify_obstacle(obj)
        if obstacle:
            obstacles.append(obstacle)
    
    return obstacles
