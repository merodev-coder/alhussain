import { SignJWT, jwtVerify } from 'jose';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (in seconds)
function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set in environment variables');
    }
    return new TextEncoder().encode(secret);
}
export async function signAdminToken(username) {
    return new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(username)
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}
export async function verifyAdminToken(token) {
    if (!token)
        return null;
    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload.role !== 'admin' || !payload.sub)
            return null;
        return { sub: payload.sub, role: 'admin' };
    }
    catch {
        return null;
    }
}
export async function getAdminSessionFromRequest(req) {
    const token = req.cookies?.['ah_admin_session'];
    return verifyAdminToken(token);
}
export async function setAdminCookie(res, token) {
    res.cookie('ah_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE * 1000, // milliseconds
    });
}
export async function clearAdminCookie(res) {
    res.clearCookie('ah_admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
}
