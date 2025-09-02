import { tokenStore } from "./tokenStore";

let refreshTimer: number | null = null
let refreshInflight: Promise<void> | null = null
let initPromise: Promise<void> | null = null;
let ready = false;

export async function ensureAccessToken(): Promise<boolean> {
  if (tokenStore.get()) return true
  try {
    const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    if (!res.ok) return false
    const data = await res.json()
    const at = data?.accessToken ?? data?.token ?? data?.access_token
    if (!at) return false
    setAccessToken(at)
    return true
  } catch { return false }
}

export function isAuthReady() {
  return ready;
}
// the below function extracts the expiration time from a jwt token, returning it as a unix timestamp (seconds since epoch), or null if not found/invalid
function decodeExp(token: string): number | null {
  try {
    const [, payload] = token.split('.')
    const json = JSON.parse(atob(payload))
    return typeof json.exp === 'number' ? json.exp : null
  } catch { return null }
}

export function setAccessToken(token: string | null) {
  tokenStore.set(token)
  scheduleProactiveRefresh(token)
}

export function initAuth(): Promise<void> {
  if (!initPromise) {
    initPromise = refreshAccessToken()
      .catch(() => {
        // no valid refresh cookie / server unavailable -> remain logged out
      })
      .finally(() => {
        ready = true;
      });
  }
  return initPromise;
}

// schedules a timer to refresh jwt before it expires by decoding expiration time from the token, subtracting a minute, and calling refreshAccessToken then
function scheduleProactiveRefresh(token: string | null) {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }
  if (!token) return
  const exp = decodeExp(token)
  if (!exp) return

  const nowSec = Math.floor(Date.now() / 1000)
  const leadSec = 60 // refresh 1 minute before toeken expiry
  const delayMs = Math.max((exp - nowSec - leadSec) * 1000, 0)

  refreshTimer = window.setTimeout(() => {
    void refreshAccessToken()
  }, delayMs)
}

// calls auth refresh api to get a new token
async function doRefreshOnce(): Promise<void> {
  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({} as any))

  const at =
    data?.accessToken ??
    data?.token ??
    data?.access_token ??
    null

  if (!res.ok || !at) throw new Error('refresh_failed')

  setAccessToken(at)  // <-- use setter so proactive timer is scheduled
}


// refreshes the access token if not already in progress, otherwise returns the inflight promise
export async function refreshAccessToken(): Promise<void> {
  if (!refreshInflight) {
    refreshInflight = doRefreshOnce().finally(() => { refreshInflight = null })
  }
  return refreshInflight
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }) // clear refresh cookie
  } catch {
    // ignore network errors
  } finally {
    setAccessToken(null)  // clears in-memory token + cancels refresh timer
    tokenStore.clear() // clears persisted token
  }
}
