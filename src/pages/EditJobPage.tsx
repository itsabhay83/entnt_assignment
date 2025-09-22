import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useJob, useUpdateJob } from '../hooks/api';
import type { Job } from '../types';

type FormValues = {
  title: string;
  location: string;
  type: string;
  department?: string;
  description?: string;
  tags?: string;
};

export default function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: jobResponse, isLoading } = useJob(jobId!);
  const updateJob = useUpdateJob();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (jobResponse?.data) {
      const job = jobResponse.data;
      reset({
        title: job.title,
        location: job.location,
        type: job.type,
        department: job.department,
        description: job.description,
        tags: job.tags?.join(', ') ?? ''
      });
    }
  }, [jobResponse, reset]);

  if (isLoading) return <div className="p-6">Loading job...</div>;

  const onSubmit = async (values: FormValues) => {
    if (!jobId) return;
    const updates: Partial<Job> = {
      title: values.title,
      location: values.location,
      type: values.type as Job['type'],
      department: values.department,
      description: values.description,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()) : []
    };
    try {
      await updateJob.mutateAsync({ jobId, updates });
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Job</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register('title', { required: true })} placeholder="Title" className="w-full p-2 border rounded" />
        <input {...register('location')} placeholder="Location" className="w-full p-2 border rounded" />
        <select {...register('type')} className="w-full p-2 border rounded">
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <input {...register('department')} placeholder="Department" className="w-full p-2 border rounded" />
        <textarea {...register('description')} placeholder="Description" className="w-full p-2 border rounded" />
        <input {...register('tags')} placeholder="Tags (comma separated)" className="w-full p-2 border rounded" />
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
