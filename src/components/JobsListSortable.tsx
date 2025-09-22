import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import SortableJobCard from "./SortableJobCard";
import { useReorderJobs } from "../hooks/api";
import type { Job } from "../types";

type JobsCache = { data: { data: Job[]; [k: string]: unknown } } | undefined;

export default function JobsListSortable({ jobs }: { jobs: Job[] }) {
  const qc = useQueryClient();
  const reorder = useReorderJobs();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const current = qc.getQueryData<JobsCache>(["jobs"]);
    const list: Job[] = current?.data?.data ?? jobs;

    const oldIndex = list.findIndex((j) => j.id === String(active.id));
    const newIndex = list.findIndex((j) => j.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const moved = arrayMove(list, oldIndex, newIndex);

    // snapshot for rollback
    const previous = current;

    // optimistic: set moved order into cache immediately
    qc.setQueryData<JobsCache>(["jobs"], (old) => {
      // if old is missing shape, create minimal shape with moved array
      if (!old?.data?.data) {
        return { ...(old ?? {}), data: { ...(old?.data ?? {}), data: moved } } as JobsCache;
      }
      return { ...old, data: { ...old.data, data: moved } };
    });

    // compute a simple numeric newOrder (here we send the index; backend may use other semantics)
    const jobId = String(active.id);
    const newOrder = newIndex;

    // call mutation and rollback locally on error
    reorder.mutate(
      { jobId, newOrder },
      {
        onError: (err) => {
          // rollback to previous snapshot
          qc.setQueryData<JobsCache>(["jobs"], previous);
          console.error("Reorder failed, rolled back:", err);
        },
        onSettled: () => {
          // ensure canonical state from server
          qc.invalidateQueries({ queryKey: ["jobs"] });
        },
      }
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {jobs.map((job) => (
            <SortableJobCard key={job.id} job={job} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
