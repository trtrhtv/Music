import { audio } from './synth';
import { chromaFromSpectrum, detectPitch } from './pitch';

export interface MicFrame {
  freq: number | null;
  chroma: number[];
  level: number;
  /** Loudness below which a frame counts as silence: a few times the room's noise floor. */
  gate: number;
  /** Spectrum in dB (reused between frames – copy it to keep it) and its bin width. */
  spec?: Float32Array;
  binHz?: number;
}

/** How far above the room's noise floor a sound must be to count (a quiet hum or fan stays below). */
const ABOVE_FLOOR = 2;

/**
 * Streams pitch + chroma frames from the microphone until stopped.
 * There is no fixed loudness bar: phones without automatic gain pick up a guitar a metre away
 * at a few thousandths of full scale, and a note fades well below that while it still rings.
 * Instead the room's noise floor is tracked, and a frame counts when it stands out from it.
 * Noise itself never yields a pitch – the detector needs a periodic signal.
 */
export class MicListener {
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private running = false;
  private minRms: number;
  private floor = -1;
  /** `minRms`: the quietest frame that may ever count, whatever the room. */
  constructor(minRms = 0.001) { this.minRms = minRms; }

  /** Follows the quietest recent level: drops quickly, rises slowly (a held note doesn't become "the room"). */
  private gateFor(level: number) {
    this.floor = this.floor < 0 ? level : level < this.floor ? this.floor * 0.7 + level * 0.3 : this.floor * 1.002;
    return Math.max(this.minRms, this.floor * ABOVE_FLOOR);
  }

  async start(onFrame: (f: MicFrame) => void) {
    const c = audio();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const src = c.createMediaStreamSource(this.stream);
    const an = c.createAnalyser();
    an.fftSize = 8192;
    an.smoothingTimeConstant = 0.3;
    src.connect(an);
    this.analyser = an;
    const all = new Float32Array(an.fftSize);
    // The newest 4096 samples (~85 ms) – the analyser returns the oldest first.
    const time = all.subarray(an.fftSize - 4096);
    const freq = new Float32Array(an.frequencyBinCount);
    const binHz = c.sampleRate / an.fftSize;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      an.getFloatTimeDomainData(all);
      an.getFloatFrequencyData(freq);
      let sum = 0;
      for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
      const level = Math.sqrt(sum / time.length);
      const gate = this.gateFor(level);
      onFrame({ freq: detectPitch(time, c.sampleRate, 60, 1400, gate), chroma: chromaFromSpectrum(freq, binHz), level, gate, spec: freq, binHz });
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.analyser?.disconnect();
    this.stream = null;
    this.analyser = null;
  }
}
