import Dexie from 'dexie'
 import type { Table } from 'dexie'
import type { 
  Job, 
  Candidate, 
  Assessment, 
  TimelineEntry, 
  Response, 
  AssessmentResult,
  User,
  Notification 
} from '../types'

// Database Schema
export class HRDatabase extends Dexie {
  jobs!: Table<Job>
  candidates!: Table<Candidate>
  assessments!: Table<Assessment>
  timelines!: Table<TimelineEntry>
  responses!: Table<Response>
  assessmentResults!: Table<AssessmentResult>
  users!: Table<User>
  notifications!: Table<Notification>

  constructor() {
    super('HRPortalDB')
    
    this.version(1).stores({
      jobs: 'id, title, status, department, type, experienceLevel, postedDate, createdBy',
      candidates: 'id, name, email, jobId, stage, appliedAt, score',
      assessments: 'id, jobId, title, isActive, createdBy, createdAt',
      timelines: 'id, candidateId, type, date, performedBy',
      responses: 'id, assessmentId, candidateId, questionId, sectionId, submittedAt',
      assessmentResults: 'id, assessmentId, candidateId, percentage, passed, submittedAt',
      users: 'id, email, role, isActive',
      notifications: 'id, userId, type, isRead, createdAt'
    })
  }
}

export const db = new HRDatabase()

// Seed Data Generator with Deterministic Seeds
class SeedGenerator {
  private static seed = 12345 // Deterministic seed
  
  // Simple seeded random number generator
  private static seededRandom(): number {
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }

  private static randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.seededRandom() * array.length)]
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(this.seededRandom() * (max - min + 1)) + min
  }

  private static randomDate(start: Date, end: Date): string {
    const startTime = start.getTime()
    const endTime = end.getTime()
    const randomTime = startTime + (this.seededRandom() * (endTime - startTime))
    return new Date(randomTime).toISOString()
  }

  // Generate Jobs
  static generateJobs(count: number): Job[] {
    this.seed = 12345 // Reset seed for consistency
    
    const jobTitles = [
      'Senior Frontend Developer', 'Backend Engineer', 'Full Stack Developer',
      'Product Manager', 'UX/UI Designer', 'DevOps Engineer',
      'Data Scientist', 'QA Engineer', 'Technical Lead',
      'Mobile Developer', 'System Administrator', 'Business Analyst',
      'Scrum Master', 'Solutions Architect', 'Security Engineer',
      'Marketing Manager', 'Sales Representative', 'HR Specialist',
      'Content Writer', 'Graphic Designer', 'Project Manager',
      'Customer Success Manager', 'Finance Analyst', 'Operations Manager'
    ]

    const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
    const locations = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Remote', 'Seattle, WA', 'Boston, MA']
    const types = ['full-time', 'part-time', 'contract', 'internship'] as const
    const experienceLevels = [1,2 , 3,4 , 5,6 , 7 , 8 , 9, 10] as const
    const statuses = ['active', 'archived', 'draft', 'closed'] as const

    return Array.from({ length: count }, (_, i) => ({
      id: `job-${i + 1}`,
      title: this.randomChoice(jobTitles),
      slug: `job-${i + 1}-${jobTitles[i % jobTitles.length].toLowerCase().replace(/\s+/g, '-')}`,
      status: i < count * 0.7 ? 'active' : this.randomChoice([...statuses]), // 70% active
      tags: Array.from({ length: this.randomInt(2, 5) }, () => 
        this.randomChoice(['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'MongoDB'])
      ),
      order: i,
      description: `We are looking for a talented ${jobTitles[i % jobTitles.length]} to join our dynamic team. This role offers excellent growth opportunities and competitive compensation.`,
      requirements: [
        `${this.randomInt(2, 8)}+ years of experience`,
        'Strong problem-solving skills',
        'Excellent communication abilities',
        'Team player with leadership qualities'
      ],
      location: this.randomChoice(locations),
      type: this.randomChoice([...types]),
      salary: {
        min: this.randomInt(60, 120) * 1000,
        max: this.randomInt(120, 200) * 1000,
        currency: 'USD'
      },
      department: this.randomChoice(departments),
      experienceLevel: this.randomChoice([...experienceLevels]),
      postedDate: this.randomDate(new Date('2024-01-01'), new Date()),
      closingDate: this.randomDate(new Date(), new Date('2024-12-31')),
      applicantCount: this.randomInt(5, 50),
      createdBy: 'user-1',
      updatedAt: this.randomDate(new Date('2024-01-01'), new Date()),
      createdAt: this.randomDate(new Date('2024-01-01'), new Date())
    }))
  }

  // Generate Candidates
  static generateCandidates(count: number, jobs: Job[]): Candidate[] {
    this.seed = 54321 // Different seed for candidates
    
    const firstNames = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
      'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Stephanie', 'Daniel', 'Melissa',
      'Matthew', 'Nicole', 'Anthony', 'Elizabeth', 'Mark', 'Helen', 'Donald', 'Deborah'
    ]
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
    ]

    const stages = ['applied', 'screening', 'assessment', 'interview', 'offer', 'hired', 'rejected'] as const
    const locations = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL', 'Seattle, WA', 'Remote']

    return Array.from({ length: count }, (_, i) => {
      const firstName = this.randomChoice(firstNames)
      const lastName = this.randomChoice(lastNames)
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`
      const assignedJob = this.randomChoice(jobs)

      return {
        id: `candidate-${i + 1}`,
        name: `${firstName} ${lastName}`,
        email,
        phone: `+1 (${this.randomInt(200, 999)}) ${this.randomInt(200, 999)}-${this.randomInt(1000, 9999)}`,
        jobId: assignedJob.id,
        stage: this.randomChoice([...stages]),
        location: this.randomChoice(locations),
        resume: {
          filename: `${firstName}-${lastName}-Resume.pdf`,
          url: `/resumes/${firstName}-${lastName}-Resume.pdf`,
          uploadedAt: this.randomDate(new Date('2024-01-01'), new Date())
        },
        portfolio: this.seededRandom() > 0.5 ? `https://portfolio-${firstName.toLowerCase()}.com` : undefined,
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        github: this.seededRandom() > 0.6 ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : undefined,
        experience: this.randomInt(0, 15),
        expectedSalary: {
          amount: this.randomInt(50, 180) * 1000,
          currency: 'USD'
        },
        availability: this.randomChoice(['Immediate', '2 weeks', '1 month', 'Negotiable']),
        score: this.seededRandom() > 0.3 ? this.randomInt(60, 100) : undefined,
        notes: [],
        appliedAt: this.randomDate(new Date('2024-01-01'), new Date()),
        updatedAt: this.randomDate(new Date('2024-01-01'), new Date()),
        createdAt: this.randomDate(new Date('2024-01-01'), new Date())
      }
    })
  }

  // Generate Assessments
  // static generateAssessments(jobs: Job[]): Assessment[] {
  //   this.seed = 98765 // Different seed for assessments
    
  //   const assessmentTemplates = [
  //     {
  //       title: 'Technical Skills Assessment',
  //       sections: [
  //         {
  //           id: 'section-1',
  //           title: 'Programming Knowledge',
  //           description: 'Test your programming fundamentals',
  //           order: 1,
  //           timeLimit: 30,
  //           questions: [
  //             {
  //               id: 'q1',
  //               type: 'multiple-choice' as const,
  //               title: 'What is the time complexity of binary search?',
  //               required: true,
  //               order: 1,
  //               config: {
  //                 options: [
  //                   { id: 'opt1', text: 'O(n)', isCorrect: false },
  //                   { id: 'opt2', text: 'O(log n)', isCorrect: true },
  //                   { id: 'opt3', text: 'O(n²)', isCorrect: false },
  //                   { id: 'opt4', text: 'O(1)', isCorrect: false }
  //                 ]
  //               },
  //               points: 10
  //             },
  //             {
  //               id: 'q2',
  //               type: 'code' as const,
  //               title: 'Implement a function to reverse a string',
  //               description: 'Write a function that takes a string and returns its reverse',
  //               required: true,
  //               order: 2,
  //               config: {
  //                 language: 'javascript',
  //                 startingCode: '// Write your function here\nfunction reverseString(str) {\n  // Your code here\n}',
  //                 placeholder: 'Write your solution here...'
  //               },
  //               points: 20
  //             }
  //           ]
  //         },
  //         {
  //           id: 'section-2',
  //           title: 'Problem Solving',
  //           description: 'Analytical thinking questions',
  //           order: 2,
  //           questions: [
  //             {
  //               id: 'q3',
  //               type: 'text' as const,
  //               title: 'Describe your approach to debugging a complex issue',
  //               required: true,
  //               order: 1,
  //               config: {
  //                 minLength: 100,
  //                 maxLength: 500,
  //                 placeholder: 'Describe your debugging process step by step...'
  //               },
  //               points: 15
  //             }
  //           ]
  //         }
  //       ]
  //     },
  //     {
  //       title: 'Behavioral Assessment',
  //       sections: [
  //         {
  //           id: 'section-3',
  //           title: 'Communication Skills',
  //           order: 1,
  //           questions: [
  //             {
  //               id: 'q4',
  //               type: 'rating' as const,
  //               title: 'Rate your communication skills',
  //               required: true,
  //               order: 1,
  //               config: {
  //                 scale: 5,
  //                 labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  //               },
  //               points: 10
  //             }
  //           ]
  //         }
  //       ]
  //     },
  //     {
  //       title: 'Portfolio Review',
  //       sections: [
  //         {
  //           id: 'section-4',
  //           title: 'Work Samples',
  //           order: 1,
  //           questions: [
  //             {
  //               id: 'q5',
  //               type: 'file-upload' as const,
  //               title: 'Upload your best project',
  //               description: 'Share a project that showcases your skills',
  //               required: true,
  //               order: 1,
  //               config: {
  //                 allowedTypes: ['.pdf', '.zip', '.jpg', '.png'],
  //                 maxSize: 10485760 // 10MB
  //               },
  //               points: 25
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]

  //   return assessmentTemplates.map((template, i) => ({
  //     id: `assessment-${i + 1}`,
  //     jobId: jobs[i % jobs.length].id,
  //     title: template.title,
  //     description: `Comprehensive ${template.title.toLowerCase()} for candidates`,
  //     sections: template.sections,
  //     timeLimit: 90,
  //     passingScore: 70,
  //     instructions: 'Please read all questions carefully and provide thoughtful answers. You have 90 minutes to complete this assessment.',
  //     isActive: true,
  //     createdBy: 'user-1',
  //     createdAt: this.randomDate(new Date('2024-01-01'), new Date()),
  //     updatedAt: this.randomDate(new Date('2024-01-01'), new Date())
  //   }))
  // }

  // Generate Timeline Entries
  static generateTimelines(candidates: Candidate[]): TimelineEntry[] {
    this.seed = 13579 // Different seed for timelines
    
    const events = [
      { type: 'application' as const, title: 'Application submitted', description: 'Candidate submitted their application' },
      { type: 'review' as const, title: 'Resume reviewed', description: 'HR team reviewed the resume' },
      { type: 'assessment' as const, title: 'Assessment sent', description: 'Technical assessment sent to candidate' },
      { type: 'assessment' as const, title: 'Assessment completed', description: 'Candidate completed the assessment' },
      { type: 'interview' as const, title: 'Phone interview scheduled', description: 'Initial phone screening scheduled' },
      { type: 'interview' as const, title: 'Technical interview', description: 'Technical interview with the team' },
      { type: 'offer' as const, title: 'Offer extended', description: 'Job offer sent to candidate' },
      { type: 'hire' as const, title: 'Candidate hired', description: 'Welcome to the team!' },
      { type: 'rejection' as const, title: 'Application declined', description: 'Thank you for your interest' }
    ]

    const timelines: TimelineEntry[] = []

    candidates.forEach((candidate, candidateIndex) => {
      const numEvents = this.randomInt(2, 6)
      
      for (let i = 0; i < numEvents; i++) {
        const event = this.randomChoice(events)
        const eventDate = this.randomDate(new Date(candidate.appliedAt), new Date())
        
        timelines.push({
          id: `timeline-${candidateIndex}-${i}`,
          candidateId: candidate.id,
          type: event.type,
          title: event.title,
          description: event.description,
          date: eventDate,
          performedBy: 'user-1',
          metadata: {
            score: event.type === 'assessment' ? this.randomInt(60, 100) : undefined,
            interviewType: event.type === 'interview' ? this.randomChoice(['phone', 'video', 'onsite']) : undefined,
            notes: `System generated event for ${candidate.name}`
          }
        })
      }
    })

    return timelines
  }
}

// Database Operations
export class DatabaseService {
  
  // Seed the database with initial data
  static async seedDatabase(): Promise<void> {
    try {
      console.log('🌱 Seeding database...')
      
      // Clear existing data
      await db.transaction('rw', [db.jobs, db.candidates, db.assessments, db.timelines], async () => {
        await db.jobs.clear()
        await db.candidates.clear() 
        await db.assessments.clear()
        await db.timelines.clear()
      })

      // Generate seed data
      const jobs = SeedGenerator.generateJobs(25)
      const candidates = SeedGenerator.generateCandidates(1000, jobs)
      // const assessments = SeedGenerator.generateAssessments(jobs.slice(0, 3)) // 3 assessments
      const timelines = SeedGenerator.generateTimelines(candidates)

      // Insert data
      await db.transaction('rw', [db.jobs, db.candidates, db.assessments, db.timelines], async () => {
        await db.jobs.bulkAdd(jobs)
        await db.candidates.bulkAdd(candidates)
        await db.timelines.bulkAdd(timelines)
      })

      console.log('✅ Database seeded successfully!')
    } catch (error) {
      console.error('❌ Error seeding database:', error)
      throw error
    }
  }

  // Reset database (clear all data and re-seed)
  static async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...')
      
      // Clear all tables
      await db.transaction('rw', [
        db.jobs, 
        db.candidates, 
        db.assessments, 
        db.timelines,
        db.responses,
        db.assessmentResults,
        db.users,
        db.notifications
      ], async () => {
        await Promise.all([
          db.jobs.clear(),
          db.candidates.clear(),
          db.assessments.clear(),
          db.timelines.clear(),
          db.responses.clear(),
          db.assessmentResults.clear(),
          db.users.clear(),
          db.notifications.clear()
        ])
      })

      // Re-seed with fresh data
      await this.seedDatabase()
      
      console.log('🔄 Database reset complete!')
      
    } catch (error) {
      console.error('❌ Error resetting database:', error)
      throw error
    }
  }

  // Check if database is empty and seed if needed
  static async initializeDatabase(): Promise<void> {
    try {
      const jobCount = await db.jobs.count()
      
      if (jobCount === 0) {
        console.log('📊 Empty database detected, seeding...')
        await this.seedDatabase()
      } else {
        console.log(`📊 Database already contains ${jobCount} jobs`)
      }
    } catch (error) {
      console.error('❌ Error initializing database:', error)
      throw error
    }
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<{
    jobs: number
    candidates: number
    assessments: number
    timelines: number
    responses: number
  }> {
    try {
      const [jobs, candidates, assessments, timelines, responses] = await Promise.all([
        db.jobs.count(),
        db.candidates.count(),
        db.assessments.count(),
        db.timelines.count(),
        db.responses.count()
      ])

      return { jobs, candidates, assessments, timelines, responses }
    } catch (error) {
      console.error('❌ Error getting database stats:', error)
      throw error
    }
  }
}

if (typeof window !== 'undefined') {
  DatabaseService.initializeDatabase().catch(console.error)
}


export default db