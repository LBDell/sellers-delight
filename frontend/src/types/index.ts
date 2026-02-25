export type FurnitureType =
  | 'sofa'
  | 'chair'
  | 'bed'
  | 'table'
  | 'desk'
  | 'dresser'
  | 'bookshelf'
  | 'cabinet'
  | 'wardrobe'
  | 'coffee_table'
  | 'dining_table'
  | 'nightstand'
  | 'tv_stand'
  | 'ottoman'
  | 'bench'
  | 'other'

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'dining_room'
  | 'office'
  | 'bathroom'
  | 'kitchen'
  | 'hallway'
  | 'other'

export interface Dimensions {
  width: number  // cm
  depth: number  // cm
  height: number // cm
}

export interface Placement {
  x: number       // pixels on floor plan canvas
  y: number
  rotation: number
  room_id?: string
}

export interface FurnitureItem {
  id: string
  name: string
  type: FurnitureType
  room: RoomType
  dimensions: Dimensions
  color?: string
  material?: string
  description?: string
  image_url?: string
  source_url?: string
  placement?: Placement
  confidence: number
  is_identified: boolean
}

export interface RoomBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Room {
  id: string
  name: string
  type: RoomType
  bounds: RoomBounds
  dimensions_meters: { width?: number; height?: number }
}

export interface FloorPlan {
  id: string
  image_path: string
  rooms: Room[]
  scale_pixels_per_meter: number
  total_width_px: number
  total_height_px: number
  description?: string
}

export type AppStep = 'upload_furniture' | 'upload_floorplan' | 'stage'
