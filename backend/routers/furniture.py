"""
Furniture endpoints:
  POST /api/furniture/upload  - Upload an image of owned furniture
  POST /api/furniture/link    - Submit a retailer product URL
  GET  /api/furniture         - List all furniture in session
  GET  /api/furniture/{id}    - Get a single furniture item
  DELETE /api/furniture/{id}  - Remove a furniture item
"""
import os
import uuid
import aiofiles
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from models.schemas import (
    FurnitureItem,
    FurnitureUploadResponse,
    LinkScrapeRequest,
    PlacementUpdate,
)
import services.storage as storage
import services.ai_service as ai_service

router = APIRouter()

UPLOAD_DIR = "uploads/furniture"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=FurnitureUploadResponse)
async def upload_furniture_image(
    file: UploadFile = File(...),
    session_id: str = Form(default="default"),
):
    """Upload a furniture image for AI identification."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")

    # Save original
    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    saved_filename = f"{uuid.uuid4()}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    async with aiofiles.open(saved_path, "wb") as f:
        await f.write(image_data)

    try:
        furniture = await ai_service.identify_furniture_from_image(image_data, file.filename or "image.jpg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI identification failed: {str(e)}")

    furniture.source_image_path = saved_path
    furniture.image_url = f"/uploads/furniture/{saved_filename}"
    storage.add_furniture(furniture, session_id)

    return FurnitureUploadResponse(
        furniture=furniture,
        message=f"Successfully identified: {furniture.name}",
    )


@router.post("/link", response_model=FurnitureUploadResponse)
async def add_furniture_from_link(body: LinkScrapeRequest, session_id: str = "default"):
    """Extract furniture details from a retailer product URL."""
    url = body.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL must start with http/https")

    try:
        furniture = await ai_service.extract_furniture_from_url(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract furniture from URL: {str(e)}")

    storage.add_furniture(furniture, session_id)

    return FurnitureUploadResponse(
        furniture=furniture,
        message=f"Successfully extracted: {furniture.name}",
    )


@router.get("", response_model=list[FurnitureItem])
async def list_furniture(session_id: str = "default"):
    """List all furniture items in the session."""
    return storage.get_all_furniture(session_id)


@router.get("/{furniture_id}", response_model=FurnitureItem)
async def get_furniture(furniture_id: str, session_id: str = "default"):
    """Get a single furniture item by ID."""
    item = storage.get_furniture(furniture_id, session_id)
    if not item:
        raise HTTPException(status_code=404, detail="Furniture item not found")
    return item


@router.put("/{furniture_id}/placement", response_model=FurnitureItem)
async def update_placement(
    furniture_id: str,
    placement: PlacementUpdate,
    session_id: str = "default",
):
    """Update placement of a furniture item on the floor plan."""
    item = storage.update_furniture_placement(furniture_id, placement, session_id)
    if not item:
        raise HTTPException(status_code=404, detail="Furniture item not found")
    return item


@router.delete("/{furniture_id}")
async def delete_furniture(furniture_id: str, session_id: str = "default"):
    """Remove a furniture item from the session."""
    deleted = storage.delete_furniture(furniture_id, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Furniture item not found")
    return {"message": "Furniture item removed"}
