// src/pages/JobDetail.tsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Edit, Share, Copy, 
  MapPin, Briefcase, DollarSign, Calendar,
  Users, CheckCircle
} from 'lucide-react'
import { useJob, useUpdateJob, useCandidates } from '../hooks/api'
import type { JobStatus } from '../types'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-800'
}

export const JobDetail = () => {
  // <-- read the same param name as your App.tsx route (:jobId)
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch job data and related candidates
  const { data: jobResponse, isLoading: jobLoading, error: jobError } = useJob(jobId!)
  const { data: candidatesResponse, isLoading: candidatesLoading } = useCandidates({ 
    jobId: jobId,
    page: 1, 
    limit: 100 
  })
  const updateJobMutation = useUpdateJob()

  if (!jobId) {
    return <div className="text-center py-12 text-red-600">Invalid job ID</div>
  }

  if (jobError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading job details. Please try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (jobLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading job details...</p>
      </div>
    )
  }

  const job = jobResponse?.data
  if (!job) {
    return <div className="text-center py-12 text-red-600">Job not found</div>
  }

  const candidates = candidatesResponse?.data?.data || []
  const totalApplications = candidatesResponse?.data?.pagination?.total || 0

  // Calculate candidate statistics
  const candidateStats = {
    applied: candidates.filter(c => c.stage === 'applied').length,
    screening: candidates.filter(c => c.stage === 'screening').length,
    interview: candidates.filter(c => c.stage === 'interview').length,
    offer: candidates.filter(c => c.stage === 'offer').length,
    hired: candidates.filter(c => c.stage === 'hired').length,
    rejected: candidates.filter(c => c.stage === 'rejected').length
  }

  const handleStatusChange = (newStatus: JobStatus) => {
    updateJobMutation.mutate({
      jobId: job.id,
      updates: { status: newStatus }
    })
  }

  const copyJobLink = async () => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`
    try {
      await navigator.clipboard.writeText(jobUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const shareJobLink = async () => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: job.description,
          url: jobUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      setShowShareDialog(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSalary = (salary?: { min: number; max: number; currency: string; }) => {
    if (!salary) return 'Not specified'
    const min = salary.min.toLocaleString()
    const max = salary.max.toLocaleString()
    return `${salary.currency} ${min} - ${max}`
  }

  return (
    <div className="p-6">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Jobs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[job.status]}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase size={16} className="mr-2" />
                    <span>{job.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-2" />
                    <span>{formatSalary(job.salary)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>Posted {formatDate(job.postedDate)}</span>
                  </div>
                </div>

                {job.tags && job.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={shareJobLink}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Share job"
                >
                  <Share size={20} />
                </button>
                <Link
                  to={`/jobs/${job.id}/edit`}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Edit job"
                >
                  <Edit size={20} />
                </Link>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Candidates Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Applications ({totalApplications})</h2>
              <Link
                to={`/candidates?jobId=${job.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All Applications →
              </Link>
            </div>

            {candidatesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No applications yet</p>
              </div>
            ) : (
              <>
                {/* Candidate Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                  {Object.entries(candidateStats).map(([stage, count]) => (
                    <div key={stage} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500 capitalize">{stage}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Applications */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
                  {candidates.slice(0, 5).map(candidate => (
                    <Link
                      key={candidate.id}
                      to={`/candidates/${candidate.id}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          candidate.stage === 'applied' ? 'bg-blue-100 text-blue-800' :
                          candidate.stage === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                          candidate.stage === 'interview' ? 'bg-purple-100 text-purple-800' :
                          candidate.stage === 'hired' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(candidate.appliedAt)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {job.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={updateJobMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Publish Job
                </button>
              )}
              {job.status === 'active' && (
                <button
                  onClick={() => handleStatusChange('draft')}
                  disabled={updateJobMutation.isPending}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Move to Draft
                </button>
              )}
              <Link
                to={`/jobs/${job.id}/edit`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center block transition-colors"
              >
                Edit Job Details
              </Link>
              <Link
                to={`/assessments/${job.id}/builder`}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-center block transition-colors"
              >
                Create Assessment
              </Link>
              <button
                    onClick={() => {
                      const newStatus = job.status === 'archived' ? 'active' : 'archived'
                      updateJobMutation.mutate({ jobId: job.id, updates: { status: newStatus } })
                    }}
                    disabled={updateJobMutation.isPending}
                    className={`w-full ${
                      job.status === 'archived'
                        ? 'bg-green-600 hover:bg-green-700'   // show "Unarchive"
                        : 'bg-red-600 hover:bg-red-700'       // show "Archive"
                    } disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors`}
                  >
                    {job.status === 'archived' ? 'Unarchive Job' : 'Archive Job'}
              </button>
            </div>
          </div>

          {/* Job Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Department</span>
                <span className="font-medium text-gray-900">{job.department}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Applications</span>
                <span className="font-medium text-gray-900">{totalApplications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium text-gray-900">{formatDate(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">{formatDate(job.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Share Job */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Job</h3>
            <div className="space-y-3">
              <button
                onClick={copyJobLink}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                <Copy size={16} />
                <span>{copied ? 'Copied!' : 'Copy Job Link'}</span>
              </button>
              <button
                onClick={shareJobLink}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                <Share size={16} />
                <span>Share Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Job</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/jobs/${job.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                  />
                  <button
                    onClick={copyJobLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
