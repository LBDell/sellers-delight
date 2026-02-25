import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '../context/AppContext'

export default function FloorPlanUpload() {
  const { uploadFloorPlan, floorPlan, furniture, loading, error, clearError, setStep } = useApp()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      clearError()
      if (acceptedFiles.length > 0) {
        await uploadFloorPlan(acceptedFiles[0])
      }
    },
    [uploadFloorPlan, clearError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    disabled: loading,
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Upload Floor Plan</h2>
        <p className="mt-1 text-gray-500">
          Upload the apartment or home floor plan. AI will detect rooms and calculate dimensions.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-500 hover:bg-gray-50'}
          ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-14 h-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
          {loading ? (
            <span className="text-brand-600 font-medium">Analyzing floor plan with AI...</span>
          ) : isDragActive ? (
            <span className="text-brand-600 font-medium">Drop floor plan here</span>
          ) : (
            <>
              <span className="text-gray-700 font-medium">Drag & drop your floor plan image</span>
              <span className="text-sm text-gray-400">
                JPG, PNG, WEBP — works with StreetEasy listing images, architectural drawings, or hand-drawn plans
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Use the floor plan image from the StreetEasy listing</li>
          <li>Include room labels if possible</li>
          <li>Higher resolution images produce more accurate room detection</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success state */}
      {floorPlan && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-semibold">Floor plan analyzed!</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-gray-500">Rooms detected</p>
              <p className="text-2xl font-bold text-green-700">{floorPlan.rooms.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-gray-500">Your furniture</p>
              <p className="text-2xl font-bold text-green-700">{furniture.length} items</p>
            </div>
          </div>
          {floorPlan.rooms.length > 0 && (
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Detected rooms:</p>
              <div className="flex flex-wrap gap-1.5">
                {floorPlan.rooms.map((room) => (
                  <span key={room.id} className="bg-white border border-green-200 rounded-full px-2.5 py-0.5 text-xs text-green-800">
                    {room.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setStep('stage')}
            className="w-full bg-brand-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Start Staging →
          </button>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setStep('upload_furniture')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to furniture
        </button>
      </div>
    </div>
  )
}
