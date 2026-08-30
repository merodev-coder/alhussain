/**
 * UploadThing token detection for backend debug endpoints.
 *
 * UploadThing tokens are server-side environment variables (UPLOADTHING_TOKEN, UPLOADTHING_TOKEN_2, etc.)
 * The actual round-robin selection happens in the frontend API route handler (server-side Next.js code).
 */
export function getUploadThingTokens() {
    const numbered = [];
    for (const [key, value] of Object.entries(process.env)) {
        if (!value)
            continue;
        const match = key.match(/^UPLOADTHING_TOKEN_(\d+)$/);
        if (match) {
            numbered.push({ n: parseInt(match[1], 10), token: value });
        }
    }
    numbered.sort((a, b) => a.n - b.n);
    const tokens = [];
    if (process.env.UPLOADTHING_TOKEN) {
        tokens.push(process.env.UPLOADTHING_TOKEN);
    }
    for (const entry of numbered) {
        if (entry.token !== process.env.UPLOADTHING_TOKEN) {
            tokens.push(entry.token);
        }
    }
    return tokens;
}
export function getUploadThingTokenCount() {
    return getUploadThingTokens().length;
}
