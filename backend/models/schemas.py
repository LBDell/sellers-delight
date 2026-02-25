from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uuid


class FurnitureType(str, Enum):
    sofa = "sofa"
    chair = "chair"
    bed = "bed"
    table = "table"
    desk = "desk"
    dresser = "dresser"
    bookshelf = "bookshelf"
    cabinet = "cabinet"
    wardrobe = "wardrobe"
    coffee_table = "coffee_table"
    dining_table = "dining_table"
    nightstand = "nightstand"
    tv_stand = "tv_stand"
    ottoman = "ottoman"
    bench = "bench"
    other = "other"


class RoomType(str, Enum):
    living_room = "living_room"
    bedroom = "bedroom"
    dining_room = "dining_room"
    office = "office"
    bathroom = "bathroom"
    kitchen = "kitchen"
    hallway = "hallway"
    other = "other"


class Dimensions(BaseModel):
    width: float = Field(..., description="Width in centimeters")
    depth: float = Field(..., description="Depth in centimeters")
    height: float = Field(..., description="Height in centimeters")


class Placement(BaseModel):
    x: float = Field(..., description="X position on floor plan (pixels)")
    y: float = Field(..., description="Y position on floor plan (pixels)")
    rotation: float = Field(default=0.0, description="Rotation in degrees")
    room_id: Optional[str] = None


class FurnitureItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: FurnitureType = FurnitureType.other
    room: RoomType = RoomType.other
    dimensions: Dimensions
    color: Optional[str] = None
    material: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    source_image_path: Optional[str] = None
    placement: Optional[Placement] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_identified: bool = False


class FurnitureUploadResponse(BaseModel):
    furniture: FurnitureItem
    message: str


class RoomBounds(BaseModel):
    x: float
    y: float
    width: float
    height: float


class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: RoomType
    bounds: RoomBounds
    dimensions_meters: dict = Field(default_factory=dict)


class FloorPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_path: str
    rooms: List[Room] = Field(default_factory=list)
    scale_pixels_per_meter: float = Field(default=100.0)
    total_width_px: int = 800
    total_height_px: int = 600
    description: Optional[str] = None


class PlacementUpdate(BaseModel):
    x: float
    y: float
    rotation: float = 0.0
    room_id: Optional[str] = None


class StagingSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    floor_plan: Optional[FloorPlan] = None
    furniture_items: List[FurnitureItem] = Field(default_factory=list)
    listing_url: Optional[str] = None


class LinkScrapeRequest(BaseModel):
    url: str
