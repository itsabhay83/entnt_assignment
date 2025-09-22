import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Filter, Mail, Phone, MapPin, Calendar, 
  FileText, ExternalLink,ChevronLeft, ChevronRight 
} from 'lucide-react'
import { useCandidates, useJobs } from '../hooks/api'
import type { Stage } from '../types'

const STAGE_COLORS = {
  applied: 'bg-gray-100 text-gray-800',
  screening: 'bg-blue-100 text-blue-800',
  assessment: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  hired: 'bg-green-200 text-green-900',
  rejected: 'bg-red-100 text-red-800'
} as const

const STAGES: { value: Stage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
]

export const CandidatesList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState<Stage | 'all'>('all')
  const [selectedJob, setSelectedJob] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Fetch candidates with search and pagination
  const { data: candidatesResponse, isLoading: candidatesLoading, error: candidatesError } = useCandidates({
    query: searchTerm,
    page: currentPage,
    limit: pageSize,
    sort: { field: 'appliedAt', direction: 'desc' }
  })

  // Fetch jobs for filter dropdown
  const { data: jobsResponse, isLoading: jobsLoading } = useJobs({ page: 1, limit: 100 })

  // Filter candidates by stage and job locally
  const filteredCandidates = useMemo(() => {
    if (!candidatesResponse?.data?.data) return []
    
    let filtered = candidatesResponse.data.data

    if (selectedStage !== 'all') {
      filtered = filtered.filter(candidate => candidate.stage === selectedStage)
    }

    if (selectedJob !== 'all') {
      filtered = filtered.filter(candidate => candidate.jobId === selectedJob)
    }

    return filtered
  }, [candidatesResponse?.data?.data, selectedStage, selectedJob])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStageColor = (stage: Stage) => {
    return STAGE_COLORS[stage] || 'bg-gray-100 text-gray-800'
  }

  // Pagination data
  const paginationData = candidatesResponse?.data?.pagination
  const totalPages = paginationData?.totalPages || 1
  const currentStart = paginationData ? ((paginationData.page - 1) * paginationData.limit) + 1 : 0
  const currentEnd = paginationData ? Math.min(paginationData.page * paginationData.limit, paginationData.total) : 0
  const totalResults = paginationData?.total || 0

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      if (totalPages > 1) rangeWithDots.push(totalPages)
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index)
  }

  if (candidatesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading candidates. Please try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-2 text-gray-600">
            Manage and review candidate applications
            {totalResults > 0 && (
              <span className="ml-2 text-sm">({totalResults} total)</span>
            )}
          </p>
        </div>
        
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search candidates by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select 
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value as Stage | 'all')
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
            >
              {STAGES.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Filter */}
          <div className="flex items-center space-x-2">
            <select 
              value={selectedJob}
              onChange={(e) => {
                setSelectedJob(e.target.value)
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              disabled={jobsLoading}
            >
              <option value="all">All Jobs</option>
              {jobsResponse?.data?.data?.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {candidatesLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No candidates found matching your criteria.</p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStage('all')
                  setSelectedJob('all')
                  setCurrentPage(1)
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job & Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCandidates.map((candidate) => {
                    const job = jobsResponse?.data?.data?.find(j => j.id === candidate.jobId)
                    
                    return (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.name}
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div className="flex items-center">
                                <Mail size={14} className="mr-1 flex-shrink-0" />
                                <span className="truncate">{candidate.email}</span>
                              </div>
                              {candidate.phone && (
                                <div className="flex items-center">
                                  <Phone size={14} className="mr-1 flex-shrink-0" />
                                  <span>{candidate.phone}</span>
                                </div>
                              )}
                              {candidate.location && (
                                <div className="flex items-center">
                                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                                  <span className="truncate">{candidate.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job?.title || 'Position not specified'}
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              {candidate.experience && (
                                <div>{candidate.experience} years experience</div>
                              )}
                              {candidate.expectedSalary && (
                                <div>
                                  Expected: {candidate.expectedSalary.currency} {candidate.expectedSalary.amount.toLocaleString()}
                                </div>
                              )}
                              <div className="flex items-center space-x-3">
                                {candidate.resume && (
                                  <a 
                                    href={candidate.resume.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText size={12} className="mr-1" />
                                    Resume
                                  </a>
                                )}
                                {candidate.portfolio && (
                                  <a 
                                    href={candidate.portfolio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink size={12} className="mr-1" />
                                    Portfolio
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(candidate.stage)}`}>
                            {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {candidate.score ? (
                              <div className="flex items-center">
                                <span className={`font-medium ${
                                  candidate.score >= 80 ? 'text-green-600' :
                                  candidate.score >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {candidate.score}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(candidate.appliedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{currentStart}</span>
                        {' '}to{' '}
                        <span className="font-medium">{currentEnd}</span>
                        {' '}of{' '}
                        <span className="font-medium">{totalResults}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {getVisiblePages().map((page, index) => (
                          <div key={index}>
                            {page === '...' ? (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            ) : (
                              <button
                                onClick={() => goToPage(page as number)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}