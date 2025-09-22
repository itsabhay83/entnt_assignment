/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/AssessmentForm.tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { useAssessment, useSubmitAssessment } from '../hooks/api'
import type { Assessment, Question } from '../types'
import { nanoid } from 'nanoid'

const RESP_KEY = (assessmentId: string, candidateId: string) => `assessment-resp-${assessmentId}-${candidateId}`

export default function AssessmentFormPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [search] = useSearchParams()
  const candidateId = search.get('candidateId') || `candidate-${nanoid(4)}`

  const { data: raw } = useAssessment(jobId!)
  const normalize = (r:any) => {
    if (!r) return null
    if (r.data && r.data.id) return r.data
    if (r.data && r.data.data && r.data.data.id) return r.data.data
    if (r.id) return r
    return null
  }
  const assessment: Assessment | null = normalize(raw)

  const submitMutation = useSubmitAssessment()

  // restore saved candidate responses (local)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  useEffect(() => {
    if (!assessment) return
    const key = RESP_KEY(assessment.id, candidateId)
    const txt = localStorage.getItem(key)
    if (txt) {
      try { setAnswers(JSON.parse(txt)) } catch(err) {console.log(err)}
    }
  }, [assessment, candidateId])

  useEffect(() => {
    if (!assessment) return
    localStorage.setItem(RESP_KEY(assessment.id, candidateId), JSON.stringify(answers))
  }, [answers, assessment, candidateId])

  const setAnswer = (qid: string, value: any) => setAnswers(prev => ({ ...prev, [qid]: value }))

  // conditional visibility helper
  const isQuestionVisible = (q: Question): boolean => {
    const cond = (q.config as any)?.showIf
    if (!cond || !cond.questionId) return true
    const cur = answers[cond.questionId]
    // primitive equals (string/number). Convert both to string to compare loosely.
    return String(cur) === String(cond.equals)
  }

  const validate = (): { ok: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    if (!assessment) return { ok: true, errors }
    for (const section of assessment.sections) {
      for (const q of section.questions) {
        if (!isQuestionVisible(q)) continue
        const a = answers[q.id]
        if (q.required) {
          if (q.type === 'file-upload') {
            if (!a || (Array.isArray(a) && a.length === 0)) errors[q.id] = 'Required'
          } else {
            if (a === undefined || a === null || a === '') errors[q.id] = 'Required'
          }
        }
        if (q.type === 'short-text' || q.type === 'long-text') {
          const max = q.config?.maxLength
          if (max && typeof a === 'string' && a.length > max) errors[q.id] = `Maximum length is ${max}`
        }
        if (q.type === 'numeric-range') {
          const min = q.config?.min
          const max = q.config?.max
          const num = a !== undefined && a !== '' ? Number(a) : NaN
          if (!isNaN(num)) {
            if (min !== undefined && num < min) errors[q.id] = `Minimum is ${min}`
            if (max !== undefined && num > max) errors[q.id] = `Maximum is ${max}`
          } else {
            if (q.required) errors[q.id] = 'Enter a number'
          }
        }
      }
    }
    return { ok: Object.keys(errors).length === 0, errors }
  }

  const handleSubmit = async () => {
    if (!assessment) return
    const v = validate()
    if (!v.ok) {
      alert('Validation errors:\n' + Object.values(v.errors).join('\n'))
      return
    }
    // build responses array (simple mapping — adapt to your Response type)
    const responses = Object.keys(answers).map(qid => ({
      id: `resp-${Date.now()}-${Math.random()}`,
      assessmentId: assessment.id,
      candidateId,
      questionId: qid,
      sectionId: assessment.sections.find(s => s.questions.some(q => q.id === qid))?.id ?? '',
      answer: (() => {
        const q = assessment.sections.flatMap(s => s.questions).find(x => x.id === qid)
        if (!q) return {}
        if (q.type === 'file-upload') {
          // we don't actually upload files in this stub; we store file names
          const files = (answers[qid] ?? []).map((f:File) => ({ filename: f.name, url: '', size: f.size }))
          return { files }
        }
        if (q.type === 'multi-choice') return { selectedOptionIds: answers[qid] ?? [] }
        if (q.type === 'single-choice') return { selectedOptionId: answers[qid] ?? undefined }
        if (q.type === 'numeric-range') return { rating: Number(answers[qid]) }
        return { text: answers[qid] }
      })()
    }))

    try {
      await submitMutation.mutateAsync({ jobId: jobId!, candidateId, responses : responses as unknown as Partial<Response>[] })
      // clear saved responses after submit
      localStorage.removeItem(RESP_KEY(assessment.id, candidateId))
      alert('Submitted!')
    } catch (err) {
      console.error(err)
      alert('Submission failed')
    }
  }

  if (!assessment) return <div className="p-6">Loading assessment...</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-3">{assessment.title}</h1>
      {assessment.description && <p className="text-gray-600 mb-4">{assessment.description}</p>}

      <div className="space-y-6">
        {assessment.sections.map(section => (
          <div key={section.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold mb-3">{section.title}</div>
            <div className="space-y-4">
              {section.questions.map(q => {
                if (!isQuestionVisible(q)) return null
                return (
                  <div key={q.id}>
                    <label className="block font-medium">{q.title}{q.required ? ' *' : ''}</label>
                    <QuestionInput q={q} value={answers[q.id]} onChange={(v:any) => setAnswer(q.id, v)} />
                    <div className="text-xs text-gray-400 mt-1">{q.description}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
      </div>
    </div>
  )
}

function QuestionInput({ q, value, onChange }: { q: Question, value: any, onChange: (v:any)=>void }) {
  if (q.type === 'short-text' || q.type === 'long-text') {
    return <input className="w-full border rounded p-2" value={value ?? ''} placeholder={q.config?.placeholder ?? ''} onChange={(e) => onChange(e.target.value)} />
  }
  if (q.type === 'single-choice') {
    return <div className="space-y-1">{(q.config?.options ?? []).map((opt:any) => (
      <label key={opt.id} className="block text-sm"><input type="radio" name={q.id} checked={value === opt.id} onChange={() => onChange(opt.id)} className="mr-2" />{opt.text}</label>
    ))}</div>
  }
  if (q.type === 'multi-choice') {
    return <div className="space-y-1">{(q.config?.options ?? []).map((opt:any) => {
      const checked = Array.isArray(value) && value.includes(opt.id)
      return <label key={opt.id} className="block text-sm"><input type="checkbox" checked={checked} onChange={() => {
        const next = Array.isArray(value) ? [...value] : []
        if (checked) next.splice(next.indexOf(opt.id), 1)
        else next.push(opt.id)
        onChange(next)
      }} className="mr-2"/>{opt.text}</label>
    })}</div>
  }
  if (q.type === 'numeric-range') {
    return <input type="number" className="w-28 border rounded p-2" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')} />
  }
  if (q.type === 'file-upload') {
    return <input type="file" multiple onChange={(e) => onChange(e.target.files ? Array.from(e.target.files) : undefined)} />
  }
  return null
}
