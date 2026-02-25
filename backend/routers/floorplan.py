"""
Floor plan endpoints:
  POST /api/floorplan/upload   - Upload a floor plan image for AI analysis
  GET  /api/floorplan          - Get the current floor plan
  POST /api/floorplan/suggest-placements - AI-suggest furniture placement
"""
import os
import uuid
import aiofiles
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from models.schemas import FloorPlan
import services.storage as storage
import services.ai_service as ai_service

router = APIRouter()

UPLOAD_DIR = "uploads/floorplans"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=FloorPlan)
async def upload_floor_plan(
    file: UploadFile = File(...),
    session_id: str = Form(default="default"),
):
    """Upload a floor plan image. Claude analyzes rooms and dimensions."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    if len(image_data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 20 MB)")

    ext = os.path.splitext(file.filename or "floorplan.jpg")[1] or ".jpg"
    saved_filename = f"{uuid.uuid4()}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    async with aiofiles.open(saved_path, "wb") as f:
        await f.write(image_data)

    try:
        floor_plan = await ai_service.analyze_floor_plan(image_data, file.filename or "floorplan.jpg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Floor plan analysis failed: {str(e)}")

    floor_plan.image_path = f"/uploads/floorplans/{saved_filename}"
    storage.set_floor_plan(floor_plan, session_id)

    return floor_plan


@router.get("", response_model=FloorPlan | None)
async def get_floor_plan(session_id: str = "default"):
    """Get the current session's floor plan."""
    return storage.get_floor_plan(session_id)


@router.post("/suggest-placements", response_model=list)
async def suggest_placements(session_id: str = "default"):
    """
    AI suggests optimal placement for all unplaced furniture items
    based on the uploaded floor plan.
    """
    floor_plan = storage.get_floor_plan(session_id)
    if not floor_plan:
        raise HTTPException(status_code=400, detail="No floor plan uploaded yet")

    furniture_items = storage.get_all_furniture(session_id)
    if not furniture_items:
        raise HTTPException(status_code=400, detail="No furniture items in session")

    try:
        updated_items = await ai_service.suggest_placements(floor_plan, furniture_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Placement suggestion failed: {str(e)}")

    # Persist updated placements
    session = storage.get_or_create_session(session_id)
    session.furniture_items = updated_items

    return updated_items
