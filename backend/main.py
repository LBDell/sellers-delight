"""
Furniture Staging Tool – FastAPI Backend

Provides AI-powered furniture identification and floor plan staging
to help StreetEasy users visualize their own furniture in listings.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import furniture, floorplan, placement

app = FastAPI(
    title="Furniture Staging Tool API",
    description=(
        "Upload furniture images or retailer links. "
        "AI identifies dimensions and places items on your apartment floor plan."
    ),
    version="1.0.0",
)

# CORS — allow local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (images) as static assets
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(furniture.router, prefix="/api/furniture", tags=["Furniture"])
app.include_router(floorplan.router, prefix="/api/floorplan", tags=["Floor Plan"])
app.include_router(placement.router, prefix="/api/placement", tags=["Placement"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "furniture-staging-tool"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
