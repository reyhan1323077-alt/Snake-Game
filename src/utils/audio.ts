/**
 * Retro sound synthesizer using Web Audio API
 */

let audioCtx: AudioContext | null = null;
let masterVolume = 0.5;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setVolume(vol: number) {
  masterVolume = Math.max(0, Math.min(1, vol));
}

export function playEatSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low and high bip for the classic coin/eat sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.setValueAtTime(masterVolume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(880, now + 0.06); // A5
    
    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.15);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playGoldenEatSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.setValueAtTime(masterVolume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.25); // G6
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playGameOverSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.setValueAtTime(masterVolume * 0.3, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.55);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playMoveSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.setValueAtTime(masterVolume * 0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.02);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playStartSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      const noteStart = now + idx * 0.08;
      const noteDuration = 0.2;
      
      gainNode.gain.setValueAtTime(masterVolume * 0.1, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playWinSound() {
  if (masterVolume === 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      const noteStart = now + idx * 0.06;
      const noteDuration = 0.3;
      
      gainNode.gain.setValueAtTime(masterVolume * 0.12, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}
