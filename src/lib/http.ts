// src/lib/http.ts
import { tokenStore } from './tokenStore'
import { refreshAccessToken } from './authManager'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Parser = 'json' | 'text'

export interface RequestOpts {
  method?: Method
  body?: unknown
  token?: string            // optional Bearer token (authed() will set this)
  headers?: Record<string, string>
  parse?: Parser
  signal?: AbortSignal          // default 'json'
}

/** single low-level request (non-throwing) */
export async function apiRequest<T = any>(path: string, opts: RequestOpts = {}) {
  const { method = 'GET', body, token, headers, parse = 'json' } = opts
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  const data = parse === 'text' ? text : (text ? safeJson(text) : null)
  return { ok: res.ok, status: res.status, data: data as T }
}

function safeJson(t: string) { try { return JSON.parse(t) } catch { return t } }

// export function postJsonRaw<T = any>(path: string, body: unknown, httpmethod: Method = 'POST') {
//   return apiRequest<T>(path, { method: httpmethod, body })
// }

/** high-level authed call: adds Bearer, 401→refresh→retry once, throws on failure */
export async function authed<T = any>(path: string, opts: Omit<RequestOpts,'token'> = {}): Promise<T> {
  const token1 = tokenStore.get()
  if (!token1) throw new Error('Not authenticated')

  // 1st attempt
  let res = await apiRequest<T>(path, { ...opts, token: token1 })
  if (res.ok) return res.data

  if(res.status === 204){
    throw new Error('No journals found');
  }
  if (res.status === 401) {
    await refreshAccessToken().catch(() => {})
    const token2 = tokenStore.get()
    if (!token2) throw new Error('Token refresh failed')

    res = await apiRequest<T>(path, { ...opts, token: token2 })
    if (res.ok) return res.data
  }

  const msg = (res.data as any)?.message || (res.data as any)?.error || `HTTP ${res.status}`
  const err: any = new Error(msg)
  err.status = res.status
  err.payload = res.data
  throw err
}
