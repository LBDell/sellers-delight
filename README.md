# Furniture Staging Tool – StreetEasy

> Visualize your own furniture in any StreetEasy apartment listing before you move in.

## Overview

Upload photos or retailer links for furniture you own. Claude AI identifies each piece, estimates its dimensions, and automatically places it on the apartment floor plan so you can see exactly how your space will look.

## Features

| Feature | Details |
|---|---|
| **Image upload** | Drag-and-drop furniture photos; Claude identifies name, type, dimensions, and room |
| **Retailer links** | Paste links from IKEA, Wayfair, CB2, etc.; AI scrapes and extracts product details |
| **Floor plan analysis** | Upload any floor plan image; Claude detects rooms and their pixel boundaries |
| **AI auto-placement** | One click places all furniture in the most appropriate rooms |
| **Manual drag-and-drop** | Drag pieces from the sidebar directly onto the floor plan canvas |
| **Rotation** | Select a piece and click the blue handle to rotate 90° |
| **Multi-room awareness** | AI assigns each item to the correct room (sofa → living room, bed → bedroom, etc.) |

## Architecture

```
sellers-delight/
├── backend/               # FastAPI Python API
│   ├── main.py            # App entry point + CORS
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py     # Pydantic models
│   ├── routers/
│   │   ├── furniture.py   # Upload image / link endpoints
│   │   ├── floorplan.py   # Floor plan upload + AI analysis
│   │   └── placement.py   # Placement CRUD
│   └── services/
│       ├── ai_service.py  # Claude API integration
│       └── storage.py     # In-memory session store
└── frontend/              # React + TypeScript + Vite
    └── src/
        ├── App.tsx
        ├── context/
        │   └── AppContext.tsx   # Global state
        ├── components/
        │   ├── FurnitureUpload.tsx   # Step 1: add furniture
        │   ├── FloorPlanUpload.tsx   # Step 2: upload floor plan
        │   ├── RoomStager.tsx        # Step 3: interactive canvas
        │   └── FurnitureLibrary.tsx  # Sidebar with item list
        ├── api/
        │   └── client.ts      # Axios API wrapper
        └── types/
            └── index.ts       # Shared TypeScript types
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Anthropic API key

### 1. Set up backend

```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Set up frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Or: one command

```bash
ANTHROPIC_API_KEY=your_key_here bash start.sh
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/furniture/upload` | Upload furniture image (multipart) |
| `POST` | `/api/furniture/link` | Extract from retailer URL |
| `GET` | `/api/furniture` | List all furniture |
| `DELETE` | `/api/furniture/{id}` | Remove item |
| `PUT` | `/api/placement/{id}` | Update item position |
| `POST` | `/api/floorplan/upload` | Upload + analyze floor plan |
| `GET` | `/api/floorplan` | Get current floor plan |
| `POST` | `/api/floorplan/suggest-placements` | AI auto-place all furniture |

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## User Story

> As a StreetEasy user, I want to stage apartment images with furniture I actually own, so I can visualize if the space will work for me.

### Acceptance Criteria
- [x] User can upload furniture images
- [x] User can paste retailer URLs (IKEA, Wayfair, CB2, etc.)
- [x] System identifies furniture via Claude AI vision + web parsing
- [x] System calculates furniture dimensions and places items on floor plan
- [x] System understands which room each item belongs in
- [x] User can drag furniture to adjust placement
- [x] User can rotate furniture in 90° increments
- [x] AI can auto-suggest optimal placements for all items
