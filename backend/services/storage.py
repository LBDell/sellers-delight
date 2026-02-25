"""
In-memory storage for the staging session.
In production this would be replaced with a proper database.
"""
from typing import Dict, Optional
from models.schemas import StagingSession, FurnitureItem, FloorPlan, PlacementUpdate, Placement
import uuid

# Global in-memory store: session_id -> StagingSession
_sessions: Dict[str, StagingSession] = {}

DEFAULT_SESSION_ID = "default"


def get_or_create_session(session_id: str = DEFAULT_SESSION_ID) -> StagingSession:
    if session_id not in _sessions:
        _sessions[session_id] = StagingSession(id=session_id)
    return _sessions[session_id]


def get_session(session_id: str = DEFAULT_SESSION_ID) -> Optional[StagingSession]:
    return _sessions.get(session_id)


def add_furniture(item: FurnitureItem, session_id: str = DEFAULT_SESSION_ID) -> FurnitureItem:
    session = get_or_create_session(session_id)
    session.furniture_items.append(item)
    return item


def get_furniture(furniture_id: str, session_id: str = DEFAULT_SESSION_ID) -> Optional[FurnitureItem]:
    session = get_or_create_session(session_id)
    return next((f for f in session.furniture_items if f.id == furniture_id), None)


def get_all_furniture(session_id: str = DEFAULT_SESSION_ID) -> list[FurnitureItem]:
    session = get_or_create_session(session_id)
    return session.furniture_items


def update_furniture_placement(
    furniture_id: str,
    placement: PlacementUpdate,
    session_id: str = DEFAULT_SESSION_ID,
) -> Optional[FurnitureItem]:
    session = get_or_create_session(session_id)
    for item in session.furniture_items:
        if item.id == furniture_id:
            item.placement = Placement(
                x=placement.x,
                y=placement.y,
                rotation=placement.rotation,
                room_id=placement.room_id,
            )
            return item
    return None


def delete_furniture(furniture_id: str, session_id: str = DEFAULT_SESSION_ID) -> bool:
    session = get_or_create_session(session_id)
    original_len = len(session.furniture_items)
    session.furniture_items = [f for f in session.furniture_items if f.id != furniture_id]
    return len(session.furniture_items) < original_len


def set_floor_plan(floor_plan: FloorPlan, session_id: str = DEFAULT_SESSION_ID) -> FloorPlan:
    session = get_or_create_session(session_id)
    session.floor_plan = floor_plan
    return floor_plan


def get_floor_plan(session_id: str = DEFAULT_SESSION_ID) -> Optional[FloorPlan]:
    session = get_or_create_session(session_id)
    return session.floor_plan
