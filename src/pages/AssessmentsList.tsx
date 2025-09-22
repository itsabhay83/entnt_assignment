/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/AssessmentsList.tsx
import { useMemo, useState, type JSX } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAllAssessments } from '../hooks/api' // add path if different
import { useJobs } from '../hooks/api'
import type { Assessment } from '../types'

export default function AssessmentsList(): JSX.Element {
  const navigate = useNavigate()
  const { data: assessments, isLoading: loadingAssessments } = useAllAssessments()
  const { data: jobsResp, isLoading: loadingJobs } = useJobs({ page: 1, limit: 200 })

  const jobs = useMemo(() => {
    // jobsResp might be paginated shape
    const raw = (jobsResp as any)?.data ?? jobsResp
    return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw ? [raw] : []
  }, [jobsResp])

  const [q, setQ] = useState('')

  const list = useMemo(() => {
    if (!assessments) return []
    return assessments.filter((a: Assessment) => a.title?.toLowerCase().includes(q.toLowerCase()))
  }, [assessments, q])

  const goCreateForJob = (jobId?: string) => {
    if (!jobId) {
      // if no job selected, navigate to jobs list page to choose job
      navigate('/jobs')
      return
    }
    navigate(`/assessments/${jobId}/builder`)
  }

  if (loadingAssessments || loadingJobs) {
    return <div className="p-6">Loading assessments...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-gray-600">All assessments (seeded + created)</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:block">
            <select
              className="border rounded px-2 py-1"
              onChange={(e) => goCreateForJob(e.target.value || undefined)}
              defaultValue=""
            >
              <option value="">Create assessment for a job...</option>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {jobs.map((j: any) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded"
          >
            <Plus size={14} /> Create Assessment
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="mb-4">
          <input
            placeholder="Search assessments by title..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {list.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No assessments found.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a: Assessment) => (
              <div key={a.id} className="flex items-center justify-between border rounded px-4 py-3">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Job: {a.jobId ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/assessments/${a.jobId}/form?assessmentId=${a.id}`} className="text-sm text-blue-600 hover:underline">Open Form</Link>
                  <button onClick={() => navigate(`/assessments/${a.jobId}/builder`)} className="text-sm text-gray-700 hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
