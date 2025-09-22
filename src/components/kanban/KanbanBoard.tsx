import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateCandidate, useCandidatesByStage } from '../../hooks/api'
import type { Candidate, Stage } from '../../types'
import CandidateCard from './CandidateCard'

const STAGES: Stage[] = ['applied', 'screening', 'assessment', 'interview', 'offer', 'hired', 'rejected']
const STAGE_LABEL: Record<Stage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  assessment: 'Assessment',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected'
}

const PAGE_SIZE = 6

function groupByStage(items: Candidate[]) {
  const result: Record<Stage, Candidate[]> = {
    applied: [], screening: [], assessment: [], interview: [], offer: [], hired: [], rejected: []
  }
  items.forEach(i => {
    const s = (i.stage as Stage) ?? 'applied'
    if (!result[s]) result[s] = []
    result[s].push(i)
  })
  return result
}

export default function KanbanBoard({ jobId }: { jobId?: string }) {
  const { id: candidateParamId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const updateCandidate = useUpdateCandidate()

  const [pages, setPages] = useState<Record<Stage, number>>(() =>
    STAGES.reduce((acc, s) => ({ ...acc, [s]: 1 }), {} as Record<Stage, number>)
  )

  const respApplied = useCandidatesByStage('applied', pages.applied, PAGE_SIZE, jobId)
  const respScreening = useCandidatesByStage('screening', pages.screening, PAGE_SIZE, jobId)
  const respAssessment = useCandidatesByStage('assessment', pages.assessment, PAGE_SIZE, jobId)
  const respInterview = useCandidatesByStage('interview', pages.interview, PAGE_SIZE, jobId)
  const respOffer = useCandidatesByStage('offer', pages.offer, PAGE_SIZE, jobId)
  const respHired = useCandidatesByStage('hired', pages.hired, PAGE_SIZE, jobId)
  const respRejected = useCandidatesByStage('rejected', pages.rejected, PAGE_SIZE, jobId)

  // keep explicit array (avoid stale closure issues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stageResponses = [
    respApplied,
    respScreening,
    respAssessment,
    respInterview,
    respOffer,
    respHired,
    respRejected
  ]

  const itemsByStage = useMemo(() => {
    const map: Record<Stage, Candidate[]> = {
      applied: [], screening: [], assessment: [], interview: [], offer: [], hired: [], rejected: []
    }
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i]
      const resp = stageResponses[i]
      map[stage] = resp?.data?.data ?? []
    }
    return map
  }, [stageResponses])

  const combinedItems = useMemo(() => STAGES.flatMap(s => itemsByStage[s]), [itemsByStage])
  const initialCols = useMemo(() => groupByStage(combinedItems), [combinedItems])
  const [columns, setColumns] = useState<Record<Stage, Candidate[]>>(initialCols)

  const prevInitialColsRef = useRef<string>('')

  useEffect(() => {
    const currentColsString = JSON.stringify(initialCols)
    if (prevInitialColsRef.current !== currentColsString) {
      setColumns(initialCols)
      prevInitialColsRef.current = currentColsString
    }
  } , [initialCols])

  // reload helper: try to refetch each hook, then invalidate queries, fallback to full reload
  const reloadData = useCallback(async () => {
    try {
      // 1) try to call refetch on each response if available
      const refetchPromises = stageResponses.map(r => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return typeof (r as any)?.refetch === 'function' ? (r as any).refetch() : Promise.resolve(null)
        } catch {
          return Promise.resolve(null)
        }
      })
      await Promise.all(refetchPromises)

      // 2) invalidate the candidates-by-stage queries to ensure cache update
      await queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'candidates-by-stage' })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setColumns(groupByStage(STAGES.flatMap(s => (queryClient.getQueryData(['candidates-by-stage', s, jobId, 1]) as any)?.data ?? [])))
      // above attempts to use cached page 1 per stage; if your hook keys differ, adjust accordingly
    } catch (err) {
      console.error('Error during reloadData:', err)
      try {
        window.location.reload()
      } catch {
        // last resort: navigate to same route to force remount
        navigate(location.pathname, { replace: true })
      }
    }
  }, [stageResponses, queryClient, jobId, navigate, location.pathname])

  // auto-reload when navigation happens (back/forward or programmatic)
  useEffect(() => {
    // run reloadData on location.key changes (unique per navigation entry)
    reloadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    if (!candidateParamId) return
    setTimeout(() => {
      const el = document.querySelector(`[data-candidate-id="${candidateParamId}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }, [candidateParamId, columns])

  const snapshot = () => JSON.parse(JSON.stringify(columns)) as Record<Stage, Candidate[]>

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    let destId = destination.droppableId
    if (destId.startsWith('sidebar-')) destId = destId.replace('sidebar-', '')
    const fromStage = source.droppableId as Stage
    const toStage = destId as Stage

    if (fromStage === toStage && source.index === destination.index) return

    const before = snapshot()

    setColumns(prev => {
      const next = { ...prev }
      const fromList = Array.from(next[fromStage] ?? [])
      const [moved] = fromList.splice(source.index, 1)
      const toList = Array.from(next[toStage] ?? [])
      toList.splice(destination.index, 0, { ...moved, stage: toStage })
      next[fromStage] = fromList
      next[toStage] = toList
      return next
    })

    updateCandidate.mutate(
      { candidateId: String(draggableId), updates: { stage: toStage } },
      {
        onError: async () => {
          setColumns(before)
          await queryClient.invalidateQueries({ queryKey: ['candidates'] })
          queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'candidates-by-stage' })
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['candidates'] })
          await queryClient.invalidateQueries({ queryKey: ['candidates', String(draggableId)] })
          await queryClient.invalidateQueries({ queryKey: ['candidates', String(draggableId), 'timeline'] })
          queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'candidates-by-stage' })
        }
      }
    )
  }

  const loadMore = (stage: Stage) => {
    setPages(prev => ({ ...prev, [stage]: (prev[stage] ?? 1) + 1 }))
  }

  const counts: Record<Stage, number> = STAGES.reduce((acc, s, i) => {
    const resp = stageResponses[i]?.data
    acc[s] = resp?.pagination?.total ?? (columns[s]?.length ?? 0)
    return acc
  }, {} as Record<Stage, number>)

  return (
    <div id="kanban-root" className="flex gap-6 p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <aside className="w-48">
          <h3 className="text-lg font-semibold mb-3">Stages</h3>
          <div className="space-y-2">
            {STAGES.map(stage => (
              <Droppable droppableId={`sidebar-${stage}`} key={`sidebar-${stage}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      'p-3 rounded border bg-white flex items-center justify-between',
                      snapshot.isDraggingOver ? 'ring-2 ring-indigo-300' : ''
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{STAGE_LABEL[stage]}</div>
                      <div className="text-xs text-gray-500">{counts[stage] ?? 0} candidates</div>
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Candidates</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/candidates/candidatelist')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Candidates
              </button>
              
            </div>
          </div>

          <div className="flex gap-4">
            {STAGES.map((stage, idx) => {
              const resp = stageResponses[idx]
              const hasNext = resp?.data?.pagination?.hasNext ?? false

              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'min-w-[320px] max-w-[360px] bg-gray-50 rounded p-3',
                        snapshot.isDraggingOver ? 'ring-2 ring-offset-2 ring-blue-300' : ''
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{STAGE_LABEL[stage]}</h3>
                        <span className="text-sm text-gray-500">{counts[stage] ?? (columns[stage]?.length ?? 0)}</span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {(columns[stage] ?? []).map((c, index) => (
                          <Draggable key={String(c.id)} draggableId={String(c.id)} index={index}>
                            {(draggableProvided, dragSnapshot) => {
                              const style = draggableProvided.draggableProps.style ?? {}
                              const isSelected = String(candidateParamId) === String(c.id)
                              return (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  style={style}
                                  data-candidate-id={c.id}
                                >
                                  <div className={isSelected ? 'ring-2 ring-indigo-300 rounded' : ''}>
                                    <CandidateCard candidate={c} isDragging={dragSnapshot.isDragging} />
                                  </div>
                                </div>
                              )
                            }}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        <div className="pt-2">
                          <button
                            onClick={() => loadMore(stage)}
                            className="text-sm text-blue-600 hover:underline"
                            disabled={!hasNext}
                          >
                            {hasNext ? 'Load more' : 'No more'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}