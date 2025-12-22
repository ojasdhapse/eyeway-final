from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.navigate import router as navigate_router

app = FastAPI(title="Navigation Backend", version="1.0")

# Add CORS middleware to allow requests from web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(navigate_router)