import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react'
import type { Candidate } from '../../types'

type Props = {
  candidate: Candidate
  isDragging?: boolean
}

export default function CandidateCard({ candidate, isDragging = false }: Props) {
  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 ${isDragging ? 'ring-2 ring-indigo-300' : ''}`}
    >
      <Link
        to={`/candidates/${candidate.id}`}
        className={`block hover:bg-gray-50 p-1 rounded ${isDragging ? 'pointer-events-none' : ''}`}
        onClick={(e) => { if (isDragging) e.preventDefault() }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{candidate.name}</h3>
              <div className="text-xs text-gray-500">
                {candidate.score != null ? (
                  <span className={`font-medium ${candidate.score >= 80 ? 'text-green-600' : candidate.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {candidate.score}%
                  </span>
                ) : '-'}
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex items-center gap-2"><Mail size={14} /> <span className="truncate">{candidate.email}</span></div>
              {candidate.phone && <div className="flex items-center gap-2"><Phone size={14} /> <span>{candidate.phone}</span></div>}
              {candidate.location && <div className="flex items-center gap-2"><MapPin size={14} /> <span className="truncate">{candidate.location}</span></div>}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{candidate.jobId ? `Job: ${candidate.jobId}` : 'Position: -'}</div>
              {candidate.experience != null && <div className="text-xs text-gray-500">{candidate.experience} years experience</div>}
              {candidate.expectedSalary && <div className="text-xs text-gray-500">Expected: {candidate.expectedSalary.currency} {candidate.expectedSalary.amount.toLocaleString()}</div>}
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500 flex items-center gap-2"><Calendar size={14} /> <span>{new Date(candidate.appliedAt).toLocaleDateString()}</span></div>
              {candidate.resume && <a className="inline-flex items-center mt-2 text-blue-600 text-xs" href={candidate.resume.url} target="_blank" rel="noreferrer"><FileText size={14} className="mr-1" /> Resume</a>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
