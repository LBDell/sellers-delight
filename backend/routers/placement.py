"""
Placement endpoints (convenience wrappers around furniture placement updates):
  GET  /api/placement          - Get all current placements
  PUT  /api/placement/{id}     - Update a single furniture placement
  POST /api/placement/reset    - Clear all placements
"""
from fastapi import APIRouter, HTTPException
from models.schemas import PlacementUpdate, FurnitureItem
import services.storage as storage

router = APIRouter()


@router.get("", response_model=list[FurnitureItem])
async def get_all_placements(session_id: str = "default"):
    """Return all furniture items with their current placements."""
    return storage.get_all_furniture(session_id)


@router.put("/{furniture_id}", response_model=FurnitureItem)
async def update_placement(
    furniture_id: str,
    placement: PlacementUpdate,
    session_id: str = "default",
):
    """Move or rotate a furniture item on the floor plan."""
    item = storage.update_furniture_placement(furniture_id, placement, session_id)
    if not item:
        raise HTTPException(status_code=404, detail="Furniture item not found")
    return item


@router.post("/reset")
async def reset_placements(session_id: str = "default"):
    """Clear all furniture placements (keeps furniture in library)."""
    items = storage.get_all_furniture(session_id)
    for item in items:
        item.placement = None
    return {"message": f"Cleared placements for {len(items)} items"}
