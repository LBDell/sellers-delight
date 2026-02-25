import { AppProvider, useApp } from './context/AppContext'
import FurnitureUpload from './components/FurnitureUpload'
import FloorPlanUpload from './components/FloorPlanUpload'
import RoomStager from './components/RoomStager'
import type { AppStep } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Step indicators
// ─────────────────────────────────────────────────────────────────────────────
const STEPS: { key: AppStep; label: string; number: number }[] = [
  { key: 'upload_furniture', label: 'Add Furniture', number: 1 },
  { key: 'upload_floorplan', label: 'Floor Plan', number: 2 },
  { key: 'stage', label: 'Stage', number: 3 },
]

function StepIndicator() {
  const { step, setStep, furniture, floorPlan } = useApp()

  const canGoTo = (s: AppStep) => {
    if (s === 'upload_furniture') return true
    if (s === 'upload_floorplan') return furniture.length > 0
    if (s === 'stage') return furniture.length > 0 && floorPlan !== null
    return false
  }

  return (
    <nav className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const active = step === s.key
        const reachable = canGoTo(s.key)
        const past =
          STEPS.findIndex((x) => x.key === step) > STEPS.findIndex((x) => x.key === s.key)

        return (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => reachable && setStep(s.key)}
              disabled={!reachable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${active
                  ? 'bg-brand-500 text-white'
                  : past && reachable
                    ? 'text-brand-600 hover:bg-brand-50'
                    : reachable
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${active ? 'bg-white text-brand-500' : past ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-400'}`}
              >
                {past ? '✓' : s.number}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="w-6 text-center text-gray-300 text-sm">›</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────────────────────
function Shell() {
  const { step } = useApp()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* StreetEasy-style logo wordmark */}
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Furniture Stager</span>
              <span className="text-gray-300 text-sm ml-1">by StreetEasy</span>
            </div>
          </div>
          <StepIndicator />
        </div>
      </header>

      {/* Page content */}
      <main
        className={`flex-1 max-w-6xl mx-auto w-full px-6 py-8
          ${step === 'stage' ? 'flex flex-col' : ''}`}
      >
        {step === 'stage' && (
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Stage Your Apartment
          </h1>
        )}
        {step === 'upload_furniture' && <FurnitureUpload />}
        {step === 'upload_floorplan' && <FloorPlanUpload />}
        {step === 'stage' && (
          <div className="flex-1" style={{ height: 'calc(100vh - 200px)' }}>
            <RoomStager />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        Furniture Staging Tool · Powered by Claude AI · StreetEasy concept
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
