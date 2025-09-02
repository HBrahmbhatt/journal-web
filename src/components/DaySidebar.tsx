// src/components/DaySidebar.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import CalendarRD from './Calendar';
import DayEntryList from './DayEntryList';
import { getDayEntries, dateKey, type Journal } from '../lib/Journal';

type Props = {
  selectedDate: Date;
  selectedId?: string | null;
  onChangeDate: (d: Date) => void;
  onSelectEntry: (j: Journal) => void; // opens editor
  onShowMore: () => void;              // switch to full list view
  tz?: string;
  className?: string;
  version?:number;
};

export default function DaySidebar({
  selectedDate,
  selectedId,
  onChangeDate,
  onSelectEntry,
  onShowMore,
  tz = 'America/Los_Angeles',
  className = '',
  version=0

}: Props) {
  const friendlyDate = useMemo(() => selectedDate.toLocaleDateString(), [selectedDate]);
  // per-day preview cache (local to this component)
  const cacheRef = useRef<Record<string, { preview?: Journal[]; hasMore?: boolean }>>({});
  const [preview, setPreview] = useState<Journal[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const key = dateKey(selectedDate);
    if(version) delete cacheRef.current[key]
    const cached = cacheRef.current[key];
    if (cached?.preview) {
      setPreview(cached.preview);
      setHasMore(!!cached.hasMore);
      return;
    }
    setLoading(true);
    setErr(null);

    getDayEntries(selectedDate, { limit: 3, tz })
      .then(({ items, hasMore }) => {
        const top3 = hasMore ? items.slice(0, 3) : items;
        cacheRef.current[key] = { preview: top3, hasMore };
        setPreview(top3);
        setHasMore(hasMore);
      })
      .catch((e: any) => {console.log(e)})
      .finally(() => setLoading(false));
  }, [selectedDate, tz, version]);

  return (
    <div className={className}>
      <CalendarRD value={selectedDate} onChange={onChangeDate} />

      <DayEntryList
        entries={preview}
        selectedId={selectedId ?? null}
        onSelect={onSelectEntry}
        variant="preview"
        hasMore={hasMore}
        onMore={onShowMore}
        title={`Entries on ${friendlyDate}`}
      />
      {loading && <p className="db__muted">Loading…</p>}
      {err && <p className="db__muted" role="alert">{err}</p>}
    </div>
  );
}
