/**
 * UploadThing tokens from the backend environment
 * (UPLOADTHING_TOKEN, UPLOADTHING_TOKEN_2, etc.).
 *
 * The SDK binds a single token at module load time; extra numbered tokens
 * are listed for debug/admin documentation only.
 */

export function getUploadThingTokens(): string[] {
  const numbered: { n: number; token: string }[] = []

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue
    const match = key.match(/^UPLOADTHING_TOKEN_(\d+)$/)
    if (match) {
      numbered.push({ n: parseInt(match[1], 10), token: value })
    }
  }

  numbered.sort((a, b) => a.n - b.n)

  const tokens: string[] = []
  if (process.env.UPLOADTHING_TOKEN) {
    tokens.push(process.env.UPLOADTHING_TOKEN)
  }
  for (const entry of numbered) {
    if (entry.token !== process.env.UPLOADTHING_TOKEN) {
      tokens.push(entry.token)
    }
  }
  return tokens
}

export function getUploadThingTokenCount(): number {
  return getUploadThingTokens().length
}
