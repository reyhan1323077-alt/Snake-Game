import React, { useState } from 'react';
import { X, Trophy, Calendar, Sparkles } from 'lucide-react';
import { ScoreEntry, GameMode } from '../types';

interface LeaderboardModalProps {
  scores: ScoreEntry[];
  currentMode: GameMode;
  onClose: () => void;
  onClear?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ 
  scores, 
  currentMode, 
  onClose,
  onClear 
}) => {
  const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');

  const filteredScores = scores
    .filter(s => filterMode === 'all' || s.mode === filterMode)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-lg p-6 rounded-xl space-y-6 relative border-primary/20">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h3 className="font-headline-md text-2xl tracking-tight uppercase">Leaderboard</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 hover:bg-surface-container-highest rounded-lg transition-all"
            id="leaderboard-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Filters */}
        <div className="flex flex-wrap gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/50">
          {(['all', 'classic', 'arcade', 'zen', 'challenges'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`flex-grow py-2 px-3 rounded-lg text-xs font-label-caps uppercase transition-all cursor-pointer ${
                filterMode === m 
                  ? 'bg-secondary-container text-white shadow-[0_0_8px_#ff4b89]' 
                  : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Scores Table */}
        <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
          {filteredScores.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant font-mono text-sm">
              No scores recorded for this mode yet. Be the first to set a record!
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-[10px] font-label-caps text-on-surface-variant border-b border-outline-variant/30">
                <span className="col-span-2">RANK</span>
                <span className="col-span-4">PILOT</span>
                <span className="col-span-3 text-center">MODE</span>
                <span className="col-span-3 text-right">SCORE</span>
              </div>

              {filteredScores.map((entry, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                return (
                  <div 
                    key={entry.id}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border transition-all ${
                      isFirst 
                        ? 'bg-primary-container/10 border-primary-container/40 text-primary-fixed shadow-[0_0_8px_rgba(0,255,65,0.1)]' 
                        : isSecond
                        ? 'bg-secondary-container/10 border-secondary-container/30 text-secondary'
                        : isThird
                        ? 'bg-tertiary-fixed-dim/10 border-tertiary-fixed-dim/30 text-[#00daf3]'
                        : 'bg-surface-container-high border-outline-variant/30 text-on-surface'
                    }`}
                  >
                    <div className="col-span-2 font-mono font-bold flex items-center gap-1">
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="col-span-4 font-mono font-bold uppercase tracking-wider truncate">
                      {entry.name}
                    </div>
                    <div className="col-span-3 text-center text-[10px] font-label-caps uppercase truncate">
                      {entry.mode}
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold text-lg">
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear scores button if available */}
        <div className="flex justify-between items-center border-t border-outline-variant/30 pt-4">
          <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            VAPOR_ARCADE ENGINE v2.0
          </span>
          {onClear && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all high scores?')) {
                  onClear();
                }
              }}
              className="text-xs font-label-caps text-secondary-container hover:text-white transition-colors cursor-pointer bg-secondary-container/5 hover:bg-secondary-container/20 px-3 py-1.5 rounded-lg border border-secondary-container/20"
            >
              RESET LEADERBOARD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
