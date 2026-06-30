import { useState, useEffect, useMemo } from 'react';
import { Trophy, Sliders, User, Gamepad2, Sparkles, CheckCircle2, ChevronRight, Play, Server, Github } from 'lucide-react';
import { GameMode, ScoreEntry, GameSettings, Challenge, ChallengeId } from './types';
import { INITIAL_CHALLENGES, INITIAL_LEADERBOARD } from './data/challenges';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameCanvas } from './components/GameCanvas';
import { setVolume } from './utils/audio';

export default function App() {
  // Game state
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<GameMode>('classic');
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'paused'>('ready');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState<boolean>(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState<boolean>(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [showNameEntry, setShowNameEntry] = useState<boolean>(false);
  const [pilotName, setPilotName] = useState<string>('');
  const [pendingScore, setPendingScore] = useState<number | null>(null);

  // Challenges state
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Settings state
  const [settings, setSettings] = useState<GameSettings>({
    soundVolume: 0.5,
    snakeColor: 'green',
    speedMultiplier: 1.1,
    particleEffects: true,
    gridVisible: true,
  });

  // Load state from localStorage on init
  useEffect(() => {
    // High Score
    const savedHighScore = localStorage.getItem('snake-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    } else {
      setHighScore(12400); // Default placeholder highscore from mockup leaderboard
      localStorage.setItem('snake-highscore', '12400');
    }

    // Leaderboard
    const savedLeaderboard = localStorage.getItem('snake-leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    } else {
      setLeaderboard(INITIAL_LEADERBOARD);
      localStorage.setItem('snake-leaderboard', JSON.stringify(INITIAL_LEADERBOARD));
    }

    // Challenges
    const savedChallenges = localStorage.getItem('snake-challenges');
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      setChallenges(INITIAL_CHALLENGES);
      localStorage.setItem('snake-challenges', JSON.stringify(INITIAL_CHALLENGES));
    }

    // Settings
    const savedSettings = localStorage.getItem('snake-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      setVolume(parsedSettings.soundVolume);
    } else {
      setVolume(0.5);
    }

    // Premium status
    const savedPremium = localStorage.getItem('snake-premium');
    if (savedPremium) {
      setPremiumUnlocked(savedPremium === 'true');
    }
  }, []);

  // Update volume driver when state changes
  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setVolume(newSettings.soundVolume);
    localStorage.setItem('snake-settings', JSON.stringify(newSettings));
  };

  // Keep track of the active challenge (for challenges mode)
  const [selectedChallengeId, setSelectedChallengeId] = useState<ChallengeId>('no_walls');
  const activeChallenge = useMemo(() => {
    return challenges.find(c => c.id === selectedChallengeId) || null;
  }, [challenges, selectedChallengeId]);

  // Update challenge progress safely
  const handleChallengeProgress = (id: ChallengeId, amount: number, setRelative = false) => {
    setChallenges(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          if (c.isCompleted) return c;
          const nextVal = setRelative ? amount : c.current + amount;
          const completed = nextVal >= c.target;
          return {
            ...c,
            current: Math.min(c.target, nextVal),
            isCompleted: completed
          };
        }
        return c;
      });
      localStorage.setItem('snake-challenges', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle score updates
  const handleScoreChange = (score: number) => {
    setCurrentScore(score);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-highscore', score.toString());
    }
  };

  // Handle game over check
  const handleGameOver = (finalScore: number) => {
    // Check if score is eligible for leaderboard
    const isEligible = finalScore > 0 && (
      leaderboard.length < 10 || 
      finalScore > [...leaderboard].sort((a,b) => b.score - a.score)[9]?.score
    );

    if (isEligible) {
      setPendingScore(finalScore);
      setShowNameEntry(true);
    }
  };

  // Submit new pilot score
  const submitPilotScore = () => {
    if (!pilotName.trim() || pendingScore === null) return;
    
    const newEntry: ScoreEntry = {
      id: Date.now().toString(),
      name: pilotName.trim().toUpperCase(),
      score: pendingScore,
      mode: activeMode,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('snake-leaderboard', JSON.stringify(updatedLeaderboard));
    
    // Update global top score
    if (pendingScore > highScore) {
      setHighScore(pendingScore);
      localStorage.setItem('snake-highscore', pendingScore.toString());
    }

    setPendingScore(null);
    setShowNameEntry(false);
    setPilotName('');
    setIsLeaderboardOpen(true); // celebrate by showing the scoreboard
  };

  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    localStorage.removeItem('snake-leaderboard');
  };

  // Dynamic colors matching selected neon color style
  const getThemeColorClass = () => {
    switch (settings.snakeColor) {
      case 'pink': return 'text-secondary';
      case 'cyan': return 'text-tertiary-fixed-dim';
      case 'yellow': return 'text-yellow-400';
      case 'green':
      default: return 'text-primary-fixed-dim';
    }
  };

  // Filter leaderboard display scores for sidebar
  const sidebarScores = useMemo(() => {
    return [...leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [leaderboard]);

  // Main Daily Mission progress
  const dailyMissionProgressPercent = useMemo(() => {
    const mission = challenges.find(c => c.id === 'no_walls');
    if (!mission) return 0;
    return Math.min(100, (mission.current / mission.target) * 100);
  }, [challenges]);

  const dailyMission = useMemo(() => {
    return challenges.find(c => c.id === 'no_walls') || { current: 32, target: 50 };
  }, [challenges]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <header className="w-full sticky top-0 bg-surface shadow-[0_0_20px_rgba(0,255,65,0.15)] z-40 border-b border-outline-variant/30 h-20 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          
          {/* Logo Heading */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center neon-glow-primary">
              <Gamepad2 className="w-5 h-5 text-on-primary-container" />
            </div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-primary-fixed tracking-tight hover:brightness-110 cursor-pointer transition-all">
              NEON SNAKE
            </h1>
          </div>

          {/* Heads Up Display HUD */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* High Score Panel */}
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase">HIGH SCORE</span>
              <span className="font-mono text-base sm:text-lg font-bold text-primary-fixed-dim">
                {highScore.toString().padStart(4, '0')}
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-outline-variant/50" />
            
            {/* Current Score Panel */}
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase">CURRENT</span>
              <span className={`font-mono text-base sm:text-lg font-bold ${getThemeColorClass()}`}>
                {currentScore.toString().padStart(4, '0')}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-outline-variant/50" />

            {/* Menu Buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-lg hover:bg-surface-container-high cursor-pointer"
                title="Leaderboard"
                id="leaderboard-btn"
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
              </button>
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-lg hover:bg-surface-container-high cursor-pointer"
                title="Settings"
                id="settings-btn"
              >
                <Sliders className="w-5 h-5 text-primary" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Layout Block */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 relative">
        
        {/* LEFT SIDEBAR (Desktop: 3 columns, mobile: horizontal row at top) */}
        <aside className="xl:col-span-3 flex flex-col gap-6 w-full">
          
          {/* Pilot Info Badge */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-primary/10">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center">
              <User className="w-6 h-6 text-[#00daf3]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-primary">NEON_PILOT</h3>
              <p className="font-mono text-xs text-on-surface-variant">Rank: <span className="text-secondary font-bold">Pro</span></p>
            </div>
          </div>

          {/* Mode Selector Navigation */}
          <div className="glass-panel p-4 rounded-2xl border-outline-variant/35 flex flex-col gap-2">
            <h4 className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase px-2 mb-1">CHOOSE GAME MODE</h4>
            
            <nav className="flex flex-col gap-1.5">
              {[
                { id: 'classic', label: 'Classic Mode', desc: 'Standard retro mechanics', icon: Gamepad2, activeStyle: 'bg-secondary-container text-white shadow-[0_0_12px_#ff4b89] border-transparent' },
                { id: 'arcade', label: 'Arcade Mode', desc: 'Portals, speed boosters & obstacles', icon: Sparkles, activeStyle: 'bg-[#00daf3]/25 text-[#00daf3] border-[#00daf3]/50 shadow-[0_0_12px_rgba(0,218,243,0.25)]' },
                { id: 'zen', label: 'Zen Mode', desc: 'No death, wrap walls, grow endless', icon: User, activeStyle: 'bg-primary-container/20 text-primary border-primary/40 shadow-[0_0_12px_rgba(0,255,65,0.2)]' },
                { id: 'challenges', label: 'Challenges', desc: 'Level constraints & milestones', icon: Trophy, activeStyle: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.2)]' },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMode(m.id as GameMode);
                      setGameState('ready');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group ${
                      isActive 
                        ? m.activeStyle 
                        : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 text-on-surface'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? '' : 'text-on-surface-variant'}`} />
                    <div className="truncate">
                      <div className="font-display font-bold text-sm tracking-wide">{m.label}</div>
                      <div className="text-[10px] text-on-surface-variant truncate font-mono">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Premium Callout Box */}
          <div className="glass-panel p-5 rounded-2xl border-yellow-400/10 bg-gradient-to-br from-surface-container-low to-surface-container-lowest relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl group-hover:bg-primary-container/10 transition-all duration-500" />
            <h4 className="font-display font-bold text-base text-yellow-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" />
              {premiumUnlocked ? 'PREMIUM ACTIVE' : 'UNLEASH PREMIUM'}
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              {premiumUnlocked 
                ? 'Thank you for upgrading! Enjoy exclusive neon visual skins, high-performance sound drivers and portal access.'
                : 'Unlock customizable neon color sets, triple speed boosters, exclusive synth sound waves, and local customization.'}
            </p>
            <button
              onClick={() => setIsPremiumOpen(true)}
              className="w-full py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold rounded-xl neon-glow-primary hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {premiumUnlocked ? 'VIEW COSMETICS' : 'GO PREMIUM'}
            </button>
          </div>

        </aside>

        {/* CENTRAL GAME ZONE (Desktop: 6 columns) */}
        <main className="xl:col-span-6 flex flex-col items-center justify-center gap-4">
          
          {/* Active Mode Banner */}
          <div className="w-full max-w-[600px] flex justify-between items-center px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                CURRENT MODE: <strong className="text-white">{activeMode}</strong>
              </span>
            </div>
            
            {activeMode === 'challenges' && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-on-surface-variant">SELECT:</span>
                <select 
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value as ChallengeId)}
                  className="bg-surface-container-high border border-outline-variant/50 text-white rounded px-2 py-0.5 text-xs font-mono outline-none"
                >
                  {challenges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Interactive Game Canvas Container */}
          <GameCanvas
            mode={activeMode}
            settings={settings}
            activeChallenge={activeChallenge}
            onScoreChange={handleScoreChange}
            onGameOver={handleGameOver}
            onFruitEaten={(isGolden) => {
              if (isGolden) {
                // Add secondary visual reward/feedback
              }
            }}
            onChallengeProgress={handleChallengeProgress}
            gameState={gameState}
            setGameState={setGameState}
          />

          {/* Controls hints footer */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-on-surface-variant bg-surface-container-lowest/50 py-2 px-4 rounded-full border border-outline-variant/10">
            <span>KEYBOARD: <strong className="text-white">WASD</strong> / <strong className="text-white">ARROWS</strong></span>
            <span className="h-3 w-[1px] bg-outline-variant/20" />
            <span>PAUSE: <strong className="text-white">ESC</strong> / <strong className="text-white">SPACE</strong></span>
          </div>

        </main>

        {/* RIGHT SIDEBAR (Desktop: 3 columns) */}
        <aside className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Top Local Scores Board */}
          <div className="glass-panel p-5 rounded-2xl border-outline-variant/35 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
              <h4 className="font-mono text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                TOP SCORES
              </h4>
              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                className="text-[10px] font-mono text-secondary hover:underline cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-3">
              {sidebarScores.map((score, idx) => (
                <div key={score.id} className="flex justify-between items-center font-mono text-sm border-b border-outline-variant/10 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant">0{idx + 1}.</span>
                    <span className="text-white font-bold truncate max-w-[120px] uppercase">{score.name}</span>
                  </div>
                  <span className="text-secondary font-bold text-right">{score.score.toLocaleString()}</span>
                </div>
              ))}
              {sidebarScores.length === 0 && (
                <div className="text-xs text-on-surface-variant py-2">No high scores yet! Start playing to claim a spot.</div>
              )}
            </div>
          </div>

          {/* Daily Mission Objective Panel */}
          <div className="glass-panel p-5 rounded-2xl border-outline-variant/35 flex flex-col gap-4">
            <h4 className="font-mono text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5 border-b border-outline-variant/30 pb-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              DAILY MISSION
            </h4>
            
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Eat 50 fruits across sessions without hitting walls.
              </p>
              
              {/* Glowing progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tertiary-fixed-dim neon-glow-cyan transition-all duration-500 rounded-full"
                    style={{ width: `${dailyMissionProgressPercent}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                  <span>{dailyMission.isCompleted ? '✓ MISSION ACCOMPLISHED' : 'IN PROGRESS'}</span>
                  <span className="text-tertiary-fixed-dim font-bold">{dailyMission.current} / {dailyMission.target}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge Status Summary (if active) */}
          {activeMode === 'challenges' && activeChallenge && (
            <div className="glass-panel p-5 rounded-2xl border-yellow-400/20 bg-yellow-400/5 flex flex-col gap-3">
              <h5 className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                ACTIVE CHALLENGE
              </h5>
              <div className="space-y-2">
                <h6 className="font-display font-bold text-sm text-white">{activeChallenge.name}</h6>
                <p className="text-xs text-on-surface-variant leading-relaxed">{activeChallenge.description}</p>
                <div className="flex justify-between items-center text-xs font-mono pt-1">
                  <span className="text-on-surface-variant">PROGRESS:</span>
                  <span className="text-yellow-400 font-bold">{activeChallenge.current} / {activeChallenge.target} {activeChallenge.unit}</span>
                </div>
              </div>
            </div>
          )}

        </aside>

      </div>

      {/* 3. Footer Copyright Section */}
      <footer className="w-full bg-surface border-t border-outline-variant/30 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-secondary text-xs uppercase tracking-wider">
            © 2026 RETRO-FUTURE ARCADE
          </span>
          
          <div className="flex gap-6 text-xs text-on-surface-variant font-mono">
            <a href="#privacy" className="hover:text-secondary transition-colors">PRIVACY</a>
            <a href="#terms" className="hover:text-secondary transition-colors">TERMS</a>
            <a href="#support" className="hover:text-secondary transition-colors">SUPPORT</a>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/20">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00ff41]" />
            <span className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">SERVER ONLINE</span>
          </div>
        </div>
      </footer>

      {/* --- POPUPS / MODALS OVERLAYS --- */}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          scores={leaderboard}
          currentMode={activeMode}
          onClose={() => setIsLeaderboardOpen(false)}
          onClear={handleClearLeaderboard}
        />
      )}

      {/* Pilot Name Entry Modal */}
      {showNameEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border-secondary-container/30 space-y-5 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <div className="space-y-1">
              <h3 className="font-headline-md text-2xl tracking-tight text-primary uppercase">NEW HIGH SCORE!</h3>
              <p className="font-mono text-xs text-on-surface-variant">
                You scored <strong className="text-secondary">{pendingScore?.toLocaleString()}</strong> points. Enter your name in the leaderboard rankings!
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="PILOT NAME"
                maxLength={12}
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value.toUpperCase())}
                className="w-full bg-surface-container-low border-2 border-outline-variant focus:border-primary-container outline-none text-white font-mono font-bold text-center py-3 rounded-xl uppercase tracking-widest placeholder:text-on-surface-variant/40"
              />
              <button
                onClick={submitPilotScore}
                disabled={!pilotName.trim()}
                className="w-full py-3.5 bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-on-primary-container font-mono font-bold text-sm rounded-xl neon-glow-primary hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase border-0"
              >
                SUBMIT PILOT NAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrades Modal */}
      {isPremiumOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border-yellow-400/20 space-y-5">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-md text-xl text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-5 h-5" />
                VAPOR_ARCADE PREMIUM
              </h3>
              <button 
                onClick={() => setIsPremiumOpen(false)}
                className="text-on-surface-variant hover:text-white p-1 hover:bg-surface-container-high rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Unlock full pilot integration for Retro Neon Snake. Get immediate premium rewards:
              </p>

              <div className="space-y-2">
                {[
                  'Exclusive Cyber Pink & Laser Cyan snake skins.',
                  'Preloaded leaderboard profile with top honors.',
                  'Hi-fi sound drivers using Web Audio API.',
                  'Interactive touch dynamic controls.',
                  'High frequency neon explosion particles.'
                ].map((perk, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-on-surface">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-on-surface-variant uppercase">PREMIUM BUNDLE</div>
                  <div className="text-lg font-bold text-white font-mono">$0.00 <span className="text-xs text-on-surface-variant line-through font-normal">$4.99</span></div>
                </div>
                <div className="font-mono text-[10px] text-primary bg-primary-container/10 border border-primary-container/30 py-1 px-2.5 rounded">
                  99% OFF SPECIAL
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPremiumUnlocked(true);
                localStorage.setItem('snake-premium', 'true');
                setIsPremiumOpen(false);
                alert('Premium unlocked successfully! Added custom colors and visual enhancers.');
              }}
              className="w-full py-4 bg-yellow-400 text-black font-mono font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase border-0 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
            >
              ACTIVATE FREE PREMIUM UPGRADE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
