/**
 * Keeps the admin session token in the browser and attaches it to API calls.
 * Needed because the site (Vercel) and the API (Render) are on different domains,
 * and many browsers silently drop cross-site cookies.
 */
const KEY = 'ah_admin_token'

export function getAdminToken(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token)
  } catch {
    /* storage unavailable - cookie fallback still applies */
  }
}

export function clearAdminToken(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function authHeaders(): Record<string, string> {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
