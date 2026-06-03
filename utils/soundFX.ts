import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export type SFXType =
  | "enable"
  | "disable"
  | "success"
  | "error"
  | "connect"
  | "boot"
  | "click"
  | "inject";

interface ToneSpec {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  freqEnd?: number;
}

function synthesize(tones: ToneSpec[]) {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = new Ctx();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.45, ctx.currentTime);
    masterGain.connect(ctx.destination);

    tones.forEach(({ freq, start, dur, type = "square", gain = 0.25, freqEnd }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, ctx.currentTime);

      osc.connect(filter);
      filter.connect(g);
      g.connect(masterGain);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      if (freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + start + dur);
      }

      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.012);
      g.gain.setValueAtTime(gain, ctx.currentTime + start + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.02);
    });

    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, (Math.max(...tones.map((t) => t.start + t.dur)) + 0.5) * 1000);
  } catch {}
}

const SFX_MAP: Record<SFXType, ToneSpec[]> = {
  enable: [
    { freq: 330, start: 0,    dur: 0.08, type: "square",   gain: 0.18 },
    { freq: 440, start: 0.07, dur: 0.08, type: "square",   gain: 0.22 },
    { freq: 660, start: 0.14, dur: 0.12, type: "square",   gain: 0.26 },
    { freq: 880, start: 0.22, dur: 0.18, type: "sawtooth", gain: 0.20, freqEnd: 920 },
  ],
  disable: [
    { freq: 660, start: 0,    dur: 0.08, type: "square", gain: 0.20 },
    { freq: 440, start: 0.07, dur: 0.08, type: "square", gain: 0.16 },
    { freq: 220, start: 0.14, dur: 0.14, type: "square", gain: 0.12, freqEnd: 180 },
  ],
  success: [
    { freq: 523, start: 0,    dur: 0.10, type: "sine", gain: 0.28 },
    { freq: 659, start: 0.10, dur: 0.10, type: "sine", gain: 0.30 },
    { freq: 784, start: 0.20, dur: 0.10, type: "sine", gain: 0.32 },
    { freq: 1047,start: 0.30, dur: 0.22, type: "sine", gain: 0.35 },
  ],
  error: [
    { freq: 180, start: 0,    dur: 0.12, type: "sawtooth", gain: 0.28 },
    { freq: 150, start: 0.10, dur: 0.12, type: "sawtooth", gain: 0.24 },
    { freq: 120, start: 0.20, dur: 0.18, type: "sawtooth", gain: 0.20, freqEnd: 80 },
  ],
  connect: [
    { freq: 220, start: 0,    dur: 0.07, type: "square",   gain: 0.18 },
    { freq: 330, start: 0.07, dur: 0.07, type: "square",   gain: 0.22 },
    { freq: 440, start: 0.14, dur: 0.07, type: "square",   gain: 0.24 },
    { freq: 550, start: 0.21, dur: 0.07, type: "square",   gain: 0.26 },
    { freq: 880, start: 0.28, dur: 0.20, type: "sawtooth", gain: 0.28, freqEnd: 960 },
  ],
  boot: [
    { freq: 60,  start: 0,    dur: 0.10, type: "sawtooth", gain: 0.15, freqEnd: 120 },
    { freq: 110, start: 0.08, dur: 0.10, type: "square",   gain: 0.18 },
    { freq: 220, start: 0.16, dur: 0.10, type: "square",   gain: 0.20 },
    { freq: 440, start: 0.24, dur: 0.12, type: "square",   gain: 0.24 },
    { freq: 660, start: 0.34, dur: 0.15, type: "square",   gain: 0.28 },
    { freq: 880, start: 0.46, dur: 0.25, type: "sawtooth", gain: 0.32, freqEnd: 940 },
  ],
  click: [
    { freq: 800, start: 0, dur: 0.04, type: "square", gain: 0.18 },
    { freq: 400, start: 0.03, dur: 0.04, type: "square", gain: 0.10 },
  ],
  inject: [
    { freq: 200, start: 0,    dur: 0.06, type: "sawtooth", gain: 0.14 },
    { freq: 300, start: 0.05, dur: 0.06, type: "sawtooth", gain: 0.16 },
    { freq: 440, start: 0.10, dur: 0.06, type: "square",   gain: 0.18 },
    { freq: 600, start: 0.15, dur: 0.06, type: "square",   gain: 0.20 },
    { freq: 800, start: 0.20, dur: 0.08, type: "square",   gain: 0.22, freqEnd: 850 },
    { freq: 1000,start: 0.26, dur: 0.14, type: "sawtooth", gain: 0.20, freqEnd: 1100 },
  ],
};

export function playSFX(type: SFXType) {
  if (Platform.OS === "web") {
    synthesize(SFX_MAP[type]);
  } else {
    switch (type) {
      case "enable":
      case "inject":
      case "connect":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "disable":
      case "click":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "success":
      case "boot":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }
}
