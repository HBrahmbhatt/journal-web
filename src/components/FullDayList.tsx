import { useEffect, useRef, useState } from 'react';
import { getDayEntries, dateKey, type Journal } from '../lib/Journal';
import { moodChipClass } from './MoodPicker';

type Props = {
    date: Date;
    selectedId?: string | null;
    onSelectEntry: (j: Journal) => void; // opens editor + returns to editor view
    onBack: () => void;                  // back to editor
    tz?: string;
    className?: string;
    version?: number;
};

function htmlToExcerpt(html?: string | null, max = 180): string {
    if (!html) return '';
    // strip tags & collapse whitespace
    const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function FullDayList({
    date,
    selectedId,
    onSelectEntry,
    onBack,
    tz = 'America/Los_Angeles',
    className = '',
    version = 0
}: Props) {
    // per-day full list cache (local to this component)
    const cacheRef = useRef<Record<string, Journal[]>>({});
    const [items, setItems] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const key = dateKey(date);
        const cached = cacheRef.current[key];
        if (cached) { setItems(cached); return; }
        if (version) delete cacheRef.current[key];
        setLoading(true); setErr(null);
        getDayEntries(date, { tz })
            .then(({ items }) => {
                cacheRef.current[key] = items;
                setItems(items);
            })
            .catch((e: any) => setErr(e?.message || 'Failed to load day'))
            .finally(() => setLoading(false));
    }, [date, tz, version]);

    const friendlyDate = date.toLocaleDateString();

    return (
        <div className={className}>
            <div className="db__row">
                <h2 className="db__h1 text-[var(--font-size-h2)]">Entries on {friendlyDate}</h2>
                <button className="db__btn" onClick={onBack}>Back to editor</button>
            </div>

            {loading ? (
                <p className="db__muted">Loading…</p>
            ) : err ? (
                <p className="db__muted" role="alert">{err}</p>
            ) : items.length === 0 ? (
                <p className="db__muted">No entries on this day</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-[var(--space-lg)]">
                    {items.map((j) => {
                        const isSelected = !!selectedId && j.id === selectedId;
                        const excerpt = htmlToExcerpt(j.content, 180);

                        return (
                            <button
                                key={j.id}
                                onClick={() => onSelectEntry(j)}
                                title="Open in editor"
                                className={[
                                    // base card
                                    'card',
                                    'text-left transition-colors',
                                    // hover state (tokens)
                                    'hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-200)]',
                                    // selected accent ring
                                    isSelected ? 'ring-2 ring-[var(--color-brand-200)]' : '',
                                    // layout inside
                                    'grid gap-[var(--space-sm)]'
                                ].join(' ')}
                            >
                                <div className="flex items-start justify-between gap-[var(--space-sm)]">
                                    <h1 className="card-title">
                                        {j.title || 'Untitled entry'}
                                    </h1>
                                </div>

                                {excerpt && (
                                    <p className="card-subtitle">
                                        {excerpt}
                                    </p>
                                )}
                                

                                {Array.isArray(j.mood) && j.mood.length > 0 && (
                                    <div className="db__moods">
                                        {j.mood.map((m, k) => (
                                            <span key={`${j.id}-${k}`} className={moodChipClass(m)}>{m}</span>
                                        ))}
                                    </div>
                                )}
                                
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
