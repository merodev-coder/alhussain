import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'ah_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (in seconds)

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your environment variables (see .env.example).')
  }
  return new TextEncoder().encode(secret)
}

export type AdminSession = {
  sub: string
  role: 'admin'
}

/** Create a signed JWT for the shared admin account. */
export async function signAdminToken(username: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/** Verify a JWT string. Returns the payload or null when invalid/expired. */
export async function verifyAdminToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'admin' || !payload.sub) return null
    return { sub: payload.sub, role: 'admin' }
  } catch {
    return null
  }
}

/** Read + verify the admin session from cookies (server components / route handlers). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies()
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value)
}

/** Set the httpOnly session cookie after a successful login. */
export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/** Clear the session cookie on logout. */
export async function clearAdminCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
}
