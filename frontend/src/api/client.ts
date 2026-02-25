import axios from 'axios'
import type { FurnitureItem, FloorPlan, Placement } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// ── Furniture ──────────────────────────────────────────────────────────────

export async function uploadFurnitureImage(file: File, sessionId = 'default'): Promise<FurnitureItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('session_id', sessionId)
  const res = await api.post('/furniture/upload', form)
  return res.data.furniture
}

export async function addFurnitureFromLink(url: string, sessionId = 'default'): Promise<FurnitureItem> {
  const res = await api.post(`/furniture/link?session_id=${sessionId}`, { url })
  return res.data.furniture
}

export async function listFurniture(sessionId = 'default'): Promise<FurnitureItem[]> {
  const res = await api.get(`/furniture?session_id=${sessionId}`)
  return res.data
}

export async function deleteFurniture(id: string, sessionId = 'default'): Promise<void> {
  await api.delete(`/furniture/${id}?session_id=${sessionId}`)
}

export async function updatePlacement(
  furnitureId: string,
  placement: { x: number; y: number; rotation: number; room_id?: string },
  sessionId = 'default',
): Promise<FurnitureItem> {
  const res = await api.put(`/placement/${furnitureId}?session_id=${sessionId}`, placement)
  return res.data
}

// ── Floor Plan ─────────────────────────────────────────────────────────────

export async function uploadFloorPlan(file: File, sessionId = 'default'): Promise<FloorPlan> {
  const form = new FormData()
  form.append('file', file)
  form.append('session_id', sessionId)
  const res = await api.post('/floorplan/upload', form)
  return res.data
}

export async function getFloorPlan(sessionId = 'default'): Promise<FloorPlan | null> {
  const res = await api.get(`/floorplan?session_id=${sessionId}`)
  return res.data
}

export async function suggestPlacements(sessionId = 'default'): Promise<FurnitureItem[]> {
  const res = await api.post(`/floorplan/suggest-placements?session_id=${sessionId}`)
  return res.data
}

export async function resetPlacements(sessionId = 'default'): Promise<void> {
  await api.post(`/placement/reset?session_id=${sessionId}`)
}
