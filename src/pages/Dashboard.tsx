import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { authed } from '../lib/http'
import { tokenStore } from '../lib/tokenStore'
import MoodPicker from '../components/MoodPicker'
import SimpleRTE from '../components/SimpleRTE'

type Journal = {
  id?: Object | string | null
  title?: string
  content?: string
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  mood?: string[]
}

const EDITOR_BUF_KEY = 'editorBuffer' // { id, title, content, moods }

// normalize various Mongo id shapes to a plain string
function toId(id: Object | string | null): string | null {
  if (!id) return null
  if (typeof id === 'string') return id
  const maybe = (id as any)?.$oid || (id as any)?.oid || (id as any)?.hexString
  return typeof maybe === 'string' ? maybe : null
}

export default function DashboardPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<string>('')         // TipTap HTML
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('Unsaved first draft')

  const titleRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // 1) Rehydrate editor state, then fetch list
  useEffect(() => {
    try {
      const buf = localStorage.getItem(EDITOR_BUF_KEY)
      if (buf) {
        const snap = JSON.parse(buf) as {
          id: string | null; title: string; content: string; moods: string[]
        }
        setSelectedId(snap?.id ?? null)
        setTitle(snap?.title ?? '')
        setContent(snap?.content ?? '')
        setSelectedMoods(Array.isArray(snap?.moods) ? snap.moods : [])
        setStatus(snap?.id ? 'Saved at ${snap?.updated ?? snap?.created}' : 'Unsaved first draft')
      }
    } catch { /* ignore */ };
    (async () => {
      setLoading(true); setError(null)
      try {
        const data = await authed<Journal[]>('/api/v1/journals', { method: 'GET' })
        setJournals(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally { setLoading(false) }
    })()
  }, [])

  // 2) Persist live buffer so refresh keeps current editor state
  useEffect(() => {
    localStorage.setItem(EDITOR_BUF_KEY, JSON.stringify({
      id: selectedId, title, content, moods: selectedMoods
    }))
  }, [selectedId, title, content, selectedMoods])

  async function onLogout() {
    try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }) } catch { }
    localStorage.removeItem(EDITOR_BUF_KEY)
    tokenStore.clear()
    navigate('/')
  }

  function focusTitle() { titleRef.current?.focus() }

  function handleNew() {
    // fresh draft
    setSelectedId(null);
    setTitle('');
    setContent('');
    setSelectedMoods([]);
    setStatus('Unsaved first draft');

    // write '' to localStorage for new entry
    localStorage.setItem(EDITOR_BUF_KEY, JSON.stringify({
      id: null, title: '', content: '', moods: [] as string[],
    }));

    requestAnimationFrame(() => titleRef.current?.focus());
  }

  async function handleDelete() {
    if (!selectedId) return; // nothing to delete

    const ok = window.confirm('Delete this entry permanently?');
    if (!ok) return;

    setSaving(true);
    try {
      // DELETE current entry
      try {
        await authed<void>(`/api/v1/journals/${selectedId}`, { method: 'DELETE' });
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (!(err?.status === 204 || msg.includes('No Content'))) throw err;
      }

      // remove from list
      const remaining = journals.filter(j => j.id?.toString() !== selectedId);
      setJournals(remaining);

      if (remaining.length) {
        // load the first remaining entry
        const next = remaining[0];
        const nid = next.id?.toString() ?? null;
        setSelectedId(nid);
        setTitle(next.title ?? '');
        setContent(next.content ?? '');
        setSelectedMoods(Array.isArray(next.mood) ? next.mood : []);
        setStatus(nid ? ('Saved at ' + (next.updatedAt ?? next.createdAt)) : 'Unsaved first draft');

        // sync buffer with what’s now on screen
        localStorage.setItem(EDITOR_BUF_KEY, JSON.stringify({
          id: nid, title: next.title ?? '', content: next.content ?? '', moods: Array.isArray(next.mood) ? next.mood : [],
        }));
      } else {
        // nothing left → new blank draft
        handleNew();
      }
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
      setStatus('Delete failed');
    } finally {
      setSaving(false);
    }
  }

  function loadEntry(j: Journal) {
    const idStr = j.id?.toString();
    setSelectedId(idStr ?? null)
    setTitle(j.title ?? '')
    setContent(j.content ?? '')
    setSelectedMoods(Array.isArray(j.mood) ? j.mood : [])
    setStatus(idStr ? 'Saved at ' + (j.updatedAt ?? j.createdAt) : 'Unsaved first draft')
  }

  async function handleSave() {
    if (!title.trim()) { titleRef.current?.focus(); return }
    setSaving(true)
    setStatus('Saving…')

    // createdAt and updatedAt will be added in backend controller
    const payload = {
      title: title.trim(),
      content,
      tags: [] as string[],
      mood: selectedMoods,
    }

    try {
      // If the journal has an id, then instead of saviung a new one, update the existing one
      if (selectedId) {
        try {
          const ans = await authed<Journal>(
            `/api/v1/journals/${selectedId}`,
            { method: 'PUT', body: payload }
          )
          setStatus('Saved at ' + (ans.updatedAt ?? ans.createdAt) || 'Saved')
          console.log('Updated', ans);
        } catch (err: any) {
          const msg = String(err?.message || '')
          if (!(err?.status === 204 || msg.includes('No Content'))) throw err
        }
        // update the item locally
        setJournals(prev =>
          prev.map(j => (toId(j.id ? j.id.toString() : null) === selectedId ? { ...j, ...payload, id: selectedId } : j))
        )
      } else {
        // If id is not present, then it is a new journal so save it first
        const created = await authed<Journal>('/api/v1/journals', { method: 'POST', body: payload })
        console.log(created.id?.toString());
        console.log(created.id?.valueOf().toString());
        console.log('Created', created);
        const newId = created?.id
        if (!newId) throw new Error('Server did not return new journal id')
        setSelectedId(newId.toString());
        setJournals(prev => [{ ...created, id: newId }, ...prev])
        setStatus('Saved at ' + (created.updatedAt ?? created.createdAt) || 'Saved')
      }
    } catch (e: any) {
      setError(e?.message || 'Save failed')
      setStatus('Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    // keeping title intact but clearing editor + moods; reset to draft
    setSelectedId(null)
    setContent('')
    setSelectedMoods([])
    setStatus('Unsaved first draft')

    localStorage.setItem(EDITOR_BUF_KEY, JSON.stringify({
      id: null, title, content: '', moods: [] as string[]
    }))
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="db__card">
      {/* NAV */}
      <nav className="db__nav">
        <h3 className="login__title" style={{ margin: 0 }}>Menu</h3>
        <button className="db__btnPrimary" onClick={focusTitle}>Today</button>
        <button className="db__btn">Past</button>
        <button className="db__btn">Search</button>
        <button className="db__btn">Settings</button>
        <div className="db__muted">All entries</div>
      </nav>

      {/* EDITOR */}
      <section className="db__editor">
        <div className="db__row">
          <h1 className="db__h1">Journal</h1>
          <div className="db__muted">{today}</div>
        </div>

        <MoodPicker value={selectedMoods} onChange={setSelectedMoods} />

        <div className="db__editorCard">
          <div className='db__row'>
          <input
            ref={titleRef}
            className="db__titleInput"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="db__btn" onClick={handleNew} title="Start a new entry">Add+</button>
          </div>

          <SimpleRTE value={content} onChange={setContent} />

          <div className="db__row">
            <span className="db__muted">{status}</span>
            <div className="flex gap-3">
              <button className="db__btn" onClick={handleDelete} disabled={!selectedId}>Delete</button>
              <button className="db__btn" onClick={handleDiscard}>Discard</button>
              <button className="db__btnPrimary" onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SIDEBAR */}
      <aside className="db__side">
        <div className="db__listHead">
          <h3 className="login__title" style={{ margin: 0 }}>Recent Entries</h3>
        </div>
        {loading && <p className="db__muted">Loading…</p>}
        {error && <p className="db__muted" role="alert">{error}</p>}

        {!loading && !error && (
          <div className="db__list">
            {journals.length === 0 && (
              <div className="db__entry"><span className="db__muted">No entries yet</span></div>
            )}
            {journals.map((j, i) => {
              const jid = j.id?.toString();
              return (
                <div
                  key={jid || `fallback-${i}`} // to avaoid dupe keys if id is missing
                  className="db__entry"
                  style={{ cursor: 'pointer', outline: selectedId && jid === selectedId ? '2px solid var(--color-brand-200)' : 'none' }}
                  onClick={() => loadEntry(j)}
                  title="Click to load into editor"
                >
                  <strong>{j.title ?? `Entry ${i + 1}`}</strong>
                  <div className="db__moods">
                    {(j.mood ?? []).map((m, k) => (
                      <span key={`${jid ?? 'new'}-${k}`} className="db__chip-low">{m}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button className="db__btn" onClick={onLogout}>Log out</button>
      </aside>
    </div>
  )
}
