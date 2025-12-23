from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.navigate import router as navigate_router
from app.api.vision import router as vision_router  # NEW: Vision API

app = FastAPI(title="Navigation Backend", version="1.0")

# Add CORS middleware to allow requests from web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Navigation router (existing, untouched)
app.include_router(navigate_router)

# Vision router (NEW: obstacle detection)
app.include_router(vision_router)