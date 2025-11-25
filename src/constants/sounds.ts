import {
  Wind,
  CloudRain,
  Flame,
  Waves,
  Bird,
  Droplets,
  Plane,
  TrainFront,
  Moon,
  Keyboard,
  CloudLightning,
} from "lucide-react";
import type { SoundControl, SoundType, SoundVolumes } from "@/types/audio";

export const SOUNDS: SoundControl[] = [
  // Nature
  { id: "rain", icon: CloudRain, label: "Rain", src: "/sounds/rain.m4a" },
  { id: "wind", icon: Wind, label: "Wind", src: "/sounds/wind.m4a" },
  { id: "waves", icon: Waves, label: "Waves", src: "/sounds/waves.m4a" },
  // Life
  { id: "forest", icon: Bird, label: "Forest", src: "/sounds/forest.m4a" },
  { id: "stream", icon: Droplets, label: "Stream", src: "/sounds/stream.m4a" },
  { id: "fire", icon: Flame, label: "Fire", src: "/sounds/fire.m4a" },
  // Places
  { id: "flight", icon: Plane, label: "Flight", src: "/sounds/flight.m4a" },
  { id: "train", icon: TrainFront, label: "Train", src: "/sounds/train.m4a" },
  { id: "night", icon: Moon, label: "Night", src: "/sounds/night.m4a" },
  // Work
  {
    id: "keyboard",
    icon: Keyboard,
    label: "Keyboard",
    src: "/sounds/keyboard.m4a",
  },
  {
    id: "thunder",
    icon: CloudLightning,
    label: "Thunder",
    src: "/sounds/thunder.m4a",
  },
];

export const SOUND_IDS: SoundType[] = [
  "rain",
  "wind",
  "waves",
  "forest",
  "stream",
  "fire",
  "flight",
  "train",
  "night",
  "keyboard",
  "thunder",
];

export const DEFAULT_VOLUMES: SoundVolumes = {
  rain: 0.5,
  wind: 0.5,
  waves: 0.5,
  forest: 0.5,
  stream: 0.5,
  fire: 0.5,
  flight: 0.5,
  train: 0.5,
  night: 0.5,
  keyboard: 0.5,
  thunder: 0.5,
};

export const ITEMS_PER_SLIDE = 4;
