
// This file requires `tone` to be available globally, e.g., via a script tag.
// Add the following to your index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>

declare const Tone: any;

let isAudioInitialized = false;
let isMutedGlobally = false;

interface Sound {
  triggerAttackRelease: (note: string, duration: string) => void;
}

let sounds: { [key: string]: Sound } = {};

export const initAudio = async () => {
  if (isAudioInitialized || typeof Tone === 'undefined') return;
  
  await Tone.start();
  console.log('Audio context started');

  sounds = {
    moveGrass: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 } }).toDestination(),
    moveMud: new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
    collectNormal: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 } }).toDestination(),
    collectGolden: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.4 } }).toDestination(),
    deliver: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.5 } }).toDestination(),
    gameOver: new Tone.Synth({ oscillator: { type: "fmsine" }, envelope: { attack: 0.1, decay: 1, sustain: 0.1, release: 1 } }).toDestination(),
    targetReached: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination(),
  };

  isAudioInitialized = true;
};

export const setMuted = (muted: boolean) => {
  isMutedGlobally = muted;
};

export const playSound = (soundName: keyof typeof sounds, note: string, duration = '16n') => {
  if (isAudioInitialized && !isMutedGlobally && sounds[soundName]) {
    sounds[soundName].triggerAttackRelease(note, duration);
  }
};
