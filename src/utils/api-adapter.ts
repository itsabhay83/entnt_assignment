/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/api-adapter.ts
import { db } from '../database/db'
import type { 
  Job, 
  Candidate, 
  Assessment,
  AssessmentResult,
  TimelineEntry,
  PaginatedResponse,
  ApiResponse,
  SearchParams,
  CreateJobFormData,
  CreateCandidateFormData,
  Response
} from '../types'

// Check if we're in development with MSW
const hasApiServer = import.meta.env.DEV

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// Client-side implementation using IndexedDB
class ClientSideAPI {
  async getJobs(params?: SearchParams): Promise<ApiResponse<PaginatedResponse<Job>>> {
    try {
      let jobs = await db.jobs.orderBy('order').toArray()
      
      // Apply search
      if (params?.query) {
        const query = params.query.toLowerCase()
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query)
        )
      }
      
      // Apply sorting
      if (params?.sort) {
        jobs.sort((a, b) => {
          const aVal = (a as any)[params.sort!.field]
          const bVal = (b as any)[params.sort!.field]
          
          if (params.sort!.direction === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }
      
      // Apply pagination
      const page = params?.page || 1
      const limit = params?.limit || 10
      const total = jobs.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const end = start + limit
      const data = jobs.slice(start, end)
      
      return {
        success: true,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch jobs'
      }
    }
  }

  async getJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }
      
      const job = await db.jobs.get(jobId)
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        }
      }
      return {
        success: true,
        data: job
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch job'
      }
    }
  }

  async createJob(jobData: CreateJobFormData): Promise<ApiResponse<Job>> {
    try {
    //   const maxOrder = await db.jobs.orderBy('order').last()
      const newJob: Job = {
        id: generateId(),
        title: jobData.title,
        slug: jobData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        status: jobData.status,
        tags: jobData.tags,
        order: jobData.order,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        type: jobData.type,
        salary: jobData.salary,
        department: jobData.department,
        experienceLevel: jobData.experienceLevel,
        postedDate: jobData.postedDate,
        closingDate: jobData.closingDate,
        applicantCount: 0, // Start with 0 applicants
        createdBy: jobData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.jobs.add(newJob)
      
      return {
        success: true,
        data: newJob
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to create job'
      }
    }
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<ApiResponse<Job>> {
    try {
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      const existingJob = await db.jobs.get(jobId)
      if (!existingJob) {
        return {
          success: false,
          error: 'Job not found'
        }
      }

      const updatedJob = {
        ...existingJob,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await db.jobs.update(jobId, updatedJob)
      
      return {
        success: true,
        data: updatedJob
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to update job'
      }
    }
  }

  async reorderJob(jobId: string, newOrder: number): Promise<ApiResponse<Job>> {
    try {
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      const job = await db.jobs.get(jobId)
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        }
      }

      const updatedJob = {
        ...job,
        order: newOrder,
        updatedAt: new Date().toISOString()
      }

      await db.jobs.update(jobId, updatedJob)
      
      return {
        success: true,
        data: updatedJob
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to reorder job'
      }
    }
  }

  async getCandidates(params?: SearchParams & { jobId?: string; stage?: string }): Promise<ApiResponse<PaginatedResponse<Candidate>>> {
    try {
      let candidates = await db.candidates.orderBy('appliedAt').reverse().toArray()
      
      // Apply filters
      if (params?.jobId) {
        candidates = candidates.filter(c => c.jobId === params.jobId)
      }
      
      if (params?.stage) {
        candidates = candidates.filter(c => c.stage === params.stage)
      }
      
      // Apply search
      if (params?.query) {
        const query = params.query.toLowerCase()
        candidates = candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query)
        )
      }
      
      // Apply pagination
      const page = params?.page || 1
      const limit = params?.limit || 10
      const total = candidates.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const end = start + limit
      const data = candidates.slice(start, end)
      
      return {
        success: true,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch candidates'
      }
    }
  }

  async getCandidate(candidateId: string): Promise<ApiResponse<Candidate>> {
    try {
      if (!candidateId || typeof candidateId !== 'string' || candidateId.trim() === '') {
        return {
          success: false,
          error: 'Invalid candidate ID provided'
        }
      }
      
      const candidate = await db.candidates.get(candidateId)
      if (!candidate) {
        return {
          success: false,
          error: 'Candidate not found'
        }
      }
      return {
        success: true,
        data: candidate
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch candidate'
      }
    }
  }

  async createCandidate(candidateData: CreateCandidateFormData): Promise<ApiResponse<Candidate>> {
    try {
      const newCandidate: Candidate = {
        id: generateId(),
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        jobId: candidateData.jobId,
        stage: 'applied', // Default stage
        location: candidateData.location,
        resume: candidateData.resume,
        coverLetter: candidateData.coverLetter,
        portfolio: candidateData.portfolio,
        linkedin: candidateData.linkedin,
        github: candidateData.github,
        experience: candidateData.experience,
        expectedSalary: candidateData.expectedSalary,
        availability: candidateData.availability,
        notes: candidateData.notes,
        appliedAt: candidateData.appliedAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.candidates.add(newCandidate)
      
      return {
        success: true,
        data: newCandidate
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to create candidate'
      }
    }
  }

  async updateCandidate(candidateId: string, updates: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    try {
      if (!candidateId || typeof candidateId !== 'string' || candidateId.trim() === '') {
        return {
          success: false,
          error: 'Invalid candidate ID provided'
        }
      }

      const existingCandidate = await db.candidates.get(candidateId)
      if (!existingCandidate) {
        return {
          success: false,
          error: 'Candidate not found'
        }
      }

      const updatedCandidate = {
        ...existingCandidate,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await db.candidates.update(candidateId, updatedCandidate)
      
      return {
        success: true,
        data: updatedCandidate
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to update candidate'
      }
    }
  }

  async getCandidateTimeline(candidateId: string): Promise<ApiResponse<TimelineEntry[]>> {
    try {
      if (!candidateId || typeof candidateId !== 'string' || candidateId.trim() === '') {
        return {
          success: false,
          error: 'Invalid candidate ID provided'
        }
      }

      // For now, return mock timeline data
      // You could store timeline entries in a separate IndexedDB table
      const timeline: TimelineEntry[] = [
        {
          id: generateId(),
          candidateId,
          type: 'application',
          title: 'Application Submitted',
          description: 'Applied for the position',
          date: new Date().toISOString(),
          performedBy: 'System'
        }
      ]
      
      return {
        success: true,
        data: timeline
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch candidate timeline'
      }
    }
  }

  async getAssessment(jobId: string): Promise<ApiResponse<Assessment>> {
    try {
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      // Check if assessments table exists in your db schema
      // For now, return a mock assessment
      const assessment: Assessment = {
        id: generateId(),
        jobId,
        title: 'Assessment for Job',
        description: 'Complete the following assessment',
        sections: [], // Empty sections array
        timeLimit: 60,
        passingScore: 70,
        instructions: 'Please complete all questions',
        isActive: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return {
        success: true,
        data: assessment
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to fetch assessment'
      }
    }
  }

  async saveAssessment(jobId: string, assessmentData: Partial<Assessment>): Promise<ApiResponse<Assessment>> {
    try {
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      // For production, you'd want to implement proper assessment storage
      const assessment: Assessment = {
        id: assessmentData.id || generateId(),
        jobId,
        title: assessmentData.title || 'Assessment',
        description: assessmentData.description || '',
        sections: assessmentData.sections || [],
        timeLimit: assessmentData.timeLimit || 60,
        passingScore: assessmentData.passingScore,
        instructions: assessmentData.instructions,
        isActive: assessmentData.isActive ?? true,
        createdBy: 'System', // You might want to pass this from the request
        createdAt: assessmentData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return {
        success: true,
        data: assessment
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to save assessment'
      }
    }
  }

  async submitAssessment(jobId: string, candidateId: string, responses: Response[]): Promise<ApiResponse<AssessmentResult>> {
    try {
      if (!jobId || !candidateId) {
        return {
          success: false,
          error: 'Invalid job or candidate ID provided'
        }
      }

      // Mock assessment result with proper structure
      const totalScore = Math.floor(Math.random() * 80) + 20 // Random score 20-100
      const maxScore = 100
      const percentage = (totalScore / maxScore) * 100
      const timeSpent = Math.floor(Math.random() * 1800) + 300 // 5-35 minutes
      
      const result: AssessmentResult = {
        id: generateId(),
        assessmentId: jobId,
        candidateId,
        responses,
        totalScore,
        maxScore,
        percentage,
        passed: percentage >= 70, // Assuming 70% is passing
        timeSpent,
        startedAt: new Date(Date.now() - timeSpent * 1000).toISOString(),
        submittedAt: new Date().toISOString(),
        sectionResults: [] // Empty for mock data
      }
      
      // Update candidate stage and score after assessment submission
      await this.updateCandidate(candidateId, { 
        stage: 'assessment',
        score: totalScore
      })
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: 'Failed to submit assessment'
      }
    }
  }
}

const clientAPI = new ClientSideAPI()

// Parse query parameters helper
const parseQueryParams = (endpoint: string) => {
  const url = new URL(`http://localhost${endpoint}`)
  const params: any = {}
  
  for (const [key, value] of url.searchParams.entries()) {
    switch (key) {
      case 'search': {
        params.query = value
        break
      }
      case 'page': {
        params.page = parseInt(value)
        break
      }
      case 'pageSize': {
        params.limit = parseInt(value)
        break
      }
      case 'jobId': {
        params.jobId = value
        break
      }
      case 'stage': {
        params.stage = value
        break
      }
      case 'sort': {
        const [field, direction] = value.split(':')
        params.sort = { field, direction }
        break
      }
      default: {
        params[key] = value
      }
    }
  }
  
  return params
}

// Adaptive API function that uses either real API or client-side implementation
export const adaptiveApi = async <T>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  if (hasApiServer) {
    // Use real API calls in development
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred')
    }
    
    return data
  } else {
    // Use client-side implementation in production
    const pathParts = endpoint.split('?')[0].split('/').filter(part => part.length > 0)
    const method = options?.method || 'GET'
    
    try {
      // Parse request body if present
      const body = options?.body ? JSON.parse(options.body as string) : null
      
      // Route to appropriate client-side method
      if (pathParts[0] === 'jobs') {
        if (method === 'GET') {
          if (pathParts.length === 1) {
            // GET /jobs
            const params = parseQueryParams(endpoint)
            return clientAPI.getJobs(params) as Promise<ApiResponse<T>>
          } else if (pathParts.length === 2) {
            // GET /jobs/:id
            const jobId = pathParts[1]
            return clientAPI.getJob(jobId) as Promise<ApiResponse<T>>
          }
        } else if (method === 'POST' && pathParts.length === 1) {
          // POST /jobs
          return clientAPI.createJob(body) as Promise<ApiResponse<T>>
        } else if (method === 'PATCH') {
          if (pathParts.length === 2) {
            // PATCH /jobs/:id
            const jobId = pathParts[1]
            return clientAPI.updateJob(jobId, body) as Promise<ApiResponse<T>>
          } else if (pathParts.length === 3 && pathParts[2] === 'reorder') {
            // PATCH /jobs/:id/reorder
            const jobId = pathParts[1]
            return clientAPI.reorderJob(jobId, body.newOrder) as Promise<ApiResponse<T>>
          }
        }
      } else if (pathParts[0] === 'candidates') {
        if (method === 'GET') {
          if (pathParts.length === 1) {
            // GET /candidates
            const params = parseQueryParams(endpoint)
            return clientAPI.getCandidates(params) as Promise<ApiResponse<T>>
          } else if (pathParts.length === 2) {
            // GET /candidates/:id
            const candidateId = pathParts[1]
            return clientAPI.getCandidate(candidateId) as Promise<ApiResponse<T>>
          } else if (pathParts.length === 3 && pathParts[2] === 'timeline') {
            // GET /candidates/:id/timeline
            const candidateId = pathParts[1]
            return clientAPI.getCandidateTimeline(candidateId) as Promise<ApiResponse<T>>
          }
        } else if (method === 'POST' && pathParts.length === 1) {
          // POST /candidates
          return clientAPI.createCandidate(body) as Promise<ApiResponse<T>>
        } else if (method === 'PATCH' && pathParts.length === 2) {
          // PATCH /candidates/:id
          const candidateId = pathParts[1]
          return clientAPI.updateCandidate(candidateId, body) as Promise<ApiResponse<T>>
        }
      } else if (pathParts[0] === 'assessments') {
        if (method === 'GET' && pathParts.length === 2) {
          // GET /assessments/:jobId
          const jobId = pathParts[1]
          return clientAPI.getAssessment(jobId) as Promise<ApiResponse<T>>
        } else if (method === 'PUT' && pathParts.length === 2) {
          // PUT /assessments/:jobId
          const jobId = pathParts[1]
          return clientAPI.saveAssessment(jobId, body) as Promise<ApiResponse<T>>
        } else if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'submit') {
          // POST /assessments/:jobId/submit
          const jobId = pathParts[1]
          return clientAPI.submitAssessment(jobId, body.candidateId, body.responses) as Promise<ApiResponse<T>>
        }
      }
      
      return Promise.resolve({
        success: false,
        error: `Endpoint ${method} ${endpoint} not implemented in client-side mode`
      } as ApiResponse<T>)
      
    } catch (error) {
      console.error('Client API Error:', error)
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<T>)
    }
  }
}