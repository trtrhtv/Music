import { useEffect, useState } from 'react';

/** A take recorded inside the app. Audio is kept in IndexedDB (too big for localStorage). */
export interface Recording { id: string; day: number; created: number; mime: string; seconds: number; blob: Blob }

const DB = 'music-trainer-audio';
const STORE = 'recordings';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

const subs = new Set<() => void>();
const changed = () => subs.forEach((f) => f());

export async function saveRecording(r: Recording) {
  await tx('readwrite', (s) => s.put(r));
  // Ask the browser not to evict the recordings when space runs low.
  navigator.storage?.persist?.().catch(() => {});
  changed();
}

export async function deleteRecording(id: string) {
  await tx('readwrite', (s) => s.delete(id));
  changed();
}

export const allRecordings = () => tx<Recording[]>('readonly', (s) => s.getAll()).then((a) => a.sort((x, y) => x.created - y.created));

/** All recordings (optionally of one day), oldest first; re-reads on every change. */
export function useRecordings(day?: number): Recording[] {
  const [list, setList] = useState<Recording[]>([]);
  useEffect(() => {
    const load = () => { allRecordings().then((a) => setList(day === undefined ? a : a.filter((r) => r.day === day))).catch(() => setList([])); };
    load();
    subs.add(load);
    return () => { subs.delete(load); };
  }, [day]);
  return list;
}
