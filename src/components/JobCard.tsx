// src/components/JobCard.tsx
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateJob } from "../hooks/api";
import type { Job } from "../types";

type JobsCache = { data: { data: Job[]; [k: string]: unknown } } | undefined;

export default function JobCard({ job }: { job: Job }) {
  const qc = useQueryClient();
  const update = useUpdateJob();

  const toggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: Job["status"] = job.status === "archived" ? "active" : "archived";

    // snapshot previous cache for rollback
    const previous = qc.getQueryData<JobsCache>(["jobs"]);

    // typed optimistic update
    qc.setQueryData<JobsCache>(["jobs"], (old) => {
      if (!old?.data?.data) return old;
      const jobs = old.data.data.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j));
      return { ...old, data: { ...old.data, data: jobs } };
    });

    // call server; rollback on error
    update.mutate(
      { jobId: job.id, updates: { status: newStatus } },
      {
        onError: (err) => {
          // rollback
          qc.setQueryData<JobsCache>(["jobs"], previous);
          console.error("Failed to toggle archive:", err);
        },
        onSettled: () => {
          // ensure we eventually sync with server
          qc.invalidateQueries({ queryKey: ["jobs"] });
        },
      }
    );
  };

  return (
    <div
      className={`p-4 border rounded bg-white ${job.status === "archived" ? "opacity-60" : ""}`}
      data-id={job.id}
      data-status={job.status}
      role="listitem"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p className="text-sm text-slate-500">{job.location} • {job.type}</p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={toggleArchive}
            className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-50"
            title={job.status === "archived" ? "Unarchive" : "Archive"}
            aria-pressed={job.status === "archived"}
            data-testid="toggle-archive-button"
          >
            {job.status === "archived" ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>

      <div className="mt-3">
        {job.tags?.slice(0, 3).map((t) => (
          <span key={t} className="inline-block px-2 py-1 mr-2 rounded bg-blue-50 text-blue-700 text-xs">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
