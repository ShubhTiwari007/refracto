// src/utils/audio.js
// Web Audio API procedural audio synthesizer for Refracto.

let audioCtx = null;
let isMuted = false;
let bgMusicInterval = null;
let bgMusicStep = 0;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      startBackgroundMusic();
    });
  }
  return audioCtx;
}

export function setMute(muteState) {
  isMuted = muteState;
  if (audioCtx && isMuted) {
    audioCtx.suspend();
    stopBackgroundMusic();
  } else if (audioCtx && !isMuted) {
    audioCtx.resume().then(() => {
      startBackgroundMusic();
    });
  }
}

// Cyberpunk Ambient Optic Drone Synthesizer
export function startBackgroundMusic() {
  if (isMuted) return;
  if (bgMusicInterval) return; // Already running

  try {
    const ctx = getAudioContext();
    // A Major / F# Minor Pentatonic Scale (Warm digital flow)
    const notes = [164.81, 185.00, 220.00, 246.94, 277.18]; // E3, F#3, A3, B3, C#4

    const playStep = () => {
      if (isMuted || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      // 1. Digital Pad Hum (plays every 8 steps)
      if (bgMusicStep % 8 === 0) {
        const oscBass = ctx.createOscillator();
        const gainBass = ctx.createGain();
        const lpFilter = ctx.createBiquadFilter();

        oscBass.type = 'triangle';
        oscBass.frequency.setValueAtTime(110.00, now); // A2 bass pad note

        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(150, now);

        gainBass.gain.setValueAtTime(0, now);
        gainBass.gain.linearRampToValueAtTime(0.05, now + 0.8); // Slow drone fade
        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

        oscBass.connect(lpFilter);
        lpFilter.connect(gainBass);
        gainBass.connect(ctx.destination);

        oscBass.start(now);
        oscBass.stop(now + 3.4);
      }

      // 2. Neon Laser Arpeggio tick (plays on even steps)
      if (bgMusicStep % 2 === 0) {
        const oscArp = ctx.createOscillator();
        const gainArp = ctx.createGain();
        const delay = ctx.createDelay();
        const delayGain = ctx.createGain();

        oscArp.type = 'sine';
        const noteIndex = (bgMusicStep * 2) % notes.length;
        // Alternate octaves to create a dancing light effect
        const octave = bgMusicStep % 4 === 0 ? 2 : 1; 
        oscArp.frequency.setValueAtTime(notes[noteIndex] * octave, now);

        gainArp.gain.setValueAtTime(0.015, now);
        gainArp.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        delay.delayTime.value = 0.25;
        delayGain.gain.value = 0.25;

        oscArp.connect(gainArp);
        gainArp.connect(ctx.destination);

        gainArp.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(ctx.destination);

        oscArp.start(now);
        oscArp.stop(now + 0.4);
      }

      bgMusicStep++;
    };

    bgMusicInterval = setInterval(playStep, 400); // Drone tempo
  } catch (e) {
    console.warn("Background music start failed:", e);
  }
}

export function stopBackgroundMusic() {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
}

// 1. Place Mirror/Filter Block (Clink Sound)
export function playPlace() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 2. Rotate Mirror (High pitch rotation click)
export function playRotate() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.setValueAtTime(900, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 3. Receptor Lock On (Chirp Sound when target is aligned)
export function playTargetLock() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// 4. Level Clear (Futuristic arpeggio)
export function playLevelUp() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [293.66, 369.99, 440.00, 587.33]; // D major chords (D4, F#4, A4, D5)
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.08, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.35);
    });
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}
