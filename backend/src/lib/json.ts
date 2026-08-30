/** Attach string `id` from Mongo `_id` for lean() documents (schema transforms are skipped). */
export function withId<T extends { _id?: { toString(): string } | string }>(
  doc: T
): T & { id: string } {
  const raw = doc as T & { _id?: { toString(): string } | string; id?: string }
  const id =
    raw.id ||
    (typeof raw._id === 'string' ? raw._id : raw._id?.toString()) ||
    ''
  return { ...raw, id }
}

export function withIds<T extends { _id?: { toString(): string } | string }>(
  docs: T[]
): Array<T & { id: string }> {
  return docs.map(withId)
}
