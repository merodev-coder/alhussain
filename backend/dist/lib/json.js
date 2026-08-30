/** Attach string `id` from Mongo `_id` for lean() documents (schema transforms are skipped). */
export function withId(doc) {
    const raw = doc;
    const id = raw.id ||
        (typeof raw._id === 'string' ? raw._id : raw._id?.toString()) ||
        '';
    return { ...raw, id };
}
export function withIds(docs) {
    return docs.map(withId);
}
