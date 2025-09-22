/* eslint-disable @typescript-eslint/no-unused-vars */
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { db } from '../database/db'
import type { 
  Job, 
  Candidate, 
  Assessment, 
  TimelineEntry, 
  Response,
  AssessmentResult,
//   JobFilters,
//   CandidateFilters,
  SearchParams,
  PaginatedResponse,
  JobStatus
//   ApiResponse 
} from '../types/index.ts'

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const simulateLatency = async () => {
  const latency = Math.random() * (1200 - 200) + 200 // 200-1200ms
  await delay(latency)
}

const simulateError = (errorRate = 0.1) => {
  return Math.random() < errorRate
}

const parseQueryParams = (url: URL): SearchParams => {
  const params: SearchParams = {}
  
  if (url.searchParams.get('search')) {
    params.query = url.searchParams.get('search') || ''
  }
  
  if (url.searchParams.get('page')) {
    params.page = parseInt(url.searchParams.get('page') || '1')
  }
  
  if (url.searchParams.get('pageSize')) {
    params.limit = parseInt(url.searchParams.get('pageSize') || '10')
  }
  
  if (url.searchParams.get('sort')) {
    const [field, direction] = url.searchParams.get('sort')?.split(':') || []
    if (field && direction) {
      params.sort = { field, direction: direction as 'asc' | 'desc' }
    }
  }
  
  return params
}

const paginateResults = <T>(
  items: T[], 
  page: number = 1, 
  limit: number = 10
): PaginatedResponse<T> => {
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const data = items.slice(start, end)
  
  return {
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

export const handlers = [
  // ===== JOBS ENDPOINTS =====
  
  // GET /jobs - List jobs with search, filters, pagination
  http.get('/api/jobs', async ({ request }) => {
    await simulateLatency()
    
    if (simulateError(0.05)) { // 5% error rate
      return HttpResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }
    
    try {
      const url = new URL(request.url)
      const params = parseQueryParams(url)
      
      // Extract filters from query params
      const statusFilter = url.searchParams.getAll('status')
      const departmentFilter = url.searchParams.getAll('department')
      const typeFilter = url.searchParams.getAll('type')
      
      let jobs = await db.jobs.toArray()
      
      // Apply search
      if (params.query) {
        const query = params.query.toLowerCase()
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query)
        )
      }
      
      // Apply filters
      if (statusFilter.length > 0) {
        jobs = jobs.filter(job => statusFilter.includes(job.status))
      }
      
      if (departmentFilter.length > 0) {
        jobs = jobs.filter(job => job.department && departmentFilter.includes(job.department))
      }
      
      if (typeFilter.length > 0) {
        jobs = jobs.filter(job => typeFilter.includes(job.type))
      }
      
      // Apply sorting
      if (params.sort) {
        jobs.sort((a, b) => {
          const aVal = (a as never)[params.sort!.field]
          const bVal = (b as never)[params.sort!.field]
          
          if (params.sort!.direction === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }
      
      // Apply pagination
      const result = paginateResults(jobs, params.page, params.limit)
      
      return HttpResponse.json({
        success: true,
        data: result
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }
  }),
  
  // POST /jobs - Create new job
  http.post('/api/jobs', async ({ request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) { 
      return HttpResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 500 }
      )
    }
    
    try {
      const jobData = await request.json() as Partial<Job>
      
      const newJob: Job = {
        id: `job-${Date.now()}`,
        title: jobData.title || 'Untitled Job',
        slug: (jobData.title || 'untitled-job').toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
        status: (jobData.status as JobStatus) || 'draft',
        tags: jobData.tags || [],
        order: jobData.order || 0,
        location: jobData.location || 'Remote',
        type: jobData.type || 'full-time',
        experienceLevel: jobData.experienceLevel || 0,
        postedDate: jobData.postedDate || new Date().toISOString(),
        applicantCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: jobData.createdBy || 'system',
        ...jobData
      }
      
      await db.jobs.add(newJob)
      
      return HttpResponse.json({
        success: true,
        data: newJob
      }, { status: 201 })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 400 }
      )
    }
  }),

  http.get('/api/jobs/:id', async ({ params }) => {
  await simulateLatency();
  const jobId = params.id as string;
  const job = await db.jobs.get(jobId);
  if (!job) {
    return HttpResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }
  return HttpResponse.json({ success: true, data: job });
}),
  // PATCH /jobs/:id - Update job
  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to update job' },
        { status: 500 }
      )
    }
    
    try {
      const jobId = params.id as string
      const updates = await request.json() as Partial<Job>
      
      const existingJob = await db.jobs.get(jobId)
      if (!existingJob) {
        return HttpResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        )
      }
      
      const updatedJob = {
        ...existingJob,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await db.jobs.update(jobId, updatedJob)
      
      return HttpResponse.json({
        success: true,
        data: updatedJob
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to update job' },
        { status: 400 }
      )
    }
  }),
  
  // PATCH /jobs/:id/reorder - Reorder job (with 5-10% 500 error rate)
  http.patch('/api/jobs/:id/reorder', async ({ params, request }) => {
    await simulateLatency()
    
    // Simulate rollback scenario - 5-10% chance of 500 error
    if (simulateError(0.075)) { // 7.5% error rate
      return HttpResponse.json(
        { success: false, error: 'Reorder operation failed - rolling back' },
        { status: 500 }
      )
    }
    
    try {
      const jobId = params.id as string
      const { newOrder } = await request.json() as { newOrder: number }
      
      const job = await db.jobs.get(jobId)
      if (!job) {
        return HttpResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        )
      }
      
      // Update job order
      await db.jobs.update(jobId, { 
        order: newOrder,
        updatedAt: new Date().toISOString()
      })
      
      const updatedJob = await db.jobs.get(jobId)
      
      return HttpResponse.json({
        success: true,
        data: updatedJob
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to reorder job' },
        { status: 500 }
      )
    }
  }),
  
  // ===== CANDIDATES ENDPOINTS =====
  
  // GET /candidates - List candidates with search, filters, pagination
  http.get('/api/candidates', async ({ request }) => {
    await simulateLatency()
    
    if (simulateError(0.05)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to fetch candidates' },
        { status: 500 }
      )
    }
    
    try {
      const url = new URL(request.url)
      const params = parseQueryParams(url)
      
      // Extract filters
      const stageFilter = url.searchParams.getAll('stage')
      const jobIdFilter = url.searchParams.get('jobId')
      
      let candidates = await db.candidates.toArray()
      
      // Apply search
      if (params.query) {
        const query = params.query.toLowerCase()
        candidates = candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query)
        )
      }
      
      // Apply filters
      if (stageFilter.length > 0) {
        candidates = candidates.filter(candidate => stageFilter.includes(candidate.stage))
      }
      
      if (jobIdFilter) {
        candidates = candidates.filter(candidate => candidate.jobId === jobIdFilter)
      }
      
      // Apply sorting
      if (params.sort) {
        candidates.sort((a, b) => {
          const aVal = (a as never)[params.sort!.field]
          const bVal = (b as never)[params.sort!.field]
          
          if (params.sort!.direction === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }
      
      const result = paginateResults(candidates, params.page, params.limit)
      
      return HttpResponse.json({
        success: true,
        data: result
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }
  }),
  
  // POST /candidates - Create new candidate
  http.post('/api/candidates', async ({ request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to create candidate' },
        { status: 500 }
      )
    }
    
    try {
      const candidateData = await request.json() as Partial<Candidate>
      
      const newCandidate: Candidate = {
        id: `candidate-${Date.now()}`,
        name: candidateData.name || 'Unknown Candidate',
        email: candidateData.email || `candidate-${Date.now()}@example.com`,
        stage: 'applied',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...candidateData
      }
      
      await db.candidates.add(newCandidate)
      
      return HttpResponse.json({
        success: true,
        data: newCandidate
      }, { status: 201 })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to create candidate' },
        { status: 400 }
      )
    }
  }),
  
  // PATCH /candidates/:id - Update candidate
  http.patch('/api/candidates/:id', async ({ params, request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to update candidate' },
        { status: 500 }
      )
    }
    
    try {
      const candidateId = params.id as string
      const updates = await request.json() as Partial<Candidate>
      
      const existingCandidate = await db.candidates.get(candidateId)
      if (!existingCandidate) {
        return HttpResponse.json(
          { success: false, error: 'Candidate not found' },
          { status: 404 }
        )
      }
      
      const updatedCandidate = {
        ...existingCandidate,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await db.candidates.update(candidateId, updatedCandidate)
      
      // If stage changed, add timeline entry
      if (updates.stage && updates.stage !== existingCandidate.stage) {
        const timelineEntry: TimelineEntry = {
          id: `timeline-${Date.now()}`,
          candidateId,
          type: updates.stage === 'hired' ? 'hire' : 
                updates.stage === 'rejected' ? 'rejection' :
                updates.stage === 'interview' ? 'interview' : 'review',
          title: `Stage changed to ${updates.stage}`,
          description: `Candidate moved to ${updates.stage} stage`,
          date: new Date().toISOString(),
          performedBy: 'current-user'
        }
        
        await db.timelines.add(timelineEntry)
      }
      
      return HttpResponse.json({
        success: true,
        data: updatedCandidate
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to update candidate' },
        { status: 400 }
      )
    }
  }),
  // GET /candidates/:id - Fetch a single candidate
    http.get('/api/candidates/:id', async ({ params }) => {
      await simulateLatency()

      if (simulateError(0.05)) {
        return HttpResponse.json(
          { success: false, error: 'Failed to fetch candidate' },
          { status: 500 }
        )
      }

      try {
        const candidateId = params.id as string
        const candidate = await db.candidates.get(candidateId)

        if (!candidate) {
          return HttpResponse.json(
            { success: false, error: 'Candidate not found' },
            { status: 404 }
          )
        }

        return HttpResponse.json({
          success: true,
          data: candidate
        })
      } catch (error) {
        return HttpResponse.json(
          { success: false, error: 'Database error' },
          { status: 500 }
        )
      }
    }),

  // GET /candidates/:id/timeline - Get candidate timeline
  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await simulateLatency()
    
    if (simulateError(0.05)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to fetch timeline' },
        { status: 500 }
      )
    }
    
    try {
      const candidateId = params.id as string
      const timeline = await db.timelines
        .where('candidateId')
        .equals(candidateId)
        .sortBy('date')
      
      return HttpResponse.json({
        success: true,
        data: timeline
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }
  }),
  
  // ===== ASSESSMENTS ENDPOINTS =====
  
  // GET /assessments/:jobId - Get assessment for job
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await simulateLatency()
    
    if (simulateError(0.05)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to fetch assessment' },
        { status: 500 }
      )
    }
    
    try {
      const jobId = params.jobId as string
      const assessment = await db.assessments
        .where('jobId')
        .equals(jobId)
        .first()
      
      if (!assessment) {
        return HttpResponse.json(
          { success: false, error: 'Assessment not found' },
          { status: 404 }
        )
      }
      
      return HttpResponse.json({
        success: true,
        data: assessment
      })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }
  }),
  
  // PUT /assessments/:jobId - Create or update assessment
  http.put('/api/assessments/:jobId', async ({ params, request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to save assessment' },
        { status: 500 }
      )
    }
    
    try {
      const jobId = params.jobId as string
      const assessmentData = await request.json() as Partial<Assessment>
      
      const existingAssessment = await db.assessments
        .where('jobId')
        .equals(jobId)
        .first()
      
      if (existingAssessment) {
        // Update existing
        const updatedAssessment = {
          ...existingAssessment,
          ...assessmentData,
          updatedAt: new Date().toISOString()
        }
        
        await db.assessments.update(existingAssessment.id, updatedAssessment)
        
        return HttpResponse.json({
          success: true,
          data: updatedAssessment
        })
      } else {
        // Create new
        const newAssessment: Assessment = {
          id: `assessment-${Date.now()}`,
          jobId,
          title: assessmentData.title || 'Untitled Assessment',
          sections: assessmentData.sections || [],
          isActive: true,
          createdBy: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...assessmentData
        }
        
        await db.assessments.add(newAssessment)
        
        return HttpResponse.json({
          success: true,
          data: newAssessment
        }, { status: 201 })
      }
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to save assessment' },
        { status: 400 }
      )
    }
  }),
  
  // POST /assessments/:jobId/submit - Submit assessment response
  http.post('/api/assessments/:jobId/submit', async ({ params, request }) => {
    await simulateLatency()
    
    if (simulateError(0.1)) {
      return HttpResponse.json(
        { success: false, error: 'Failed to submit assessment' },
        { status: 500 }
      )
    }
    
    try {
      const jobId = params.jobId as string
      const { candidateId, responses } = await request.json() as {
        candidateId: string
        responses: Response[]
      }
      
      // Save responses
      await db.responses.bulkAdd(responses.map(response => ({
        ...response,
        id: `response-${Date.now()}-${Math.random()}`,
        submittedAt: new Date().toISOString()
      })))
      
      // Calculate score (simplified)
      const totalQuestions = responses.length
      const correctAnswers = Math.floor(Math.random() * totalQuestions * 0.8) + Math.floor(totalQuestions * 0.2)
      const percentage = Math.round((correctAnswers / totalQuestions) * 100)
      
      // Create assessment result
      const result: AssessmentResult = {
        id: `result-${Date.now()}`,
        assessmentId: `assessment-${jobId}`,
        candidateId,
        responses,
        totalScore: correctAnswers * 10,
        maxScore: totalQuestions * 10,
        percentage,
        passed: percentage >= 70,
        timeSpent: Math.floor(Math.random() * 3600) + 1800, // 30-90 minutes
        startedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        submittedAt: new Date().toISOString(),
        sectionResults: []
      }
      
      await db.assessmentResults.add(result)
      
      // Update candidate score
      await db.candidates.update(candidateId, {
        score: percentage,
        stage: 'assessment',
        updatedAt: new Date().toISOString()
      })
      
      // Add timeline entry
      const timelineEntry: TimelineEntry = {
        id: `timeline-${Date.now()}`,
        candidateId,
        type: 'assessment',
        title: 'Assessment completed',
        description: `Scored ${percentage}% on technical assessment`,
        date: new Date().toISOString(),
        performedBy: candidateId,
        metadata: { score: percentage }
      }
      
      await db.timelines.add(timelineEntry)
      
      return HttpResponse.json({
        success: true,
        data: result
      }, { status: 201 })
      
    } catch (error) {
      return HttpResponse.json(
        { success: false, error: 'Failed to submit assessment' },
        { status: 400 }
      )
    }
  }),

  http.get('/candidates', async ({ request }) => {
  await simulateLatency()
  
  if (simulateError(0.05)) {
    return HttpResponse.json(
      { success: false, error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
  
  try {
    const url = new URL(request.url)
    const params = parseQueryParams(url)
    
    // Extract filters
    const stageFilter = url.searchParams.getAll('stage')
    const jobIdFilter = url.searchParams.get('jobId')
    
    let candidates = await db.candidates.toArray()
    
    // Apply search
    if (params.query) {
      const query = params.query.toLowerCase()
      candidates = candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query)
      )
    }
    
    // Apply filters
    if (stageFilter.length > 0) {
      candidates = candidates.filter(candidate => stageFilter.includes(candidate.stage))
    }
    
    if (jobIdFilter) {
      candidates = candidates.filter(candidate => candidate.jobId === jobIdFilter)
    }
    
    // Apply sorting
    if (params.sort) {
      candidates.sort((a, b) => {
        const aVal = (a as never)[params.sort!.field]
        const bVal = (b as never)[params.sort!.field]
        
        if (params.sort!.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }
    
    const result = paginateResults(candidates, params.page, params.limit)
    
    return HttpResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    return HttpResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    )
  }
}),
]