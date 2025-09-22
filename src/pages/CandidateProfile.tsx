// src/pages/CandidateProfile.tsx
import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Download } from 'lucide-react'
import { useCandidate, useCandidateTimeline, useCandidates, useUpdateCandidate } from '../hooks/api'
import MentionInput from '../components/mention/MentionInput'
import type { Candidate } from '../types'

/** Small renderer to highlight @mentions that match suggestion names */
function NoteText({ text, suggestions }: { text: string; suggestions: { id: string; name: string }[] }) {
  const names = suggestions.map(s => s.name).filter(Boolean)
  if (names.length === 0) return <div className="text-sm text-gray-800">{text}</div>

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`@(${escaped.join('|')})\\b`, 'g')

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    const idx = m.index
    const matched = m[0]
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx))
    parts.push(<span key={idx} className="text-blue-600 font-medium">{matched}</span>)
    lastIndex = idx + matched.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))

  return <div className="text-sm text-gray-800">{parts}</div>
}

export const CandidateProfile = () => {
  // route param
  const { id } = useParams<{ id?: string }>()
  const candidateId = id ?? '' // safe string to pass to hooks

  // queries
  const { data: candidateResponse, isLoading: loadingCandidate } = useCandidate(candidateId)
  const { data: timelineResponse, isLoading: loadingTimeline } = useCandidateTimeline(candidateId)

  // candidate object (may be undefined while loading)
  const candidate = candidateResponse?.data

  // fetch a large page of candidates to use for mention suggestions
  const candidatesRespForMentions = useCandidates({ page: 1, limit: 1000 })

// helper: normalize many common response shapes into Candidate[]
function extractCandidates(resp: any): Candidate[] {
  if (!resp) return []
  // case: api wrapper returned the array directly
  if (Array.isArray(resp)) return resp

  // case: react-query returned the ApiResponse or wrapper: resp.data might be payload
  const payload = (resp && resp.data) ?? resp

  // payload could be:
  // - { data: Candidate[], pagination: {...} }  (your PaginatedResponse)
  if (payload && Array.isArray(payload.data)) return payload.data

  // - { items: Candidate[], total: number }
  if (payload && Array.isArray(payload.items)) return payload.items

  // - nested envelope: { data: { data: Candidate[], pagination: {...} } }
  if (payload && payload.data && Array.isArray(payload.data.data)) return payload.data.data

  // - some mocks might return { success: true, data: Candidate[] }
  if (payload && Array.isArray(payload.data?.data)) return payload.data.data

  // fallback: find first array value on the object (last resort)
  for (const key of Object.keys(payload)) {
    if (Array.isArray(payload[key])) return payload[key]
  }

  return []
}

// build suggestions safely
const mentionSuggestions = useMemo(() => {
  // normalize to an array regardless of shape
  const all = extractCandidates(candidatesRespForMentions?.data ?? candidatesRespForMentions)

  // optional: DEBUG line — uncomment if you want to inspect the shape in console
  // console.debug('candidatesRespForMentions raw:', candidatesRespForMentions, 'normalized length', all.length)

  return all
    .filter((c) => c && c.id && c.id !== candidate?.id) // guard against undefined items
    .map((c) => ({ id: c.id, name: c.name }))
}, [candidatesRespForMentions?.data, candidate?.id])
// ---- end replacement ----


  const updateCandidate = useUpdateCandidate()

  const handleSaveNote = async (noteText: string) => {
    if (!candidate) return
    const newNote = `${noteText} — ${new Date().toLocaleString()}`
    const nextNotes = [...(candidate.notes ?? []), newNote]
    try {
      await updateCandidate.mutateAsync({ candidateId: candidate.id, updates: { notes: nextNotes } })
      // success invalidation handled in hook
    } catch (err) {
      // errors are handled by the hook, optionally show UI here
    }
  }

  if (loadingCandidate) return <div className="p-6">Loading candidate...</div>
  if (!candidate) return <div className="p-6 text-red-600">Candidate not found</div>

  const timeline = timelineResponse?.data ?? []

  return (
    <div>
      <div className="mb-6">
        <Link to="/candidates" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          Back to Candidates
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
                {candidate.jobId && <p className="text-lg text-gray-600 mt-1">Job ID: {candidate.jobId}</p>}
                <div className="flex items-center space-x-6 mt-4 text-gray-600">
                  <div className="flex items-center"><Mail size={16} className="mr-2" />{candidate.email}</div>
                  {candidate.phone && <div className="flex items-center"><Phone size={16} className="mr-2" />{candidate.phone}</div>}
                  {candidate.location && <div className="flex items-center"><MapPin size={16} className="mr-2" />{candidate.location}</div>}
                </div>
              </div>

              {candidate.resume && (
                <a
                  href={candidate.resume.url}
                  download={candidate.resume.filename}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Download Resume</span>
                </a>
              )}
            </div>

            {candidate.score !== undefined && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Score</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Overall Score</span>
                    <span className="text-sm font-medium text-gray-900">{candidate.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${candidate.score}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>
            {loadingTimeline ? (
              <p>Loading timeline...</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="w-3 h-3 rounded-full mt-1 bg-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>

            <MentionInput
              suggestions={mentionSuggestions}
              onSave={handleSaveNote}
              placeholder="Write a note and mention people using @..."
            />

            <div className="mt-6 space-y-4">
              {(candidate.notes ?? []).slice().reverse().map((note, idx) => (
                <div key={idx} className="border rounded p-3 bg-gray-50">
                  <NoteText text={note} suggestions={mentionSuggestions} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Stage</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{candidate.stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applied</span>
                <span className="text-gray-900">{new Date(candidate.appliedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resume</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm">{candidate.resume?.filename ?? '—'}</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">Move to Interview</button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">Send Assessment</button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg">Reject Candidate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateProfile
