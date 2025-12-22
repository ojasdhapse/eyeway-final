import requests
from app.core.config import settings
from app.utils.errors import NoRouteFound

BASE_URL = "https://maps.googleapis.com/maps/api/directions/json"

def fetch_directions(origin, destination, mode):
    params = {
        "origin": f"{origin.lat},{origin.lng}",
        "destination": destination,
        "mode": mode,
        "key": settings.GOOGLE_MAPS_API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    if data.get("status") != "OK":
        return None
    return data

def get_route(origin, destination):
    # 1️⃣ Try walking
    walking = fetch_directions(origin, destination, "walking")
    if walking:
        return {"mode": "walking", "data": walking}

    # 2️⃣ Fallback to transit
    transit = fetch_directions(origin, destination, "transit")
    if transit:
        return {"mode": "transit", "data": transit}

    raise NoRouteFound()