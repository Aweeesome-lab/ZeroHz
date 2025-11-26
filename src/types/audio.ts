export type SoundType =
  | "rain"
  | "wind"
  | "waves"
  | "forest"
  | "stream"
  | "fire"
  | "flight"
  | "train"
  | "night"
  | "keyboard"
  | "thunder"
  | "glass-fruit";

export interface SoundControl {
  id: SoundType;
  icon: React.ElementType;
  label: string;
  src: string;
}

export type SoundVolumes = Record<SoundType, number>;

export type AudioRefs = {
  audioContext: AudioContext | null;
  gainNodes: Record<SoundType, GainNode | null>;
  sourceNodes: Record<SoundType, AudioBufferSourceNode | null>;
  audioBuffers: Record<SoundType, AudioBuffer | null>;
};
