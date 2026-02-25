import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Transformer } from 'react-konva'
import useImage from 'use-image'
import { useApp } from '../context/AppContext'
import FurnitureLibrary from './FurnitureLibrary'
import type { FurnitureItem, Room } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CANVAS_W = 800
const CANVAS_H = 600
const PIXELS_PER_CM = 0.5 // default scale: 1 cm → 0.5 px on canvas

const ROOM_TYPE_COLORS: Record<string, string> = {
  living_room: '#dbeafe',
  bedroom: '#ede9fe',
  dining_room: '#ffedd5',
  office: '#f3f4f6',
  bathroom: '#ccfbf1',
  kitchen: '#fef9c3',
  hallway: '#fce7f3',
  other: '#f3f4f6',
}

const ROOM_STROKE_COLORS: Record<string, string> = {
  living_room: '#93c5fd',
  bedroom: '#c4b5fd',
  dining_room: '#fdba74',
  office: '#d1d5db',
  bathroom: '#5eead4',
  kitchen: '#fde047',
  hallway: '#f9a8d4',
  other: '#d1d5db',
}

// ─────────────────────────────────────────────────────────────────────────────
// Furniture footprint on canvas (scaled from cm → pixels)
// ─────────────────────────────────────────────────────────────────────────────
function getFurniturePx(item: FurnitureItem, scale: number) {
  return {
    w: Math.max(20, item.dimensions.width * scale),
    h: Math.max(16, item.dimensions.depth * scale),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor plan background image
// ─────────────────────────────────────────────────────────────────────────────
function FloorPlanImage({ src }: { src: string }) {
  const [image] = useImage(src)
  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={CANVAS_W}
      height={CANVAS_H}
      opacity={0.85}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Room overlay
// ─────────────────────────────────────────────────────────────────────────────
function RoomOverlay({ room }: { room: Room }) {
  const fill = ROOM_TYPE_COLORS[room.type] ?? '#f3f4f6'
  const stroke = ROOM_STROKE_COLORS[room.type] ?? '#d1d5db'
  return (
    <Group>
      <Rect
        x={room.bounds.x}
        y={room.bounds.y}
        width={room.bounds.width}
        height={room.bounds.height}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        cornerRadius={4}
        opacity={0.5}
      />
      <Text
        x={room.bounds.x + 6}
        y={room.bounds.y + 6}
        text={room.name}
        fontSize={11}
        fontStyle="bold"
        fill="#374151"
        opacity={0.9}
      />
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable furniture piece
// ─────────────────────────────────────────────────────────────────────────────
interface FurniturePieceProps {
  item: FurnitureItem
  scale: number
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  onRotate: () => void
}

function FurniturePiece({
  item,
  scale,
  isSelected,
  onSelect,
  onDragEnd,
  onRotate,
}: FurniturePieceProps) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)
  const { w, h } = getFurniturePx(item, scale)
  const x = item.placement?.x ?? 50
  const y = item.placement?.y ?? 50
  const rotation = item.placement?.rotation ?? 0

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Color by room type
  const fill = ROOM_TYPE_COLORS[item.room] ?? '#e5e7eb'
  const stroke = isSelected ? '#3b5bdb' : (ROOM_STROKE_COLORS[item.room] ?? '#9ca3af')

  return (
    <>
      <Group
        x={x}
        y={y}
        rotation={rotation}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onDragEnd(e.target.x(), e.target.y())
        }}
      >
        <Rect
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1.5}
          cornerRadius={3}
          shadowEnabled={isSelected}
          shadowColor="#3b5bdb"
          shadowBlur={8}
          shadowOpacity={0.3}
        />
        <Text
          text={item.name}
          width={w}
          height={h}
          align="center"
          verticalAlign="middle"
          fontSize={Math.min(11, w / 6)}
          fontStyle="bold"
          fill="#1f2937"
          padding={4}
          wrap="word"
        />
        {/* Rotate handle indicator */}
        {isSelected && (
          <Rect
            x={w / 2 - 6}
            y={-18}
            width={12}
            height={12}
            fill="#3b5bdb"
            cornerRadius={6}
            onClick={(e) => {
              e.cancelBubble = true
              onRotate()
            }}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          enabledAnchors={[]}
          boundBoxFunc={(oldBox, newBox) => newBox}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main RoomStager component
// ─────────────────────────────────────────────────────────────────────────────
export default function RoomStager() {
  const { floorPlan, furniture, updateItemPlacement, setStep, loading } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<FurnitureItem | null>(null)
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scale = floorPlan?.scale_pixels_per_meter
    ? floorPlan.scale_pixels_per_meter / 100  // pixels-per-meter → pixels-per-cm
    : PIXELS_PER_CM

  // Deselect on stage click
  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }
  }, [])

  // Handle drag from library sidebar
  const handleLibraryDragStart = useCallback((item: FurnitureItem) => {
    setDraggedItem(item)
  }, [])

  const handleCanvasDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!draggedItem) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      await updateItemPlacement(draggedItem.id, x, y, draggedItem.placement?.rotation ?? 0)
      setDraggedItem(null)
    },
    [draggedItem, updateItemPlacement],
  )

  const handleFurnitureDragEnd = useCallback(
    async (item: FurnitureItem, x: number, y: number) => {
      await updateItemPlacement(item.id, x, y, item.placement?.rotation ?? 0, item.placement?.room_id)
    },
    [updateItemPlacement],
  )

  const handleRotate = useCallback(
    async (item: FurnitureItem) => {
      const current = item.placement?.rotation ?? 0
      const next = (current + 90) % 360
      await updateItemPlacement(
        item.id,
        item.placement?.x ?? 50,
        item.placement?.y ?? 50,
        next,
        item.placement?.room_id,
      )
    },
    [updateItemPlacement],
  )

  const placedFurniture = furniture.filter((f) => f.placement)

  const imageSrc = floorPlan?.image_path
    ? floorPlan.image_path.startsWith('/')
      ? floorPlan.image_path
      : `/${floorPlan.image_path}`
    : null

  if (!floorPlan) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>No floor plan loaded.</p>
        <button
          onClick={() => setStep('upload_floorplan')}
          className="mt-3 text-brand-500 hover:underline text-sm"
        >
          ← Upload a floor plan
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar: Furniture Library */}
      <div className="w-56 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <FurnitureLibrary onDragStart={handleLibraryDragStart} />
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('upload_floorplan')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Floor Plan
          </button>
          <div className="flex-1" />
          {selectedId && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Click the blue dot above selected item to rotate 90°
            </span>
          )}
          {loading && (
            <span className="text-xs text-brand-600 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-crosshair"
          style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          <Stage
            ref={stageRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleStageClick}
          >
            <Layer>
              {/* Floor plan image background */}
              {imageSrc && <FloorPlanImage src={imageSrc} />}

              {/* Room overlays */}
              {floorPlan.rooms.map((room) => (
                <RoomOverlay key={room.id} room={room} />
              ))}

              {/* Placed furniture */}
              {placedFurniture.map((item) => (
                <FurniturePiece
                  key={item.id}
                  item={item}
                  scale={scale}
                  isSelected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onDragEnd={(x, y) => handleFurnitureDragEnd(item, x, y)}
                  onRotate={() => handleRotate(item)}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Rooms:</span>
          {floorPlan.rooms.map((room) => (
            <span key={room.id} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm inline-block border"
                style={{
                  background: ROOM_TYPE_COLORS[room.type] ?? '#f3f4f6',
                  borderColor: ROOM_STROKE_COLORS[room.type] ?? '#d1d5db',
                }}
              />
              {room.name}
            </span>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <strong className="text-gray-600">How to stage:</strong>
          {' '}Drag items from the sidebar onto the floor plan · Click an item to select · Blue dot = rotate 90° · Use "AI Auto-Place All" for instant suggestions
        </div>
      </div>
    </div>
  )
}
