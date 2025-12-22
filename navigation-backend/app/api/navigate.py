from fastapi import APIRouter, HTTPException
from app.models.schemas import NavigateRequest, NavigateResponse
from app.services.google_maps import get_route
from app.parsers.route_parser import parse_route
from app.utils.errors import NoRouteFound

router = APIRouter()

@router.post("/navigate", response_model=NavigateResponse)
def navigate(request: NavigateRequest):
    try:
        route_data = get_route(
            origin=request.current_location,
            destination=request.destination
        )
        return parse_route(route_data)
    except NoRouteFound:
        raise HTTPException(status_code=404, detail="No route found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))