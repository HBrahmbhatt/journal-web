import type { Journal } from "../lib/Journal";
import { moodChipClass } from "./MoodPicker";

type Props = {
  entries: Journal[];
  selectedId?: string | null;
  onSelect: (j: Journal) => void;
  variant?: 'preview' | 'full';
  hasMore?: boolean;
  onMore?: () => void;
  onBack?: () => void;
  title?: string;
  className?: string;
};

export default function DayEntryList({
  entries,
  selectedId,
  onSelect,
  variant = 'preview',
  hasMore = false,
  onMore,
  className = '',
}: Props) {
  const show = variant === 'preview' ? entries.slice(0, 3) : entries;

  return (
    <div className={className}>

      <div className="db__list">
        {show.length === 0 && <div className="list-empty">No entries on this day</div>}
        {show.map((j, i) => {
          const id = j.id ?? `fallback-${i}`;
          const selected = !!selectedId && j.id === selectedId;

          return (
            <button
              key={id}
              onClick={() => onSelect(j)}
              className={`db__entry text-left ${selected ? 'entry-selected' : ''}`}
              title="Open in editor"
            >
              <strong className="block">{j.title ?? `Entry ${i + 1}`}</strong>
              {Array.isArray(j.mood) && j.mood.length > 0 && (
                <div className="db__moods">
                  {j.mood.map((m, k) => (
                    <span key={`${id}-${k}`} className={moodChipClass(m)}>{m}</span>
                  ))}
                </div>
              )}

            </button>
          );
        })}
      </div>

      {variant === 'preview' && hasMore && (
        <div className="mt-[var(--space-sm)]">
          <button type="button" className="db__btnPrimary w-full" onClick={onMore}>
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
