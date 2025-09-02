import { authed } from './http';

export type Journal = {
  id?: string | null
  title?: string
  content?: string
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  mood?: string[]
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type GetDayEntriesOpts = {
  limit?: number;                 // e.g. 4 for preview
  tz?: string;                    // default 'America/Los_Angeles'
  signal?: AbortSignal;           // optional cancellation
};

export async function getDayEntries(
  date: Date,
  opts: GetDayEntriesOpts = {}
): Promise<{ items: Journal[]; hasMore: boolean }> {
  const { limit, tz = 'America/Los_Angeles', signal } = opts;
  const q = new URLSearchParams();
  q.set('date', dateKey(date));
  q.set('tz', tz);
  if (limit && limit > 0) q.set('limit', String(limit));

  // You said your endpoint returns an array of Journal
  const items = await authed<Journal[]>(
    `/api/v1/journals/by-day?${q.toString()}`,
    { method: 'GET', signal }
  );
  
  // If caller requested a limit, infer hasMore by length >= limit
  const hasMore = !!limit && items.length >= limit;
  return { items, hasMore };
}
