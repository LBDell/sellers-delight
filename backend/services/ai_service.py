"""
AI service using Claude API for:
- Furniture identification from uploaded images
- Product info extraction from retailer URLs
- Floor plan room detection and analysis
- Automated furniture placement suggestions
"""
import anthropic
import json
import base64
import httpx
from bs4 import BeautifulSoup
from typing import Optional
from models.schemas import (
    FurnitureItem,
    FurnitureType,
    RoomType,
    Dimensions,
    FloorPlan,
    Room,
    RoomBounds,
    Placement,
)
import uuid

client = anthropic.Anthropic()


def _get_media_type(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".png"):
        return "image/png"
    elif lower.endswith(".gif"):
        return "image/gif"
    elif lower.endswith(".webp"):
        return "image/webp"
    return "image/jpeg"


def _parse_furniture_json(raw: str) -> dict:
    """Extract JSON from Claude's response, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


async def identify_furniture_from_image(image_data: bytes, filename: str) -> FurnitureItem:
    """Use Claude vision to identify furniture from an uploaded image."""
    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = _get_media_type(filename)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Analyze this furniture image and return ONLY a JSON object with these exact fields:\n"
                            "{\n"
                            '  "name": "specific furniture name (e.g. 3-seat sofa, king bed frame)",\n'
                            '  "type": "one of: sofa, chair, bed, table, desk, dresser, bookshelf, cabinet, wardrobe, coffee_table, dining_table, nightstand, tv_stand, ottoman, bench, other",\n'
                            '  "room": "one of: living_room, bedroom, dining_room, office, bathroom, kitchen, hallway, other",\n'
                            '  "dimensions": {"width": <cm>, "depth": <cm>, "height": <cm>},\n'
                            '  "color": "primary color",\n'
                            '  "material": "primary material",\n'
                            '  "description": "brief one-sentence description",\n'
                            '  "confidence": <0.0-1.0>\n'
                            "}\n"
                            "Estimate dimensions based on typical sizes for this furniture type. "
                            "Return ONLY valid JSON, no markdown, no extra text."
                        ),
                    },
                ],
            }
        ],
    )

    data = _parse_furniture_json(message.content[0].text)

    dims = data.get("dimensions", {})
    return FurnitureItem(
        id=str(uuid.uuid4()),
        name=data.get("name", "Unknown Furniture"),
        type=FurnitureType(data.get("type", "other")),
        room=RoomType(data.get("room", "other")),
        dimensions=Dimensions(
            width=float(dims.get("width", 100)),
            depth=float(dims.get("depth", 80)),
            height=float(dims.get("height", 75)),
        ),
        color=data.get("color"),
        material=data.get("material"),
        description=data.get("description"),
        confidence=float(data.get("confidence", 0.7)),
        is_identified=True,
    )


async def extract_furniture_from_url(url: str) -> FurnitureItem:
    """Scrape a retailer product page and use Claude to extract furniture details."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as http:
        resp = await http.get(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            },
        )
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")

    # Extract meaningful text content
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    page_text = soup.get_text(separator="\n", strip=True)
    # Truncate to avoid token limits
    page_text = page_text[:6000]

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": (
                    f"The following is text scraped from a furniture product page at: {url}\n\n"
                    f"PAGE CONTENT:\n{page_text}\n\n"
                    "Extract furniture details and return ONLY a JSON object:\n"
                    "{\n"
                    '  "name": "product name",\n'
                    '  "type": "one of: sofa, chair, bed, table, desk, dresser, bookshelf, cabinet, wardrobe, coffee_table, dining_table, nightstand, tv_stand, ottoman, bench, other",\n'
                    '  "room": "one of: living_room, bedroom, dining_room, office, bathroom, kitchen, hallway, other",\n'
                    '  "dimensions": {"width": <cm>, "depth": <cm>, "height": <cm>},\n'
                    '  "color": "primary color or color options",\n'
                    '  "material": "primary material",\n'
                    '  "description": "brief one-sentence product description",\n'
                    '  "confidence": <0.0-1.0>\n'
                    "}\n"
                    "Convert any inch measurements to centimeters (1 inch = 2.54 cm). "
                    "Return ONLY valid JSON, no markdown, no extra text."
                ),
            }
        ],
    )

    data = _parse_furniture_json(message.content[0].text)

    dims = data.get("dimensions", {})
    return FurnitureItem(
        id=str(uuid.uuid4()),
        name=data.get("name", "Unknown Furniture"),
        type=FurnitureType(data.get("type", "other")),
        room=RoomType(data.get("room", "other")),
        dimensions=Dimensions(
            width=float(dims.get("width", 100)),
            depth=float(dims.get("depth", 80)),
            height=float(dims.get("height", 75)),
        ),
        color=data.get("color"),
        material=data.get("material"),
        description=data.get("description"),
        source_url=url,
        confidence=float(data.get("confidence", 0.8)),
        is_identified=True,
    )


async def analyze_floor_plan(image_data: bytes, filename: str) -> FloorPlan:
    """
    Use Claude vision to analyze a floor plan image.
    Returns room boundaries and estimated real-world dimensions.
    """
    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = _get_media_type(filename)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Analyze this floor plan image. The image is 800x600 pixels.\n"
                            "Identify all rooms and their approximate pixel bounding boxes within this 800x600 image.\n\n"
                            "Return ONLY a JSON object:\n"
                            "{\n"
                            '  "description": "brief description of the floor plan",\n'
                            '  "total_area_sqm": <estimated total area in square meters>,\n'
                            '  "scale_pixels_per_meter": <estimated pixels per meter>,\n'
                            '  "rooms": [\n'
                            "    {\n"
                            '      "name": "room name (e.g. Living Room, Master Bedroom)",\n'
                            '      "type": "one of: living_room, bedroom, dining_room, office, bathroom, kitchen, hallway, other",\n'
                            '      "bounds": {"x": <px>, "y": <px>, "width": <px>, "height": <px>},\n'
                            '      "dimensions_meters": {"width": <m>, "height": <m>}\n'
                            "    }\n"
                            "  ]\n"
                            "}\n"
                            "Be precise with pixel coordinates relative to the 800x600 image. "
                            "Return ONLY valid JSON, no markdown, no extra text."
                        ),
                    },
                ],
            }
        ],
    )

    data = _parse_furniture_json(message.content[0].text)

    rooms = []
    for r in data.get("rooms", []):
        b = r.get("bounds", {})
        rooms.append(
            Room(
                id=str(uuid.uuid4()),
                name=r.get("name", "Room"),
                type=RoomType(r.get("type", "other")),
                bounds=RoomBounds(
                    x=float(b.get("x", 0)),
                    y=float(b.get("y", 0)),
                    width=float(b.get("width", 200)),
                    height=float(b.get("height", 150)),
                ),
                dimensions_meters=r.get("dimensions_meters", {}),
            )
        )

    return FloorPlan(
        id=str(uuid.uuid4()),
        image_path="",  # Set by caller
        rooms=rooms,
        scale_pixels_per_meter=float(data.get("scale_pixels_per_meter", 40.0)),
        total_width_px=800,
        total_height_px=600,
        description=data.get("description"),
    )


async def suggest_placements(
    floor_plan: FloorPlan, furniture_items: list[FurnitureItem]
) -> list[FurnitureItem]:
    """
    Use Claude to suggest optimal placement for each furniture item
    within the appropriate room on the floor plan.
    """
    rooms_summary = [
        {
            "id": r.id,
            "name": r.name,
            "type": r.type.value,
            "bounds": {
                "x": r.bounds.x,
                "y": r.bounds.y,
                "width": r.bounds.width,
                "height": r.bounds.height,
            },
            "dimensions_meters": r.dimensions_meters,
        }
        for r in floor_plan.rooms
    ]

    furniture_summary = [
        {
            "id": f.id,
            "name": f.name,
            "type": f.type.value,
            "preferred_room": f.room.value,
            "dimensions_cm": {
                "width": f.dimensions.width,
                "depth": f.dimensions.depth,
            },
        }
        for f in furniture_items
        if f.placement is None
    ]

    if not furniture_summary:
        return furniture_items

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Floor plan rooms (pixel coordinates on 800x600 canvas):\n"
                    f"{json.dumps(rooms_summary, indent=2)}\n\n"
                    f"Scale: {floor_plan.scale_pixels_per_meter} pixels per meter\n\n"
                    f"Furniture items to place:\n"
                    f"{json.dumps(furniture_summary, indent=2)}\n\n"
                    "For each furniture item, suggest a pixel position (x, y) within the best matching room, "
                    "a rotation (0, 90, 180, or 270 degrees), and the room_id.\n"
                    "Position should be the top-left corner of the furniture footprint scaled to pixels.\n"
                    "Ensure furniture fits within room bounds and doesn't overlap.\n\n"
                    "Return ONLY a JSON array:\n"
                    "[\n"
                    "  {\n"
                    '    "furniture_id": "<id>",\n'
                    '    "room_id": "<room_id>",\n'
                    '    "x": <pixels>,\n'
                    '    "y": <pixels>,\n'
                    '    "rotation": <0|90|180|270>\n'
                    "  }\n"
                    "]\n"
                    "Return ONLY valid JSON, no markdown, no extra text."
                ),
            }
        ],
    )

    placements = _parse_furniture_json(message.content[0].text)
    if not isinstance(placements, list):
        return furniture_items

    placement_map = {p["furniture_id"]: p for p in placements}

    updated = []
    for item in furniture_items:
        if item.id in placement_map and item.placement is None:
            p = placement_map[item.id]
            item.placement = Placement(
                x=float(p.get("x", 100)),
                y=float(p.get("y", 100)),
                rotation=float(p.get("rotation", 0)),
                room_id=p.get("room_id"),
            )
        updated.append(item)

    return updated
