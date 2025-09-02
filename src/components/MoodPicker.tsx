import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Mood = { key: string; label: string; emoji: string; cls: string }

export function moodChipClass(name: string): string {
  const key = name?.toLowerCase().trim();
  switch (key) {
    case 'joy':
    case 'happy':
      return 'db__chip-joy';
    case 'calm':
    case 'relaxed':
      return 'db__chip-calm';
    case 'focus':
    case 'focused':
      return 'db__chip-focus';
    case 'sad':
    case 'blue':
      return 'db__chip-sad';
    case 'angry':
    case 'mad':
      return 'db__chip-angry';
    case 'nostalgic':
    case 'thoughtful':
    case 'neutral':
    default:
      return 'db__chip-low';
  }
}



const ALL: Mood[] = [
  { key: 'joy',   label: 'Joy',   emoji: '😊', cls: 'db__chip-joy' },
  { key: 'calm',  label: 'Calm',  emoji: '😌', cls: 'db__chip-calm' },
  { key: 'focus', label: 'Focus', emoji: '🧐', cls: 'db__chip-focus' },
  { key: 'low',   label: 'Low',   emoji: '😐', cls: 'db__chip-low' },
  { key: 'sad',   label: 'Sad',   emoji: '😔', cls: 'db__chip-sad' },
  { key: 'angry', label: 'Angry', emoji: '😠', cls: 'db__chip-angry' },
  { key: 'grateful',   label: 'Grateful',   emoji: '🙏', cls: 'db__chip-joy' },
  { key: 'excited',    label: 'Excited',    emoji: '🤩', cls: 'db__chip-focus' },
  { key: 'inspired',   label: 'Inspired',   emoji: '✨', cls: 'db__chip-low' },
  { key: 'motivated',  label: 'Motivated',  emoji: '🚀', cls: 'db__chip-focus' },
  { key: 'hopeful',    label: 'Hopeful',    emoji: '🌤️', cls: 'db__chip-calm' },
  { key: 'proud',      label: 'Proud',      emoji: '🏅', cls: 'db__chip-joy' },
  { key: 'thoughtful', label: 'Thoughtful', emoji: '🤔', cls: 'db__chip-low' },
  { key: 'nostalgic',  label: 'Nostalgic',  emoji: '🥹', cls: 'db__chip-low' },
  { key: 'content',    label: 'Content',    emoji: '🙂', cls: 'db__chip-joy' },
  { key: 'tired',      label: 'Tired',      emoji: '😴', cls: 'db__chip-sad' },
  { key: 'bored',      label: 'Bored',      emoji: '🥱', cls: 'db__chip-sad' },
  { key: 'stressed',   label: 'Stressed',   emoji: '😵‍💫', cls: 'db__chip-angry' },
  { key: 'anxious',    label: 'Anxious',    emoji: '😬', cls: 'db__chip-sad' },
  { key: 'frustrated', label: 'Frustrated', emoji: '😤', cls: 'db__chip-angry' },
  { key: 'sick',       label: 'Sick',       emoji: '🤒', cls: 'db__chip-sad' },
]

const HINTS: Mood[] = [
  { key: 'joy',   label: 'Joy',   emoji: '😊', cls: 'db__chip-joy' },
  { key: 'calm',  label: 'Calm',  emoji: '😌', cls: 'db__chip-calm' },
  { key: 'focus', label: 'Focus', emoji: '🧐', cls: 'db__chip-focus' },
  { key: 'sad',   label: 'Sad',   emoji: '😔', cls: 'db__chip-sad' },
]

export type MoodComboProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  multi?: boolean           // default: true
}

export default function MoodCombo({ value, onChange, placeholder = 'How are you feeling?...', multi = true }: MoodComboProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => ALL.filter(o => value.includes(o.key)), [value])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL
    return ALL.filter(o => o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [])

  function toggle(key: string) {
    if (multi) {
      onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])
    } else {
      onChange(value[0] === key ? [] : [key]); setOpen(false)
    }
    setQuery('')
    inputRef.current?.focus()
  }
  function remove(key: string) { onChange(value.filter(k => k !== key)) }

  return (
    <div ref={wrapRef} className="mood-wrap">
      {/* input container with selected chips */}
      <div className="chip-input" onClick={() => { setOpen(true); inputRef.current?.focus() }}>
        {selected.map(m => (
          <button
            key={m.key}
            type="button"
            className={`${m.cls} chip-selectable chip-selected`}
            onClick={(e) => { e.stopPropagation(); remove(m.key) }}
            aria-pressed="true"
            title={`Remove ${m.label}`}
          >
            <span aria-hidden="true">{m.emoji}</span>&nbsp;{m.label} ×
          </button>
        ))}

        {/* ghost “Try:” chips when empty */}
        {selected.length === 0 && query.length === 0 && (
          <>
            
            {HINTS.map(h => (
              <button
                key={h.key}
                type="button"
                className={`${h.cls} chip-ghost chip-selectable`}
                onClick={(e) => { e.stopPropagation(); toggle(h.key) }}
                title={h.label}
              >
                <span aria-hidden="true">{h.emoji}</span>&nbsp;{h.label}
              </button>
            ))}
          </>
        )}

        <input
          ref={inputRef}
          value={query}
          className='chip-field'
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length ? '' : placeholder}
          aria-expanded={open}
          aria-autocomplete="list"
        />

        <button type="button" className="chip-trigger editor-btn" aria-label="Toggle suggestions"
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); inputRef.current?.focus() }}>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* one, unified dropdown */}
      {open && (
        <div className="combo-pop" role="listbox" aria-label="Moods">
          <div className="chip-row">
            {filtered.map(o => {
              const active = value.includes(o.key)
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => toggle(o.key)}
                  className={`${o.cls} chip-selectable ${active ? 'chip-selected' : ''}`}
                  role="option"
                  aria-selected={active}
                  title={o.label}
                >
                  <span aria-hidden="true">{o.emoji}</span>&nbsp;{o.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
