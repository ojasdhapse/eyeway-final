def parse_route(route_wrapper):
    route = route_wrapper["data"]["routes"][0]
    leg = route["legs"][0]

    steps = []
    for step in leg["steps"]:
        steps.append({
            "instruction": step["html_instructions"],
            "distance_meters": step["distance"]["value"],
            "duration_seconds": step["duration"]["value"],
            "maneuver": step.get("maneuver", "unknown"),
            "start_location": step["start_location"],
            "end_location": step["end_location"]
        })

    return {
        "route_mode": route_wrapper["mode"],
        "total_distance_meters": leg["distance"]["value"],
        "estimated_time_minutes": leg["duration"]["value"] // 60,
        "steps": steps,
        "polyline": route["overview_polyline"]["points"]
    }