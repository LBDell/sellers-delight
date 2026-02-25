import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '../context/AppContext'

export default function FurnitureUpload() {
  const { addFurnitureImage, addFurnitureLink, furniture, loading, error, clearError, setStep } = useApp()
  const [linkInput, setLinkInput] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setLocalError(null)
      clearError()
      setImageLoading(true)
      for (const file of acceptedFiles) {
        try {
          await addFurnitureImage(file)
        } catch {
          // error is surfaced via context
        }
      }
      setImageLoading(false)
    },
    [addFurnitureImage, clearError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
    disabled: loading || imageLoading,
  })

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = linkInput.trim()
    if (!url) return
    if (!url.startsWith('http')) {
      setLocalError('Please enter a valid URL starting with http:// or https://')
      return
    }
    setLocalError(null)
    clearError()
    setLinkLoading(true)
    await addFurnitureLink(url)
    setLinkInput('')
    setLinkLoading(false)
  }

  const displayError = localError || error

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Add Your Furniture</h2>
        <p className="mt-1 text-gray-500">
          Upload photos of your furniture or paste retailer links (IKEA, Wayfair, CB2, etc.)
        </p>
      </div>

      {/* Image dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-500 hover:bg-gray-50'}
          ${loading || imageLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {imageLoading ? (
            <span className="text-brand-600 font-medium">Identifying furniture with AI...</span>
          ) : isDragActive ? (
            <span className="text-brand-600 font-medium">Drop images here</span>
          ) : (
            <>
              <span className="text-gray-700 font-medium">Drag & drop furniture photos here</span>
              <span className="text-sm text-gray-400">or click to browse — JPG, PNG, WEBP</span>
            </>
          )}
        </div>
      </div>

      {/* Retailer link input */}
      <form onSubmit={handleLinkSubmit} className="flex gap-2">
        <input
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Paste a retailer link (e.g. https://www.ikea.com/us/en/p/...)"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={linkLoading}
        />
        <button
          type="submit"
          disabled={linkLoading || !linkInput.trim()}
          className="bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-600 transition-colors"
        >
          {linkLoading ? 'Loading...' : 'Add Link'}
        </button>
      </form>

      {/* Error */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {displayError}
        </div>
      )}

      {/* Furniture count + proceed */}
      {furniture.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-green-800 font-semibold">{furniture.length} item{furniture.length !== 1 ? 's' : ''} added</span>
            <p className="text-sm text-green-600 mt-0.5">AI has identified your furniture. Ready for floor plan.</p>
          </div>
          <button
            onClick={() => setStep('upload_floorplan')}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Next: Upload Floor Plan →
          </button>
        </div>
      )}
    </div>
  )
}
