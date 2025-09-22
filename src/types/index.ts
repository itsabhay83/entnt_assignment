export type JobStatus = 'active' | 'archived' | 'draft' | 'closed'
export type Stage = 'applied' | 'screening' | 'assessment' | 'interview' | 'offer' | 'hired' | 'rejected'
export type QuestionType =
  | 'short-text'
  | 'long-text'
  | 'single-choice'
  | 'multi-choice'
  | 'numeric-range'
  | 'file-upload'
export type TimelineEventType = 'application' | 'review' | 'assessment' | 'interview' | 'offer' | 'rejection' | 'hire'
export type Job = {
  id: string
  title: string
  slug: string
  status: JobStatus
  tags: string[]
  order: number
  description?: string
  requirements?: string[]
  location: string
  type: JobType
  salary?: {
    min: number
    max: number
    currency: string
  }
  department?: string
  experienceLevel: number
  postedDate: string
  closingDate?: string
  applicantCount: number
  createdBy: string
  updatedAt: string
  createdAt: string
}
export type Candidate = {
  id: string
  name: string
  email: string
  phone?: string
  jobId?: string
  stage: Stage
  location?: string
  resume?: {
    filename: string
    url: string
    uploadedAt: string
  }
  coverLetter?: string
  portfolio?: string
  linkedin?: string
  github?: string
  experience?: number // years of experience
  expectedSalary?: {
    amount: number
    currency: string
  }
  availability?: string
  score?: number // assessment score (0-100)
  notes?: string[]
  appliedAt: string
  updatedAt: string
  createdAt: string
}
export type TimelineEntry = {
  id: string
  candidateId: string
  type: TimelineEventType
  title: string
  description?: string
  date: string
  performedBy?: string // user who performed the action
  metadata?: {
    score?: number
    interviewType?: string
    assessmentId?: string
    notes?: string
    [key: string]: unknown
  }
}
export type Question = {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  config: {
    // For multiple-choice
    options?: Array<{
      id: string
      text: string
      isCorrect?: boolean
    }>
    // For text questions
    maxLength?: number
    minLength?: number
    placeholder?: string

    // For numeric range questions
    min?: number
    max?: number

    // For file upload
    allowedTypes?: string[]
    maxSize?: number

    // conditional show rule
    showIf?: { questionId?: string; equals?: string | number | boolean }
  }
  points?: number
}
export type Section = {
  id: string
  title: string
  description?: string
  order: number
  timeLimit?: number
  questions: Question[]
}
export type Assessment = {
  id: string
  jobId: string
  title: string
  description?: string
  sections: Section[]
  timeLimit?: number
  passingScore?: number
  instructions?: string
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}
export type Response = {
  id: string
  assessmentId: string
  candidateId: string
  questionId: string
  sectionId: string
  answer: {
    selectedOptionId?: string
    selectedOptionIds?: string[]
    text?: string
    files?: Array<{ filename: string; url: string; size: number }>
    rating?: number
  }
  timeSpent?: number
  submittedAt: string
}
export type AssessmentResult = {
  id: string
  assessmentId: string
  candidateId: string
  responses: Response[]
  totalScore: number
  maxScore: number
  percentage: number
  passed: boolean
  timeSpent: number // total seconds
  startedAt: string
  submittedAt: string
  sectionResults: Array<{
    sectionId: string
    score: number
    maxScore: number
    timeSpent: number
  }>
}
export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'hr' | 'recruiter' | 'hiring-manager'
  avatar?: string
  department?: string
  permissions: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}
export type Notification = {
  id: string
  userId: string
  type: 'candidate-applied' | 'assessment-completed' | 'interview-scheduled' | 'system'
  title: string
  message: string
  isRead: boolean
  data?: {
    candidateId?: string
    jobId?: string
    assessmentId?: string
    [key: string]: unknown
  }
  createdAt: string
}
export type JobAnalytics = {
  jobId: string
  totalApplications: number
  newApplications: number
  assessmentsSent: number
  assessmentsCompleted: number
  interviewsScheduled: number
  offersExtended: number
  hires: number
  averageScore: number
  conversionRates: {
    applicationToAssessment: number
    assessmentToInterview: number
    interviewToOffer: number
    offerToHire: number
  }
  timeToHire?: number // average days
  periodStart: string
  periodEnd: string
}
export type DashboardStats = {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  newCandidates: number
  totalAssessments: number
  completedAssessments: number
  averageScore: number
  timeToHire: number
  trends: {
    jobs: number // percentage change
    candidates: number
    assessments: number
    score: number
  }
}
export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
}
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
export type JobFilters = {
  status?: JobStatus[]
  department?: string[]
  type?: string[]
  experienceLevel?: string[]
  location?: string[]
  dateRange?: {
    start: string
    end: string
  }
}
export type CandidateFilters = {
  stage?: Stage[]
  jobId?: string[]
  experienceLevel?: string[]
  location?: string[]
  scoreRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
}
export type SearchParams = {
  query?: string
  filters?: JobFilters | CandidateFilters
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  page?: number
  limit?: number
}
export type CreateJobFormData = Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount' | 'slug'>
export type CreateCandidateFormData = Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'stage' | 'score'>
export type CreateAssessmentFormData = Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type JobCardProps = {
  job: Job
  onEdit?: (job: Job) => void
  onDelete?: (jobId: string) => void
  onViewCandidates?: (jobId: string) => void
}
export type CandidateCardProps = {
  candidate: Candidate
  onStageChange?: (candidateId: string, stage: Stage) => void
  onViewProfile?: (candidateId: string) => void
  onSendAssessment?: (candidateId: string) => void
}
export type AssessmentBuilderProps = {
  assessment?: Assessment
  onSave: (assessment: CreateAssessmentFormData) => void
  onPreview?: (assessment: Assessment) => void
}
export type AppState = {
  user: User | null
  jobs: Job[]
  candidates: Candidate[]
  assessments: Assessment[]
  notifications: Notification[]
  loading: boolean
  error: string | null
}
export type JobsState = {
  jobs: Job[]
  currentJob: Job | null
  filters: JobFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
  loading: boolean
  error: string | null
}
export type CandidatesState = {
  candidates: Candidate[]
  currentCandidate: Candidate | null
  timeline: TimelineEntry[]
  filters: CandidateFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
  loading: boolean
  error: string | null
}
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type UpdatePayload<T> = DeepPartial<T> & { id: string }
export type CreatePayload<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>