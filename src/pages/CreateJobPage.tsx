// src/pages/CreateJobPage.tsx
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCreateJob } from '../hooks/api'
import type { Job } from '../types'
type FormValues = {
  title: string
  location?: string
  type?: string
  department?: string
  description?: string
  tags?: string
}

export default function CreateJobPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { location: 'Remote', type: 'full-time' }
  })
  const navigate = useNavigate()
  const create = useCreateJob()

  async function onSubmit(values: FormValues) {
    const now = new Date().toISOString()
    // adjust payload to match server; remove id if server generates it
    const payload: Partial<Job> = {
      title: values.title,
      slug: values.title.toLowerCase().replace(/\s+/g, '-'),
      status: 'draft',
      tags: values.tags ? values.tags.split(',').map(t => t.trim()) : [],
      order: 999,
      description: values.description ?? '',
      location: values.location ?? 'Remote',
      department: values.department ?? 'Unassigned',
      experienceLevel: 0,
      postedDate: now,
      applicantCount: 0,
      createdBy: 'user-1',
      updatedAt: now,
      createdAt: now
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await create.mutateAsync(payload as any) 
      // if API returns created job in res.data
      const createdId = res?.data?.id ?? payload.id
      navigate(`/jobs/${createdId}`)
    } catch (err) {
      // your hook already toasts onError; optionally handle here
      console.error('Create job failed', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Job</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register('title', { required: true })} placeholder="Job title" className="w-full p-2 border rounded" />
        <input {...register('location')} placeholder="Location" className="w-full p-2 border rounded" />
        <select {...register('type')} className="w-full p-2 border rounded">
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <input {...register('department')} placeholder="Department" className="w-full p-2 border rounded" />
        <input {...register('tags')} placeholder="Tags (comma separated)" className="w-full p-2 border rounded" />
        <textarea {...register('description')} placeholder="Description" className="w-full p-2 border rounded" rows={6} />
        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
            {isSubmitting ? 'Creating…' : 'Create Job'}
          </button>
          <button type="button" onClick={() => navigate('/jobs')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}
