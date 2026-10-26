import { audio } from './synth';
import { chromaFromSpectrum, detectPitch } from './pitch';

export interface MicFrame {
  freq: number | null;
  chroma: number[];
  level: number;
  /** Spectrum in dB (reused between frames – copy it to keep it) and its bin width. */
  spec?: Float32Array;
  binHz?: number;
}

/** Streams pitch + chroma frames from the microphone until stopped. */
export class MicListener {
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private running = false;
  private minRms: number;
  /** `minRms`: quietest frame that still gets a pitch (lower = more sensitive). */
  constructor(minRms = 0.01) { this.minRms = minRms; }

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
    const time = new Float32Array(4096);
    const freq = new Float32Array(an.frequencyBinCount);
    const binHz = c.sampleRate / an.fftSize;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      an.getFloatTimeDomainData(time);
      an.getFloatFrequencyData(freq);
      let sum = 0;
      for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
      const level = Math.sqrt(sum / time.length);
      onFrame({ freq: detectPitch(time, c.sampleRate, 60, 1400, this.minRms), chroma: chromaFromSpectrum(freq, binHz), level, spec: freq, binHz });
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
