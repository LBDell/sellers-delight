import React, { createContext, useContext, useState, useCallback } from 'react'
import type { FurnitureItem, FloorPlan, AppStep } from '../types'
import * as api from '../api/client'

interface AppContextValue {
  step: AppStep
  setStep: (step: AppStep) => void

  furniture: FurnitureItem[]
  floorPlan: FloorPlan | null
  loading: boolean
  error: string | null

  addFurnitureImage: (file: File) => Promise<void>
  addFurnitureLink: (url: string) => Promise<void>
  removeFurniture: (id: string) => Promise<void>

  uploadFloorPlan: (file: File) => Promise<void>
  suggestPlacements: () => Promise<void>
  updateItemPlacement: (
    id: string,
    x: number,
    y: number,
    rotation: number,
    roomId?: string,
  ) => Promise<void>

  clearError: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<AppStep>('upload_furniture')
  const [furniture, setFurniture] = useState<FurnitureItem[]>([])
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true)
    setError(null)
    try {
      await fn()
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'An error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const addFurnitureImage = useCallback(
    (file: File) =>
      withLoading(async () => {
        const item = await api.uploadFurnitureImage(file)
        setFurniture((prev) => [...prev, item])
      }),
    [withLoading],
  )

  const addFurnitureLink = useCallback(
    (url: string) =>
      withLoading(async () => {
        const item = await api.addFurnitureFromLink(url)
        setFurniture((prev) => [...prev, item])
      }),
    [withLoading],
  )

  const removeFurniture = useCallback(
    (id: string) =>
      withLoading(async () => {
        await api.deleteFurniture(id)
        setFurniture((prev) => prev.filter((f) => f.id !== id))
      }),
    [withLoading],
  )

  const uploadFloorPlanFn = useCallback(
    (file: File) =>
      withLoading(async () => {
        const fp = await api.uploadFloorPlan(file)
        setFloorPlan(fp)
      }),
    [withLoading],
  )

  const suggestPlacements = useCallback(
    () =>
      withLoading(async () => {
        const updated = await api.suggestPlacements()
        setFurniture(updated)
      }),
    [withLoading],
  )

  const updateItemPlacement = useCallback(
    (id: string, x: number, y: number, rotation: number, roomId?: string) =>
      withLoading(async () => {
        const updated = await api.updatePlacement(id, { x, y, rotation, room_id: roomId })
        setFurniture((prev) => prev.map((f) => (f.id === id ? updated : f)))
      }),
    [withLoading],
  )

  const clearError = useCallback(() => setError(null), [])

  return (
    <AppContext.Provider
      value={{
        step,
        setStep,
        furniture,
        floorPlan,
        loading,
        error,
        addFurnitureImage,
        addFurnitureLink,
        removeFurniture,
        uploadFloorPlan: uploadFloorPlanFn,
        suggestPlacements,
        updateItemPlacement,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
