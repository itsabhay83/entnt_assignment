/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import type { Assessment, Question, Section } from '../../types/index'

type Props = { assessment: Assessment }

function SimpleQuestion({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  if (q.type === 'short-text' || q.type === 'long-text') {
    return (
      <input
        className="w-full border rounded p-2"
        placeholder={q.config?.placeholder ?? ''}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (q.type === 'single-choice') {
    return (
      <div className="space-y-1">
        {(q.config?.options ?? []).map((opt) => (
          <label key={opt.id} className="block text-sm">
            <input
              type="radio"
              name={q.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
              className="mr-2"
            />
            {opt.text}
          </label>
        ))}
      </div>
    )
  }

  if (q.type === 'multi-choice') {
    return (
      <div className="space-y-1">
        {(q.config?.options ?? []).map((opt) => {
          const checked = Array.isArray(value) && value.includes(opt.id)
          return (
            <label key={opt.id} className="block text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = Array.isArray(value) ? [...value] : []
                  if (checked) next.splice(next.indexOf(opt.id), 1)
                  else next.push(opt.id)
                  onChange(next)
                }}
                className="mr-2"
              />
              {opt.text}
            </label>
          )
        })}
      </div>
    )
  }

  if (q.type === 'numeric-range') {
    return (
      <input
        type="number"
        className="w-32 border rounded p-2"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      />
    )
  }

  if (q.type === 'file-upload') {
    return <input type="file" onChange={(e) => onChange(e.target.files ? Array.from(e.target.files) : undefined)} />
  }

  // fallback
  return null
}

export default function AssessmentPreview({ assessment }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({})

  const setAnswer = (qid: string, v: any) => setAnswers((s) => ({ ...s, [qid]: v }))

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold text-lg">{assessment.title}</h3>
      {assessment.description && <p className="text-sm text-gray-600 mb-3">{assessment.description}</p>}

      <div className="space-y-6">
        {(assessment.sections ?? []).map((section: Section) => (
          <div key={section.id}>
            <div className="mb-2 font-medium">{section.title}</div>
            <div className="space-y-3">
              {(section.questions ?? []).map((q: Question) => (
                <div key={q.id} className="text-sm">
                  <div className="font-medium">{q.title}{q.required ? ' *' : ''}</div>
                  <div className="mt-2">
                    <SimpleQuestion q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
