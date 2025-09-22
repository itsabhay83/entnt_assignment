// src/components/SortableJobCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobCard from "./JobCard";
import type { Job } from "../types";

export default function SortableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "manipulation",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} />
    </div>
  );
}
