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