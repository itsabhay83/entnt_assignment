/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/AssessmentBuilder.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Save, Trash } from 'lucide-react'
import { useAssessment, useSaveAssessment } from '../hooks/api'
import AssessmentPreview from '../components/assessment/AssessmentPreview'
import type { Assessment, Section, Question, QuestionType } from '../types'
import { nanoid } from 'nanoid'

const LOCAL_KEY = (jobId: string) => `assessment-draft-${jobId}`

const DEFAULT_QUESTION = (type: QuestionType): Question => ({
  id: `q-${nanoid(6)}`,
  type,
  title: 'Untitled question',
  description: '',
  required: false,
  order: 0,
  config: {},
  points: 0
})

const QUESTION_TYPES: QuestionType[] = [
  'short-text', 'long-text', 'single-choice', 'multi-choice', 'numeric-range', 'file-upload'
]

export default function AssessmentBuilder() {
  const { jobId } = useParams<{ jobId: string }>()
  const { data: rawResp, isError } = useAssessment(jobId!)
  const saveMutation = useSaveAssessment()

  const normalizeExisting = (r: any) => {
    if (!r) return null
    if (r.data && r.data.id) return r.data
    if (r.data && r.data.data && r.data.data.id) return r.data.data
    if (r.id) return r
    return null
  }
  const existing = normalizeExisting(rawResp)

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    if (!jobId) return
    const local = localStorage.getItem(LOCAL_KEY(jobId))
    if (local) {
      try { setAssessment(JSON.parse(local)); return } catch(err) { console.log(err) }
    }
    if (isError) {
      setAssessment({
        id: `assessment-${Date.now()}`,
        jobId: jobId!,
        title: 'Untitled Assessment',
        description: '',
        sections: [],
        isActive: false,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return
    }
    if (existing) setAssessment(existing)
    else setAssessment({
      id: `assessment-${Date.now()}`,
      jobId: jobId!,
      title: 'Untitled Assessment',
      description: '',
      sections: [],
      isActive: false,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }, [existing, jobId, isError])

  useEffect(() => {
    if (!jobId || !assessment) return
    localStorage.setItem(LOCAL_KEY(jobId), JSON.stringify(assessment))
  }, [assessment, jobId])

  if (!jobId) return <div className="p-6">Missing jobId</div>
  if (!assessment) return <div className="p-6">Loading assessment...</div>

  const addSection = () => {
    const s: Section = {
      id: `section-${nanoid(6)}`,
      title: `New section`,
      description: '',
      order: assessment.sections.length + 1,
      questions: []
    }
    setAssessment(prev => prev ? { ...prev, sections: [...prev.sections, s] } : prev)
  }

  const removeSection = (sectionId: string) => {
    setAssessment(prev => prev ? { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) } : prev)
  }

  const updateSection = (sectionId: string, patch: Partial<Section>) => {
    setAssessment(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s)
    } : prev)
  }

  const addQuestion = (sectionId: string, type: QuestionType) => {
    const q = DEFAULT_QUESTION(type)
    setAssessment(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, q] } : s)
    } : prev)
  }

  const updateQuestion = (sectionId: string, questionId: string, patch: Partial<Question>) => {
    setAssessment(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        questions: s.questions.map(q => q.id === questionId ? { ...q, ...patch } : q)
      } : s)
    } : prev)
  }

  const removeQuestion = (sectionId: string, questionId: string) => {
    setAssessment(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s)
    } : prev)
  }

  // helper to add an option to a multiple choice question
  const addOption = (sectionId: string, questionId: string) => {
    const opt = { id: `opt-${nanoid(4)}`, text: 'Option', isCorrect: false }
    setAssessment(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        questions: s.questions.map(q => q.id === questionId ? { ...q, config: { ...q.config, options: [...(q.config.options ?? []), opt] } } : q)
      } : s)
    } : prev)
  }

  const saveToServer = async () => {
    setSaving(true)
    try {
      await saveMutation.mutateAsync({ jobId: jobId!, assessmentData: assessment })
      localStorage.removeItem(LOCAL_KEY(jobId))
    } catch (err) { console.log(err) } finally { setSaving(false) }
  }

  // render
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assessment Builder</h1>
          <p className="text-sm text-gray-600">Job: {jobId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/assessments/${jobId}/form`} className="text-sm text-blue-600 hover:underline">Open form</Link>
          <button onClick={saveToServer} disabled={isSaving} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded">
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded shadow p-4">
            <label className="block text-sm font-medium">Title</label>
            <input value={assessment.title} onChange={(e) => setAssessment({ ...assessment, title: e.target.value })} className="mt-1 w-full border rounded p-2" />
            <label className="block text-sm font-medium mt-3">Description</label>
            <textarea value={assessment.description} onChange={(e) => setAssessment({ ...assessment, description: e.target.value })} className="mt-1 w-full border rounded p-2" />
          </div>

          {assessment.sections.map(section => (
            <div key={section.id} className="bg-white rounded shadow p-4">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <input className="w-full font-semibold" value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
                  <input placeholder="optional description" className="w-full text-sm text-gray-500 mt-1" value={section.description ?? ''} onChange={(e) => updateSection(section.id, { description: e.target.value })} />
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <button className="p-1 text-red-600" onClick={() => removeSection(section.id)} title="Remove section"><Trash size={16} /></button>
                  <div className="flex gap-1">
                    {QUESTION_TYPES.map(t => (
                      <button key={t} onClick={() => addQuestion(section.id, t)} className="text-xs px-2 py-1 border rounded">{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {section.questions.map(q => (
                  <div key={q.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <input value={q.title} onChange={(e) => updateQuestion(section.id, q.id, { title: e.target.value })} className="w-full font-medium text-sm" />
                        <div className="text-xs text-gray-500 mt-1">{q.type}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <select value={q.type} onChange={(e) => updateQuestion(section.id, q.id, { type: e.target.value as QuestionType })} className="text-sm border rounded p-1">
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button className="text-sm text-red-600" onClick={() => removeQuestion(section.id, q.id)}>Remove</button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(section.id, q.id, { required: e.target.checked })} />
                        Required
                      </label>

                      {(q.type === 'short-text' || q.type === 'long-text') && (
                        <>
                          <label className="block">Placeholder</label>
                          <input value={q.config.placeholder ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, placeholder: e.target.value } })} className="w-full text-sm border rounded p-1" />
                          <label className="block mt-1">Max length</label>
                          <input type="number" value={q.config.maxLength ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, maxLength: e.target.value ? Number(e.target.value) : undefined } })} className="w-28 text-sm border rounded p-1" />
                        </>
                      )}

                      {q.type === 'numeric-range' && (
                        <div className="flex gap-2 items-center">
                          <label className="text-xs">Min</label>
                          <input type="number" value={q.config.min ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, min: e.target.value ? Number(e.target.value) : undefined } })} className="w-24 text-sm border rounded p-1" />
                          <label className="text-xs">Max</label>
                          <input type="number" value={q.config.max ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, max: e.target.value ? Number(e.target.value) : undefined } })} className="w-24 text-sm border rounded p-1" />
                        </div>
                      )}

                      {(q.type === 'single-choice' || q.type === 'multi-choice') && (
                        <>
                          <label className="block">Options</label>
                          {(q.config.options ?? []).map((opt, idx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input className="flex-1 text-sm" value={opt.text} onChange={(e) => {
                                const newOpts = (q.config.options ?? []).slice()
                                newOpts[idx] = { ...newOpts[idx], text: e.target.value }
                                updateQuestion(section.id, q.id, { config: { ...q.config, options: newOpts } })
                              }} />
                              <button className="text-red-600" onClick={() => {
                                const newOpts = (q.config.options ?? []).filter((_, i) => i !== idx)
                                updateQuestion(section.id, q.id, { config: { ...q.config, options: newOpts } })
                              }}>x</button>
                            </div>
                          ))}
                          <button className="mt-2 text-sm text-blue-600" onClick={() => addOption(section.id, q.id)}>Add option</button>
                        </>
                      )}

                      {/* conditional display: showIf */}
                      <div className="mt-2 border-t pt-2">
                        <div className="text-xs text-gray-500">Conditional visibility (optional)</div>
                        <div className="flex gap-2 items-center mt-1">
                          <select value={q.config.showIf?.questionId ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, showIf: { ...(q.config.showIf ?? {}), questionId: e.target.value || undefined } } })} className="text-xs border rounded p-1">
                            <option value=''>-- depends on question --</option>
                            {/* list all questions in the assessment to choose from */}
                            {assessment.sections.flatMap(s => s.questions).map(other => (
                              <option key={other.id} value={other.id}>{other.title || other.id}</option>
                            ))}
                          </select>

                          <input placeholder="equals value" value={q.config.showIf?.equals?.toString() ?? ''} onChange={(e) => updateQuestion(section.id, q.id, { config: { ...q.config, showIf: { ...(q.config.showIf ?? {}), equals: e.target.value || undefined } } })} className="text-xs border rounded p-1" />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">e.g. show this question only when "Q1" equals "Yes"</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <button className="inline-flex items-center gap-2 px-3 py-2 border rounded" onClick={addSection}><Plus size={14} /> Add section</button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <AssessmentPreview assessment={assessment} />
        </div>
      </div>
    </div>
  )
}
