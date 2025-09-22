// src/components/CreateJobModal.tsx
import { useForm } from "react-hook-form";
import { useCreateJob } from "../hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import type { Job } from "../types";

type FormValues = {
  title: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  tags?: string;
};

export default function CreateJobModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      title: "",
      location: "Remote",
      type: "full-time",
      department: "",
      salaryMin: undefined,
      salaryMax: undefined,
      description: "",
      tags: "",
    },
  });

  const qc = useQueryClient();
  const { mutateAsync } = useCreateJob();

  if (!isOpen) return null;

  const makeOptimisticJob = (values: FormValues): Job => {
    const id = nanoid();
    const now = new Date().toISOString();
    return {
      id,
      title: values.title,
      slug: values.title.toLowerCase().replace(/\s+/g, "-"),
      status: "active", 
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      order: 0,
      description: values.description ?? "",
      requirements: [],
      location: values.location ?? "Remote",
      type : values.type,
      salary: values.salaryMin || values.salaryMax ? {
        min: values.salaryMin ?? 0,
        max: values.salaryMax ?? 0,
        currency: "USD"
      } : undefined,
      department: values.department ?? "Unassigned",
      experienceLevel: 0,
      postedDate: now,
      closingDate: undefined,
      applicantCount: 0,
      createdBy: "user-1",
      updatedAt: now,
      createdAt: now,
    };
  };

  async function onSubmit(values: FormValues) {
    const optimistic = makeOptimisticJob(values);

    // snapshot previous data for rollback
    const previous = qc.getQueryData<unknown>(["jobs"]);

    // prepend optimistic job to UI
    qc.setQueryData<unknown>(["jobs"], (old: { data: { data: Job[]; }; }) => {
      if (!old?.data) {
        // if backend uses paginated shape, conform accordingly
        return {
          ...old,
          data: {
            ...(old?.data ?? {}),
            data: [optimistic]
          }
        };
      }
      // assume old.data.data is array of Job
      return {
        ...old,
        data: {
          ...old.data,
          data: [optimistic, ...(Array.isArray(old.data.data) ? old.data.data : [])],
        },
      };
    });

    try {
      // call server
      const res = await mutateAsync({
        // map to your CreateJobFormData shape — remove id if server generates it
        title: optimistic.title,
        status: optimistic.status,
        tags: optimistic.tags,
        order: optimistic.order,
        description: optimistic.description,
        requirements: optimistic.requirements,
        location: optimistic.location,
        type: optimistic.type,
        salary: optimistic.salary,
        department: optimistic.department,
        experienceLevel: optimistic.experienceLevel,
        postedDate: optimistic.postedDate,
        closingDate: optimistic.closingDate,
        createdBy: optimistic.createdBy,
      } );

      // if server returns the real job, replace optimistic entry
      const serverJob: Job | undefined = 
        res && 'data' in res && res.data && 'data' in res.data ? res.data.data as Job :
        res && 'data' in res ? res.data as Job :
        res as unknown as Job ?? undefined;
      if (serverJob) {
        qc.setQueryData<unknown>(["jobs"], (old: { data: { data: Job[]; }; }) => {
          if (!old?.data) return old;
          const jobs: Job[] = old.data.data.map((j: Job) => (j.id === optimistic.id ? serverJob : j));
          return { ...old, data: { ...old.data, data: jobs } };
        });
      }

      reset();
      onClose();
      // ensure eventual consistency
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err) {
      // rollback
      qc.setQueryData(["jobs"], previous);
      // rethrow or handle (your hook already shows toast)
      console.error("Create job failed:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose()}
        aria-hidden
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Create Job</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm">Title</span>
            <input
              {...register("title", { required: true, minLength: 3 })}
              className="mt-1 px-3 py-2 border rounded"
              placeholder="Senior Frontend Engineer"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Location</span>
            <input
              {...register("location", { required: true })}
              className="mt-1 px-3 py-2 border rounded"
              placeholder="Remote"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Type</span>
            <select {...register("type")} className="mt-1 px-3 py-2 border rounded">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Department</span>
            <input {...register("department")} className="mt-1 px-3 py-2 border rounded" placeholder="Engineering" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Tags (comma separated)</span>
            <input {...register("tags")} className="mt-1 px-3 py-2 border rounded" placeholder="React,TypeScript" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Salary (min)</span>
            <input type="number" {...register("salaryMin", { valueAsNumber: true })} className="mt-1 px-3 py-2 border rounded" />
          </label>

          <label className="col-span-1 md:col-span-2 flex flex-col">
            <span className="text-sm">Description</span>
            <textarea {...register("description")} className="mt-1 px-3 py-2 border rounded" rows={4} />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => onClose()} className="px-4 py-2 rounded border">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create Job</button>
        </div>
      </form>
    </div>
  );
}
