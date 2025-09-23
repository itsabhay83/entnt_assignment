
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { 
  Job, 
  Candidate, 
  Assessment, 
  TimelineEntry,
  AssessmentResult,
  SearchParams,
  PaginatedResponse,
  ApiResponse,
  CreateJobFormData,
  CreateCandidateFormData
} from '../types'
import { adaptiveApi } from '../utils/api-adapter'

// Base API function
const api = adaptiveApi

// ===== JOBS HOOKS =====

export const useJobs = (params?: SearchParams) => {
  const queryParams = new URLSearchParams()
  
  if (params?.query) queryParams.set('search', params.query)
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('pageSize', params.limit.toString())
  if (params?.sort) {
    queryParams.set('sort', `${params.sort.field}:${params.sort.direction}`)
  }
  
  return useQuery({
    queryKey: ['jobs', queryParams.toString()],
    queryFn: () => api<PaginatedResponse<Job>>(`/jobs?${queryParams}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api<Job>(`/jobs/${jobId}`),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobData: CreateJobFormData) =>
      api<Job>('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job created successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to create job: ${error.message}`)
    },
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: Partial<Job> }) =>
      api<Job>(`/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: (response, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] })
      toast.success('Job updated successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to update job: ${error.message}`)
    },
  })
}

export const useReorderJobs = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ jobId, newOrder }: { jobId: string; newOrder: number }) =>
      api<Job>(`/jobs/${jobId}/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ newOrder }),
      }),
    onMutate: async ({ jobId, newOrder }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['jobs'] })
      
      // Snapshot the previous value
      const previousJobs = queryClient.getQueriesData({ queryKey: ['jobs'] })
      
      // Optimistically update jobs order
      queryClient.setQueriesData<ApiResponse<PaginatedResponse<Job>>>(
        { queryKey: ['jobs'] },
        (old) => {
          if (!old?.data) return old
          
          const jobs = [...old.data.data]
          const jobIndex = jobs.findIndex(job => job.id === jobId)
          
          if (jobIndex !== -1) {
            jobs[jobIndex] = { ...jobs[jobIndex], order: newOrder }
            jobs.sort((a, b) => a.order - b.order)
          }
          
          return {
            ...old,
            data: {
              ...old.data,
              data: jobs
            }
          }
        }
      )
      
      return { previousJobs }
    },
    onSuccess: () => {
      toast.success('Job order updated!')
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousJobs) {
        context.previousJobs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if(error) console.log(error)

      console.log(variables);
      toast.error('Failed to reorder jobs - changes reverted')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

// ===== CANDIDATES HOOKS =====

export const useCandidates = (params?: SearchParams & { jobId?: string }) => {
  const queryParams = new URLSearchParams()
  
  if (params?.query) queryParams.set('search', params.query)
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('pageSize', params.limit.toString())
  if (params?.jobId) queryParams.set('jobId', params.jobId)
  if (params?.sort) {
    queryParams.set('sort', `${params.sort.field}:${params.sort.direction}`)
  }
  
  return useQuery({
    queryKey: ['candidates', queryParams.toString()],
    queryFn: () => api<PaginatedResponse<Candidate>>(`/candidates?${queryParams}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

export const useCandidate = (candidateId: string) => {
  return useQuery({
    queryKey: ['candidates', candidateId],
    queryFn: () => api<Candidate>(`/candidates/${candidateId}`),
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
export const useCandidatesByStage = (
  stage: string,
  page = 1,
  limit = 10,
  jobId?: string
) => {
  const qp = new URLSearchParams()
  qp.set('page', String(page))
  qp.set('pageSize', String(limit))
  qp.set('stage', stage)
  if (jobId) qp.set('jobId', jobId)

  const queryKey = ['candidates-by-stage', stage, page, limit, jobId ?? 'all']

  return useQuery<PaginatedResponse<Candidate>, Error>({
    queryKey,
    queryFn: async (): Promise<PaginatedResponse<Candidate>> => {
      // call the API wrapper
      const res = await api<PaginatedResponse<Candidate>>(`/candidates?${qp.toString()}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybe = (res as any).data ?? res

      // case A: maybe already the desired PaginatedResponse
      if (maybe && maybe.data && maybe.pagination) {
        return maybe as PaginatedResponse<Candidate>
      }

      // case B: envelope: { success, data: { data: [], pagination: {} } }
      if (maybe && maybe.data && maybe.data.data && maybe.data.pagination) {
        return maybe.data as PaginatedResponse<Candidate>
      }

      // case C: sometimes backend returns { items: [], total } — adapt if you use that shape
      if (maybe && Array.isArray(maybe.items)) {
        const total = typeof maybe.total === 'number' ? maybe.total : maybe.items.length
        return {
          data: maybe.items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: total > page * limit,
            hasPrev: page > 1
          }
        }
      }

      // case D: raw array -> build minimal pagination
      if (Array.isArray(maybe)) {
        const total = maybe.length
        return {
          data: maybe,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: total > page * limit,
            hasPrev: page > 1
          }
        }
      }

      // fallback: throw helpful error so dev can see unexpected API shape
      throw new Error('Unexpected /candidates response shape. Inspect API response.')
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useCandidateTimeline = (candidateId: string) => {
  return useQuery({
    queryKey: ['candidates', candidateId, 'timeline'],
    queryFn: () => api<TimelineEntry[]>(`/candidates/${candidateId}/timeline`),
    enabled: !!candidateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useCreateCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (candidateData: CreateCandidateFormData) =>
      api<Candidate>('/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate created successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to create candidate: ${error.message}`)
    },
  })
}

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      candidateId, 
      updates 
    }: { 
      candidateId: string
      updates: Partial<Candidate> 
    }) =>
      api<Candidate>(`/candidates/${candidateId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: (response, { candidateId }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates', candidateId, 'timeline'] })
      toast.success('Candidate updated successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to update candidate: ${error.message}`)
    },
  })
}

// ===== ASSESSMENTS HOOKS =====

export const useAssessment = (jobId: string) => {
  return useQuery({
    queryKey: ['assessments', jobId],
    queryFn: () => api<Assessment>(`/assessments/${jobId}`),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useSaveAssessment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ jobId, assessmentData }: { 
      jobId: string
      assessmentData: Partial<Assessment> 
    }) =>
      api<Assessment>(`/assessments/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(assessmentData),
      }),
    onSuccess: (response, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', jobId] })
      toast.success('Assessment saved successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to save assessment: ${error.message}`)
    },
  })
}

export const useSubmitAssessment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      jobId, 
      candidateId, 
      responses 
    }: { 
      jobId: string
      candidateId: string
      responses: Partial<Response>[]
    }) =>
      api<AssessmentResult>(`/assessments/${jobId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ candidateId, responses }),
      }),
    onSuccess: (response, { candidateId }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates', candidateId, 'timeline'] })
      toast.success('Assessment submitted successfully!')
      return response.data
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit assessment: ${error.message}`)
    },
  })
}
