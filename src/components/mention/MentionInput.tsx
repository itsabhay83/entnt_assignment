import React, { useEffect, useRef, useState } from 'react'

type MentionSuggestion = {
  id: string
  name: string
}

type Props = {
  placeholder?: string
  suggestions: MentionSuggestion[] // list used for @ suggestions (names)
  onSave: (text: string) => Promise<void> | void
  initialText?: string
}
export default function MentionInput({ placeholder, suggestions, onSave, initialText = '' }: Props) {
  const [text, setText] = useState(initialText)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('') // current mention query
  const [filtered, setFiltered] = useState<MentionSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const mentionStartRef = useRef<number | null>(null)

  useEffect(() => {
    // recompute filtered when query changes
    if (!query) {
      setFiltered(suggestions.slice(0, 6))
      return
    }
    const q = query.toLowerCase()
    setFiltered(
      suggestions
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 6)
    )
    setActiveIndex(0)
  }, [query, suggestions])

  // handle key navigation inside textarea for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault()
      if (e.key === 'ArrowDown') {
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        // insert selected mention
        if (filtered.length > 0) {
          insertMention(filtered[activeIndex])
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
      return
    }

    // Allow saving with Ctrl/Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  // find if there's a mention open at cursor
  const handleChange = (val: string) => {
    setText(val)

    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    // find the nearest "@" before the cursor but after whitespace or newline
    const substring = val.slice(0, pos)
    const atIndex = Math.max(
      substring.lastIndexOf('@'),
      substring.lastIndexOf('\n') // avoid fallback
    )

    // If there's an '@' and it is the start of mention (either start of text or previous char is whitespace),
    // set query to substring after '@' up to cursor
    if (atIndex >= 0) {
      // ensure char before '@' is whitespace or start
      const charBefore = substring[atIndex - 1]
      if (!charBefore || /\s/.test(charBefore) || charBefore === '\n') {
        const q = substring.slice(atIndex + 1)
        mentionStartRef.current = atIndex
        setQuery(q)
        setOpen(true)
        return
      }
    }

    // otherwise close suggestions
    mentionStartRef.current = null
    setOpen(false)
    setQuery('')
  }

  const insertMention = (s: MentionSuggestion) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = mentionStartRef.current ?? 0
    const cursor = ta.selectionStart
    // build new text: before @ + @name + space + after
    const before = text.slice(0, start)
    const after = text.slice(cursor)
    const mentionText = `@${s.name}`

    const newText = `${before}${mentionText} ${after}`
    setText(newText)
    setOpen(false)
    setQuery('')
    mentionStartRef.current = null

    // put caret after inserted mention
    const newPos = (before + mentionText + ' ').length
    // schedule cursor move
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = newPos
    })
  }

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    await onSave(trimmed)
    setText('')
    setOpen(false)
    setQuery('')
    mentionStartRef.current = null
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Write a note and mention colleagues using @... (Ctrl/Cmd+Enter to save)'}
        className="w-full border border-gray-200 rounded p-3 min-h-[84px] resize-y focus:ring-2 focus:ring-blue-500"
      />

      {/* suggestions dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 left-2 right-2 bg-white border rounded shadow max-h-44 overflow-auto">
          {filtered.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === activeIndex ? 'bg-blue-50' : ''}`}
              onMouseDown={(e) => {
                // use mouseDown to prevent textarea blur before insertion
                e.preventDefault()
                insertMention(s)
              }}
            >
              <div className="text-sm font-medium">{s.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">Tip: type @ to mention from suggestions</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setText('') }}
            className="text-sm px-3 py-1 border rounded"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={submit}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  )
}
