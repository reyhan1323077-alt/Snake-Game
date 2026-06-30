import { Challenge, ScoreEntry } from '../types';

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'no_walls',
    name: 'GRID MASTER',
    description: 'Eat 50 fruits across sessions without hitting walls.',
    target: 50,
    current: 32, // Preserving the mockup's 32/50 progress!
    unit: 'fruits',
    isCompleted: false,
  },
  {
    id: 'speed_run',
    name: 'LIGHTSPEED',
    description: 'Eat 15 fruits at double speed (Speed multiplier 1.5x+).',
    target: 15,
    current: 0,
    unit: 'fruits',
    isCompleted: false,
  },
  {
    id: 'golden_feast',
    name: 'GOLDEN HARVEST',
    description: 'Collect 10 golden fruits (rare chance to spawn).',
    target: 10,
    current: 0,
    unit: 'fruits',
    isCompleted: false,
  },
  {
    id: 'growth_spurt',
    name: 'GIGANTIC SNAKE',
    description: 'Reach a snake length of 30 segments in a single run.',
    target: 30,
    current: 3,
    unit: 'segments',
    isCompleted: false,
  },
  {
    id: 'survivor',
    name: 'CHRONO SURVIVOR',
    description: 'Survive for 90 seconds in Arcade mode without dying.',
    target: 90,
    current: 0,
    unit: 'seconds',
    isCompleted: false,
  }
];

export const INITIAL_LEADERBOARD: ScoreEntry[] = [
  { id: '1', name: 'CYBER_PUNK', score: 24500, mode: 'classic', date: '2026-06-28' },
  { id: '2', name: 'BIT_CRUSHER', score: 19200, mode: 'classic', date: '2026-06-29' },
  { id: '3', name: 'GLITCH_MAGE', score: 15800, mode: 'arcade', date: '2026-06-27' },
  { id: '4', name: 'NEON_PILOT', score: 12400, mode: 'arcade', date: '2026-06-29' },
  { id: '5', name: 'VAPOR_WAVE', score: 9800, mode: 'zen', date: '2026-06-25' }
];
