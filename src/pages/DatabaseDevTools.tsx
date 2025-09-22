
import { useState } from 'react'
import { Database, RefreshCw, BarChart3, Trash2 } from 'lucide-react'
import { DatabaseService } from '../database/db'
import toast from 'react-hot-toast'

interface DatabaseStats {
  jobs: number
  candidates: number
  assessments: number
  timelines: number
  responses: number
}

const DatabaseDevTools = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [stats, setStats] = useState<DatabaseStats | null>(null)

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will clear all data and re-seed with fresh data.')) {
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('Resetting database...')

    try {
      await DatabaseService.resetDatabase()
      await loadStats()
      toast.success('Database reset successfully!', { id: toastId })
    } catch (error) {
      console.error('Failed to reset database:', error)
      toast.error('Failed to reset database', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    setIsLoading(true)
    const toastId = toast.loading('Seeding database...')

    try {
      await DatabaseService.seedDatabase()
      await loadStats()
      toast.success('Database seeded successfully!', { id: toastId })
    } catch (error) {
      console.error('Failed to seed database:', error)
      toast.error('Failed to seed database', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const dbStats = await DatabaseService.getDatabaseStats()
      setStats(dbStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
      toast.error('Failed to load database stats')
    }
  }

  const handleTogglePanel = () => {
    setShowPanel(!showPanel)
    if (!showPanel && !stats) {
      loadStats()
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={handleTogglePanel}
        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="Database Dev Tools"
      >
        <Database size={20} />
      </button>

      {/* Dev Panel */}
      {showPanel && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="mr-2" size={18} />
              Database Tools
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Database Stats */}
          {stats && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 size={16} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Database Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jobs:</span>
                  <span className="font-medium">{stats.jobs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Candidates:</span>
                  <span className="font-medium">{stats.candidates.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assessments:</span>
                  <span className="font-medium">{stats.assessments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timelines:</span>
                  <span className="font-medium">{stats.timelines.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Responses:</span>
                  <span className="font-medium">{stats.responses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={loadStats}
              disabled={isLoading}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <BarChart3 size={16} className="mr-2" />
              Refresh Stats
            </button>

            <button
              onClick={handleSeedDatabase}
              disabled={isLoading}
              className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Database size={16} className="mr-2" />
              )}
              Seed Database
            </button>

            <button
              onClick={handleResetDatabase}
              disabled={isLoading}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              Reset Database
            </button>
          </div>

          {/* Info */}
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
            <strong>Dev Mode Only:</strong> This panel is only visible in development. 
            Reset will clear all data and re-seed with deterministic test data.
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseDevTools