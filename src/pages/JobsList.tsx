// pages/JobsList.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, MapPin, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useJobs } from '../hooks/api'
import  type {JobStatus}  from '../types/index'

export const JobsList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 9 // Show 9 jobs per page to fill 3x3 grid

  // Fetch jobs using React Query
  const { 
    data: jobsResponse, 
    isLoading, 
    error,
    isFetching 
  } = useJobs({
    query: searchTerm || undefined,
    page: currentPage,
    limit: pageSize,
    sort: { field: 'createdAt', direction: 'desc' }
  })

  // Handle search with debounce effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on search
  }

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as 'all' | JobStatus)
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-gray-600">Loading jobs...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load jobs</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const jobs = jobsResponse?.data?.data || []
  const pagination = jobsResponse?.data?.pagination

  // Filter jobs by status on the frontend (in addition to backend filtering)
  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true
    return job.status === statusFilter
  })

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-2 text-gray-600">
            Manage and track your job postings
            {pagination && (
              <span className="ml-2 text-sm">
                ({pagination.total} total jobs)
              </span>
            )}
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Create Job</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs by title, description, or department..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {isFetching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={16} />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* No results message */}
      {filteredJobs.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-sm">
              {searchTerm 
                ? `No jobs match "${searchTerm}" with the current filters.`
                : 'No jobs match the current filters.'
              }
            </p>
          </div>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Jobs Grid */}
      {filteredJobs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {job.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                      job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  {/* Job details */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 flex-shrink-0" />
                      <span className="capitalize">{job.type.replace('-', ' ')}</span>
                    </div>
                    {job.department && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="truncate">{job.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {job.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                        {job.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                            +{job.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-500">
                        {formatDate(job.postedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} jobs
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pageNumber = pagination.page <= 3 
                      ? i + 1 
                      : pagination.page + i - 2
                    
                    if (pageNumber > pagination.totalPages) return null
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                          pageNumber === pagination.page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}