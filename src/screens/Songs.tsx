import { Blocks } from '../components/Blocks';
import { SONG_BY_ID } from '../data/songs';
import { go } from '../router';

export function SongView({ id }: { id: string }) {
  const s = SONG_BY_ID[id];
  if (!s) return <div className="screen"><p>לא נמצא</p></div>;
  return (
    <div className="screen">
      <button className="back" onClick={() => (history.length > 1 ? history.back() : go('plan'))}>→ חזרה</button>
      <h1>{s.title}</h1>
      <p className="muted">{s.artist}</p>
      <div className="song-facts">
        <span>🎼 סולם: <bdi>{s.key}</bdi></span>
        {s.capo ? <span>📎 קאפו: {s.capo}</span> : null}
        <span>✋ {s.how}</span>
        <span>{s.status === 'verified' ? (s.kind === 'piece' || !s.blocks.some((b) => b.t === 'chords') ? '✅ נבדק מול מקור' : '✅ אקורדים מאומתים') : '⚠️ לאמת מול המקור'}</span>
      </div>
      <Blocks blocks={s.blocks} />
      <h3 className="section-title">מקורות וטאב מלא</h3>
      <Blocks blocks={[{ t: 'links', items: s.sources }]} />
      <p className="muted small">מילים וטאבים מלאים של שירים מוגנים בזכויות יוצרים – לכן הם בקישורים ולא כאן.</p>
    </div>
  );
}
