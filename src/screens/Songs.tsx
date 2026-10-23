import { Blocks } from '../components/Blocks';
import { SONGS, SONG_BY_ID } from '../data/songs';
import { go } from '../router';

export function SongsList() {
  const group = (kind: 'song' | 'piece') => SONGS.filter((s) => s.kind === kind);
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לתוכנית</button>
      <h1>🎵 שירים ויצירות</h1>
      <p className="muted small">✅ אקורדים שהוצלבו בכמה מקורות · ⚠️ המקורות לא מסכימים – משתמשים בקישור</p>
      {(['song', 'piece'] as const).map((k) => (
        <section key={k} className="unit">
          <h3>{k === 'song' ? 'שירים' : 'יצירות לגיטרה'}</h3>
          {group(k).map((s) => (
            <button key={s.id} className="lesson-row" onClick={() => go('songs/' + s.id)}>
              <span className="lr-badge">{s.status === 'verified' ? '✅' : '⚠️'}</span>
              <span className="lr-title">{s.title}<br /><small className="muted">{s.artist} · {s.how}</small></span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

export function SongView({ id }: { id: string }) {
  const s = SONG_BY_ID[id];
  if (!s) return <div className="screen"><p>לא נמצא</p></div>;
  return (
    <div className="screen">
      <button className="back" onClick={() => (history.length > 1 ? history.back() : go('songs'))}>→ חזרה</button>
      <h1>{s.title}</h1>
      <p className="muted">{s.artist}</p>
      <div className="song-facts">
        <span>🎼 סולם: <bdi>{s.key}</bdi></span>
        {s.capo ? <span>📎 קאפו: {s.capo}</span> : null}
        <span>✋ {s.how}</span>
        <span>{s.status === 'verified' ? (s.kind === 'piece' ? '✅ נבדק מול מקור' : '✅ אקורדים מאומתים') : '⚠️ לאמת מול המקור'}</span>
      </div>
      <Blocks blocks={s.blocks} />
      <h3 className="section-title">מקורות וטאב מלא</h3>
      <Blocks blocks={[{ t: 'links', items: s.sources }]} />
      <p className="muted small">מילים וטאבים מלאים של שירים מוגנים בזכויות יוצרים – לכן הם בקישורים ולא כאן.</p>
    </div>
  );
}
