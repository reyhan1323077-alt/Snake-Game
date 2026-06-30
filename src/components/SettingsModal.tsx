import React from 'react';
import { X, Volume2, VolumeX, Grid, Sparkles, Sliders, Palette } from 'lucide-react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onChange, onClose }) => {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-md p-6 rounded-xl space-y-6 relative border-primary/20">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Sliders className="w-5 h-5" />
            <h3 className="font-headline-md text-xl tracking-tight uppercase">Arcade Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 hover:bg-surface-container-highest rounded-lg transition-all"
            id="settings-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings options */}
        <div className="space-y-5">
          {/* Neon Style Color Picker */}
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              SNAKE NEON GLOW
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'green', label: 'Green', color: 'bg-primary-container', activeClass: 'border-primary shadow-[0_0_10px_#00ff41]' },
                { id: 'pink', label: 'Pink', color: 'bg-secondary-container', activeClass: 'border-secondary shadow-[0_0_10px_#ff4b89]' },
                { id: 'cyan', label: 'Cyan', color: 'bg-tertiary-fixed-dim', activeClass: 'border-[#00daf3] shadow-[0_0_10px_#00daf3]' },
                { id: 'yellow', label: 'Yellow', color: 'bg-yellow-400', activeClass: 'border-yellow-400 shadow-[0_0_10px_#ffdf00]' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSetting('snakeColor', c.id as any)}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all capitalize cursor-pointer hover:scale-105 active:scale-95 ${
                    settings.snakeColor === c.id 
                      ? `${c.activeClass} bg-surface-container-high` 
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${c.color}`} />
                  <span className="text-[10px] font-label-caps">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-2">
                {settings.soundVolume > 0 ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-secondary" />
                )}
                SOUND EFFECTS VOLUME
              </label>
              <span className="font-mono text-xs text-primary">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.soundVolume}
              onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary-container"
            />
          </div>

          {/* Speed Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                GAMEPLAY SPEED MULTIPLIER
              </label>
              <span className="font-mono text-xs text-secondary">{settings.speedMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.8"
              step="0.1"
              value={settings.speedMultiplier}
              onChange={(e) => updateSetting('speedMultiplier', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary-container"
            />
          </div>

          {/* Grid Visibility Toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-2">
              <Grid className="w-4 h-4 text-primary" />
              SHOW GRAPH GRID
            </label>
            <button
              onClick={() => updateSetting('gridVisible', !settings.gridVisible)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                settings.gridVisible ? 'bg-primary-container' : 'bg-surface-container-highest'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-surface-container-lowest transition-transform transform ${
                  settings.gridVisible ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Particles toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="font-label-caps text-xs text-on-surface-variant flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              NEON EXPLOSION PARTICLES
            </label>
            <button
              onClick={() => updateSetting('particleEffects', !settings.particleEffects)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                settings.particleEffects ? 'bg-primary-container' : 'bg-surface-container-highest'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-surface-container-lowest transition-transform transform ${
                  settings.particleEffects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-outline-variant pt-4 flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
          <span>AUDIO DRIVER: WEB_AUDIO_API</span>
          <span>SYSTEM STATE: STABLE</span>
        </div>
      </div>
    </div>
  );
};
