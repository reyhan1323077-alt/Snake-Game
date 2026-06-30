export type GameMode = 'classic' | 'arcade' | 'zen' | 'challenges';

export interface Position {
  x: number;
  y: number;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  date: string;
}

export type ChallengeId = 'no_walls' | 'speed_run' | 'golden_feast' | 'survivor' | 'growth_spurt';

export interface Challenge {
  id: ChallengeId;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  isCompleted: boolean;
}

export interface GameSettings {
  soundVolume: number; // 0 to 1
  snakeColor: 'green' | 'pink' | 'cyan' | 'yellow';
  speedMultiplier: number; // 0.8 to 1.5
  particleEffects: boolean;
  gridVisible: boolean;
}

export interface DailyMission {
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
}
