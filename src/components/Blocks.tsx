import { rich } from './rich';
import { playCue } from '../audio/cue';
import { playNote } from '../audio/synth';
import type { Block } from '../data/blocks';
import { GLOSSARY_BY_ID } from '../data/glossary';
import { go } from '../router';
import { GUITAR_TUNING } from '../theory/theory';
import { ChordDiagram } from './ChordDiagram';
import { Fretboard } from './Fretboard';
import { Keyboard } from './Keyboard';
import { Staff } from './Staff';
import { Metronome, StrumPattern, TabView } from './RhythmTools';

/**
 * Renders explanation blocks. `onTopic` handles glossary links; by default they navigate
 * to the glossary page (inside an exercise we open them in place instead).
 */
export function Blocks({ blocks, onTopic }: { blocks: Block[]; onTopic?: (id: string) => void }) {
  const open = onTopic ?? ((id: string) => go('glossary/' + id));
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p': return <p key={i}>{rich(b.text)}</p>;
          case 'h': return <h3 key={i} className="b-h">{b.text}</h3>;
          case 'tip': return <div key={i} className="b-tip">💡 {rich(b.text)}</div>;
          case 'list': return <ul key={i} className="b-list">{b.items.map((x, k) => <li key={k}>{rich(x)}</li>)}</ul>;
          case 'table':
            return (
              <div key={i} className="b-table-wrap">
                <table className="b-table">
                  {b.head && <thead><tr>{b.head.map((c, k) => <th key={k}>{c}</th>)}</tr></thead>}
                  <tbody>
                    {b.rows.map((r, k) => (
                      <tr key={k}>{r.map((c, j) => <td key={j} dir={b.ltr?.includes(j) ? 'ltr' : undefined}>{rich(c)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'keyboard':
            return (
              <figure key={i} className="b-fig">
                <Keyboard from={b.from ?? 48} to={b.to ?? 72} labels={!b.labels || b.labels === 'letters' ? true : b.labels}
                  marks={(b.marks ?? []).map((m) => ({ midi: m, kind: 'hint' as const }))} onPress={(m) => playNote(m, { dur: 0.8 })} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'staff':
            return (
              <figure key={i} className="b-fig">
                <Staff spec={b.spec} labels={b.labels} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'diagram':
            return (
              <figure key={i} className="b-fig">
                <ChordDiagram frets={b.frets} label={b.label} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'fretboard':
            return (
              <figure key={i} className="b-fig">
                <Fretboard maxFret={b.maxFret ?? 12} showNames={b.names}
                  marks={(b.marks ?? []).map((m) => ({ ...m, kind: 'mark' as const }))}
                  onPress={(s, f) => playNote(GUITAR_TUNING[s] + f, { timbre: 'guitar' })} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'sounds':
            return (
              <div key={i} className="demos">
                {b.items.map((d, k) => (
                  <button key={k} className="btn demo" onClick={() => playCue(d.cue, d.timbre)}>🔊 {d.label}</button>
                ))}
              </div>
            );
          case 'tab': return <TabView key={i} lines={b.lines} title={b.title} />;
          case 'strum': return <StrumPattern key={i} name={b.name} rhythm={b.rhythm} bpm={b.bpm} chords={b.chords} chordNames={b.chordNames} note={b.note} />;
          case 'metronome': return <Metronome key={i} initial={b.bpm} beats={b.beats} />;
          case 'links':
            return (
              <div key={i} className="b-links">
                {b.items.map((l, k) => <a key={k} className="chip" href={l.url} target="_blank" rel="noopener noreferrer">🔗 {l.label}</a>)}
              </div>
            );
          case 'go':
            return (
              <div key={i} className="b-see">
                {b.items.map((l, k) => <button key={k} className="chip" onClick={() => go(l.to)}>➜ {l.label}</button>)}
              </div>
            );
          case 'chords':
            return (
              <figure key={i} className="b-fig">
                <div className="chord-row">{b.items.map((ch, k) => <ChordDiagram key={k} frets={ch.frets} label={ch.name} />)}</div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'see':
            return (
              <div key={i} className="b-see">
                <span className="muted small">📚 במילון:</span>
                {b.ids.filter((id) => GLOSSARY_BY_ID[id]).map((id) => (
                  <button key={id} className="chip" onClick={() => open(id)}>{GLOSSARY_BY_ID[id].icon} {GLOSSARY_BY_ID[id].title}</button>
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}
