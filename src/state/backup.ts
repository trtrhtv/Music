import { allRecordings, saveRecording } from './recordings';
import { getState, restoreState, today, type State } from './store';

const APP = 'music-trainer';

const toBase64 = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1] ?? '');
  r.onerror = () => rej(r.error);
  r.readAsDataURL(b);
});
const fromBase64 = (data: string, type: string) => new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type });

/** Downloads all progress (and optionally the recordings) as one JSON file. */
export async function downloadBackup(withRecordings: boolean) {
  const recs = withRecordings ? await allRecordings() : [];
  const recordings = await Promise.all(recs.map(async ({ blob, ...meta }) => ({ ...meta, data: await toBase64(blob) })));
  const file = new Blob([JSON.stringify({ app: APP, version: 1, created: Date.now(), state: getState(), recordings })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = `גיבוי-מוזיקה-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Restores a backup file. Returns how many recordings came back. Throws on a file that isn't a backup. */
export async function restoreBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as { app?: string; state?: Partial<State>; recordings?: { id: string; day: number; created: number; mime: string; seconds: number; data: string }[] };
  if (data.app !== APP || !data.state) throw new Error('not a backup');
  restoreState(data.state);
  for (const r of data.recordings ?? []) {
    const { data: b64, ...meta } = r;
    await saveRecording({ ...meta, blob: fromBase64(b64, meta.mime) });
  }
  return data.recordings?.length ?? 0;
}
