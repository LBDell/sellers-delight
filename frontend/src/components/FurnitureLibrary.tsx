import { useApp } from '../context/AppContext'
import type { FurnitureItem, RoomType } from '../types'

const ROOM_LABELS: Record<RoomType, string> = {
  living_room: 'Living Room',
  bedroom: 'Bedroom',
  dining_room: 'Dining Room',
  office: 'Office',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  other: 'Other',
}

const ROOM_COLORS: Record<RoomType, string> = {
  living_room: 'bg-blue-100 text-blue-700',
  bedroom: 'bg-purple-100 text-purple-700',
  dining_room: 'bg-orange-100 text-orange-700',
  office: 'bg-gray-100 text-gray-700',
  bathroom: 'bg-teal-100 text-teal-700',
  kitchen: 'bg-yellow-100 text-yellow-700',
  hallway: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-600',
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span title={`AI confidence: ${Math.round(confidence * 100)}%`} className={`inline-block w-2 h-2 rounded-full ${color}`} />
  )
}

interface FurnitureCardProps {
  item: FurnitureItem
  onDragStart: (item: FurnitureItem) => void
  isPlaced: boolean
}

function FurnitureCard({ item, onDragStart, isPlaced }: FurnitureCardProps) {
  const { removeFurniture } = useApp()
  const roomColor = ROOM_COLORS[item.room] ?? 'bg-gray-100 text-gray-600'

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item)}
      className={`bg-white border rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow
        ${isPlaced ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
    >
      {/* Thumbnail */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100"
        />
      ) : (
        <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      )}

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              View source ↗
            </a>
          )}
        </div>
        <button
          onClick={() => removeFurniture(item.id)}
          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roomColor}`}>
          {ROOM_LABELS[item.room]}
        </span>
        <ConfidenceDot confidence={item.confidence} />
        {isPlaced && (
          <span className="text-xs text-green-600 font-medium">Placed ✓</span>
        )}
      </div>

      <div className="mt-1.5 text-xs text-gray-400">
        {item.dimensions.width}W × {item.dimensions.depth}D × {item.dimensions.height}H cm
        {item.color && <span className="ml-1">· {item.color}</span>}
      </div>
    </div>
  )
}

interface FurnitureLibraryProps {
  onDragStart: (item: FurnitureItem) => void
}

export default function FurnitureLibrary({ onDragStart }: FurnitureLibraryProps) {
  const { furniture, suggestPlacements, loading } = useApp()

  const placedIds = new Set(furniture.filter((f) => f.placement).map((f) => f.id))
  const unplaced = furniture.filter((f) => !f.placement)
  const placed = furniture.filter((f) => f.placement)

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">
          Your Furniture <span className="text-gray-400 font-normal">({furniture.length})</span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Drag items onto the floor plan</p>
      </div>

      {/* AI suggest button */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={suggestPlacements}
          disabled={loading || furniture.length === 0}
          className="w-full bg-brand-500 text-white text-sm py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Thinking...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Auto-Place All
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {furniture.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No furniture added yet. Go back to add items.
          </p>
        ) : (
          <>
            {unplaced.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Unplaced ({unplaced.length})
                </p>
                <div className="space-y-2">
                  {unplaced.map((item) => (
                    <FurnitureCard
                      key={item.id}
                      item={item}
                      onDragStart={onDragStart}
                      isPlaced={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {placed.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Placed ({placed.length})
                </p>
                <div className="space-y-2">
                  {placed.map((item) => (
                    <FurnitureCard
                      key={item.id}
                      item={item}
                      onDragStart={onDragStart}
                      isPlaced={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
