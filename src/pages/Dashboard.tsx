// src/pages/DashboardPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authed } from '../lib/http';
import { tokenStore } from '../lib/tokenStore';
import { dateKey, type Journal } from '../lib/Journal';

import MoodPicker from '../components/MoodPicker';
import SimpleRTE from '../components/SimpleRTE';
import DaySidebar from '../components/DaySidebar';
import FullDayList from '../components/FullDayList';

const EDITOR_BUF_KEY = 'editorBuffer';

export default function DashboardPage() {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) {
      const d = new Date(urlDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const mode: 'editor' | 'day-list' =
    searchParams.get('view') === 'list' ? 'day-list' : 'editor';

  // ── Editor state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string>(''); // TipTap HTML
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('Unsaved first draft');
  const [dataVersion, setDataVersion] = useState(0);

  // ── URL helpers
  function setDateInUrl(d: Date) {
    const params = new URLSearchParams(searchParams);
    params.set('date', dateKey(d));
    setSearchParams(params, { replace: false });
  }
  function setViewInUrl(view?: 'list' | 'editor') {
    const params = new URLSearchParams(searchParams);
    if (view === 'list') params.set('view', 'list');
    else params.delete('view');
    setSearchParams(params, { replace: false });
  }

  // ── Rehydrate editor buffer
  useEffect(() => {
    try {
      const buf = localStorage.getItem(EDITOR_BUF_KEY);
      if (buf) {
        const snap = JSON.parse(buf) as {
          id: string | null;
          title: string;
          content: string;
          moods: string[];
        };
        setSelectedId(snap?.id ?? null);
        setTitle(snap?.title ?? '');
        setContent(snap?.content ?? '');
        setSelectedMoods(Array.isArray(snap?.moods) ? snap.moods : []);
        setStatus(snap?.id ? 'Draft loaded' : 'Unsaved first draft');
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Persist editor buffer
  useEffect(() => {
    localStorage.setItem(
      EDITOR_BUF_KEY,
      JSON.stringify({ id: selectedId, title, content, moods: selectedMoods })
    );
  }, [selectedId, title, content, selectedMoods]);

  // ── Handlers
  function focusTitle() {
    titleRef.current?.focus();
  }

  function handleNew() {
    setSelectedId(null);
    setTitle('');
    setContent('');
    setSelectedMoods([]);
    setStatus('Unsaved first draft');
    localStorage.setItem(
      EDITOR_BUF_KEY,
      JSON.stringify({ id: null, title: '', content: '', moods: [] as string[] })
    );
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!window.confirm('Delete this entry permanently?')) return;
    setSaving(true);
    try {
      await authed<void>(`/api/v1/journals/${selectedId}`, { method: 'DELETE' });
      // Clear editor after delete
      setSelectedId(null);
      setTitle('');
      setContent('');
      setSelectedMoods([]);
      setStatus('Unsaved first draft');
      setDataVersion(v => v + 1); 
    } catch (e: any) {
      setStatus('Delete failed');
    } finally {
      setSaving(false);
    }
  }

  function loadEntry(j: Journal) {
    setSelectedId(j.id ?? null);
    setTitle(j.title ?? '');
    setContent(j.content ?? '');
    setSelectedMoods(Array.isArray(j.mood) ? j.mood : []);
    setStatus(j.id ? 'Saved at ' + (j.updatedAt ?? j.createdAt) : 'Unsaved first draft');
  }

  async function handleSave() {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setStatus('Saving…');
    const payload = {
      title: title.trim(),
      content,
      tags: [] as string[],
      mood: selectedMoods,
    };
    try {
      if (selectedId) {
        // update
        const updated = await authed<Journal>(`/api/v1/journals/${selectedId}`, {
          method: 'PUT',
          body: payload,
        });
        setStatus('Saved at ' + (updated.updatedAt ?? updated.createdAt) || 'Saved');
        setDataVersion(v => v + 1); 
      } else {
        // create
        const created = await authed<Journal>('/api/v1/journals', {
          method: 'POST',
          body: payload,
        });
        if (!created?.id) throw new Error('Server did not return new journal id');
        setSelectedId(created.id);
        setStatus('Saved at ' + (created.updatedAt ?? created.createdAt) || 'Saved');
        setDataVersion(v => v + 1); 
      }
    } catch (e: any) {
      setStatus('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setSelectedId(null);
    setContent('');
    setSelectedMoods([]);
    setStatus('Unsaved first draft');
    localStorage.setItem(
      EDITOR_BUF_KEY,
      JSON.stringify({ id: null, title, content: '', moods: [] as string[] })
    );
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  async function onLogout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { }
    localStorage.removeItem(EDITOR_BUF_KEY);
    tokenStore.clear();
    navigate('/');
  }

  // ── Sidebar/list glue handlers (tiny)
  function onCalendarChange(d: Date) {
    setSelectedDate(d);
    setDateInUrl(d);
  }
  function onPreviewMore() {
    setViewInUrl('list');
  }
  function onBackToEditor() {
    setViewInUrl('editor');
  }
  function onSelectEntryFromList(j: Journal) {
    loadEntry(j);
    setViewInUrl('editor');
  }

  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="db__card">
      {/* NAV */}
      <nav className="db__nav">
        <h3 className="login__title" style={{ margin: 0 }}>
          Menu
        </h3>
        <button
          className="db__btnPrimary"
          onClick={() => {
            const d = new Date();
            setSelectedDate(d);
            setDateInUrl(d);
            focusTitle();
          }}
        >
          Today
        </button>
        <button className="db__btn" onClick={() => setViewInUrl('list')}>
          Show Day List
        </button>
        <button className="db__btn" onClick={onLogout}>
          Log out
        </button>
        <div className="db__muted">All entries</div>
      </nav>

      {/* CENTER: Editor or Full Day List */}
      <section className="db__editor">
        {mode === 'editor' ? (
          <>
            <div className="db__row">
              <h1 className="db__h1">Journal</h1>
              <div className="db__muted">{todayLabel}</div>
            </div>

            <MoodPicker value={selectedMoods} onChange={setSelectedMoods} />

            <div className="db__editorCard">
              <div className="db__row">
                <input
                  ref={titleRef}
                  className="db__titleInput"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button className="db__btn" onClick={handleNew} title="Start a new entry">
                  Add+
                </button>
              </div>

              <SimpleRTE value={content} onChange={setContent} />

              <div className="db__row">
                <span className="db__muted">{status}</span>
                <div className="flex gap-3">
                  <button className="db__btn" onClick={handleDelete} disabled={!selectedId}>
                    Delete
                  </button>
                  <button className="db__btn" onClick={handleDiscard}>
                    Discard
                  </button>
                  <button
                    className="db__btnPrimary"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <FullDayList
            date={selectedDate}
            selectedId={selectedId}
            onSelectEntry={onSelectEntryFromList}
            onBack={onBackToEditor}
            version={dataVersion}
            className="grid gap-[var(--space-lg)]"
          />
        )}
      </section>

      {/* SIDEBAR: Calendar + preview list */}
      <aside className="db__side">
        <h3 className="login__title">Daily Entries</h3>
        <DaySidebar
          selectedDate={selectedDate}
          selectedId={selectedId}
          onChangeDate={onCalendarChange}
          onSelectEntry={onSelectEntryFromList}
          onShowMore={onPreviewMore}
          version={dataVersion}
          className="side-stack"
        />
      </aside>
    </div>
  );
}
