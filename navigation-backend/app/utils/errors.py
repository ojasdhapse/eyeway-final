class NoRouteFound(Exception):
    """Raised when no route can be found between origin and destination"""
    pass


class VisionAPIError(Exception):
    """Raised when Vision API fails (does NOT affect navigation)"""
    pass