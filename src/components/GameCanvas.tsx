import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, Position, GameSettings, Challenge, ChallengeId } from '../types';
import { playEatSound, playGoldenEatSound, playGameOverSound, playMoveSound, playStartSound } from '../utils/audio';

interface GameCanvasProps {
  mode: GameMode;
  settings: GameSettings;
  activeChallenge: Challenge | null;
  onScoreChange: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onFruitEaten: (isGolden: boolean) => void;
  onChallengeProgress: (id: ChallengeId, amount: number, setRelative?: boolean) => void;
  gameState: 'ready' | 'playing' | 'gameover' | 'paused';
  setGameState: (state: 'ready' | 'playing' | 'gameover' | 'paused') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  settings,
  activeChallenge,
  onScoreChange,
  onGameOver,
  onFruitEaten,
  onChallengeProgress,
  gameState,
  setGameState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Grid dimensions
  const GRID_SIZE = 20;
  const TILE_COUNT = 30; // 30x30 grid inside a 600x600 coordinate space

  // Game coordinates state
  const [score, setScore] = useState<number>(0);
  const snakeRef = useRef<Position[]>([]);
  const directionRef = useRef<Position>({ x: 0, y: -1 });
  const nextDirectionRef = useRef<Position>({ x: 0, y: -1 });
  
  // Dynamic Game Elements (for Arcade mode)
  const foodRef = useRef<Position>({ x: 5, y: 5 });
  const isGoldenRef = useRef<boolean>(false);
  const obstaclesRef = useRef<Position[]>([]);
  const portalARef = useRef<Position | null>(null);
  const portalBRef = useRef<Position | null>(null);

  // Particles & Animations
  const particlesRef = useRef<Particle[]>([]);
  const runTimeRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // Track state for challenges
  const secondsSurvivedRef = useRef<number>(0);
  const lastSecondTimeRef = useRef<number>(0);

  // Theme configuration helper
  const getThemeColors = useCallback(() => {
    switch (settings.snakeColor) {
      case 'pink':
        return { head: '#ebffe2', body: '#ff4b89', glow: 'rgba(255, 75, 137, 0.7)', border: 'neon-border-pink' };
      case 'cyan':
        return { head: '#ebffe2', body: '#00daf3', glow: 'rgba(0, 218, 243, 0.7)', border: 'neon-border-cyan' };
      case 'yellow':
        return { head: '#ebffe2', body: '#ffdf00', glow: 'rgba(255, 223, 0, 0.7)', border: 'neon-border-yellow' };
      case 'green':
      default:
        return { head: '#ebffe2', body: '#00ff41', glow: 'rgba(0, 255, 65, 0.7)', border: 'neon-border-primary' };
    }
  }, [settings.snakeColor]);

  // Spawn dynamic items safely
  const isOccupied = (pos: Position, checkSnake = true): boolean => {
    if (checkSnake) {
      for (const segment of snakeRef.current) {
        if (segment.x === pos.x && segment.y === pos.y) return true;
      }
    }
    // Check obstacles
    for (const obs of obstaclesRef.current) {
      if (obs.x === pos.x && obs.y === pos.y) return true;
    }
    // Check portals
    if (portalARef.current && portalARef.current.x === pos.x && portalARef.current.y === pos.y) return true;
    if (portalBRef.current && portalBRef.current.x === pos.x && portalBRef.current.y === pos.y) return true;
    
    // Check food
    if (foodRef.current.x === pos.x && foodRef.current.y === pos.y) return true;

    return false;
  };

  const getRandPos = (): Position => {
    return {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
    };
  };

  const spawnFood = () => {
    let newFood = getRandPos();
    let attempts = 0;
    while (isOccupied(newFood) && attempts < 200) {
      newFood = getRandPos();
      attempts++;
    }
    foodRef.current = newFood;
    isGoldenRef.current = Math.random() < 0.12; // 12% golden fruit chance
  };

  const spawnArcadeElements = () => {
    if (mode !== 'arcade') {
      obstaclesRef.current = [];
      portalARef.current = null;
      portalBRef.current = null;
      return;
    }

    // Spawn 3-5 static obstacles
    const obsCount = 3 + Math.floor(Math.random() * 3);
    const obsList: Position[] = [];
    for (let i = 0; i < obsCount; i++) {
      let obsPos = getRandPos();
      let attempts = 0;
      // Keep away from starting middle area
      while ((isOccupied(obsPos, false) || Math.abs(obsPos.x - 15) < 4 && Math.abs(obsPos.y - 15) < 4) && attempts < 100) {
        obsPos = getRandPos();
        attempts++;
      }
      obsList.push(obsPos);
    }
    obstaclesRef.current = obsList;

    // Spawn Portal Pair
    let portalA = getRandPos();
    let attemptsA = 0;
    while ((isOccupied(portalA, false) || Math.abs(portalA.x - 15) < 4) && attemptsA < 100) {
      portalA = getRandPos();
      attemptsA++;
    }
    portalARef.current = portalA;

    let portalB = getRandPos();
    let attemptsB = 0;
    while ((isOccupied(portalB, false) || Math.abs(portalB.x - portalA.x) < 5 || Math.abs(portalB.y - portalA.y) < 5) && attemptsB < 100) {
      portalB = getRandPos();
      attemptsB++;
    }
    portalBRef.current = portalB;
  };

  // Create neon particles on eating food
  const createParticles = (x: number, y: number, color: string) => {
    if (!settings.particleEffects) return;
    const px = x * GRID_SIZE + GRID_SIZE / 2;
    const py = y * GRID_SIZE + GRID_SIZE / 2;
    
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 1,
        life: 20 + Math.random() * 15,
      });
    }
  };

  // Set direction safely (preventing 180 degree turns)
  const changeDirection = (newDir: Position) => {
    const currentDir = directionRef.current;
    // Prevent reverse into self
    if (newDir.x !== 0 && currentDir.x !== 0) return;
    if (newDir.y !== 0 && currentDir.y !== 0) return;
    
    nextDirectionRef.current = newDir;
    playMoveSound();
  };

  // Handle keypresses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        changeDirection({ x: 0, y: -1 });
        e.preventDefault();
      } else if (key === 'arrowdown' || key === 's') {
        changeDirection({ x: 0, y: 1 });
        e.preventDefault();
      } else if (key === 'arrowleft' || key === 'a') {
        changeDirection({ x: -1, y: 0 });
        e.preventDefault();
      } else if (key === 'arrowright' || key === 'd') {
        changeDirection({ x: 1, y: 0 });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, mode]);

  // Restart trigger
  const initGame = useCallback(() => {
    setScore(0);
    onScoreChange(0);
    snakeRef.current = [
      { x: 15, y: 15 },
      { x: 15, y: 16 },
      { x: 15, y: 17 },
    ];
    directionRef.current = { x: 0, y: -1 };
    nextDirectionRef.current = { x: 0, y: -1 };
    particlesRef.current = [];
    secondsSurvivedRef.current = 0;
    lastSecondTimeRef.current = Date.now();
    
    spawnArcadeElements();
    spawnFood();
    setGameState('playing');
    playStartSound();
  }, [mode, onScoreChange, setGameState]);

  // Main rendering logic
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Deep Cyber Background
    ctx.fillStyle = '#0b1326';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Graph Grid if requested
    if (settings.gridVisible) {
      ctx.strokeStyle = 'rgba(59, 75, 110, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= TILE_COUNT; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
      }
    }

    // 3. Draw Portals (Arcade mode)
    if (mode === 'arcade') {
      const drawPortal = (pos: Position | null, color: string, glowColor: string) => {
        if (!pos) return;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        // Portal is an oval ring
        ctx.ellipse(
          pos.x * GRID_SIZE + GRID_SIZE / 2,
          pos.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 - 1,
          GRID_SIZE / 2 - 3,
          Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = '#060e20';
        ctx.beginPath();
        ctx.ellipse(
          pos.x * GRID_SIZE + GRID_SIZE / 2,
          pos.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 4,
          GRID_SIZE / 5,
          Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      };

      drawPortal(portalARef.current, '#ff4b89', '#ff4b89'); // Orange-Pink
      drawPortal(portalBRef.current, '#00daf3', '#00daf3'); // Cyan-Blue
    }

    // 4. Draw Arcade Obstacles (Static red boxes)
    if (mode === 'arcade' && obstaclesRef.current.length > 0) {
      obstaclesRef.current.forEach((obs) => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        // Rounded obstacle block
        ctx.roundRect(
          obs.x * GRID_SIZE + 2,
          obs.y * GRID_SIZE + 2,
          GRID_SIZE - 4,
          GRID_SIZE - 4,
          4
        );
        ctx.fill();
        ctx.stroke();
        
        // Hazard cross lines inside block
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obs.x * GRID_SIZE + 5, obs.y * GRID_SIZE + 5);
        ctx.lineTo(obs.x * GRID_SIZE + GRID_SIZE - 5, obs.y * GRID_SIZE + GRID_SIZE - 5);
        ctx.moveTo(obs.x * GRID_SIZE + GRID_SIZE - 5, obs.y * GRID_SIZE + 5);
        ctx.lineTo(obs.x * GRID_SIZE + 5, obs.y * GRID_SIZE + GRID_SIZE - 5);
        ctx.stroke();
        ctx.restore();
      });
    }

    // 5. Draw Pulsing Neon Fruit
    const food = foodRef.current;
    const isGolden = isGoldenRef.current;
    ctx.save();
    ctx.shadowBlur = isGolden ? 20 : 15;
    ctx.shadowColor = isGolden ? '#ffdf00' : '#ff4b89';
    ctx.fillStyle = isGolden ? '#ffdf00' : '#ff4b89';

    // Soft scale bounce using runtime frame calculations
    const scaleFactor = 1 + Math.sin(runTimeRef.current * 0.12) * 0.1;
    const size = (GRID_SIZE - 5) * scaleFactor;
    const offset = (GRID_SIZE - size) / 2;

    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Golden sheen or apple leaf
    ctx.fillStyle = isGolden ? '#ffffff' : '#00ff41';
    ctx.beginPath();
    ctx.ellipse(
      food.x * GRID_SIZE + GRID_SIZE / 2 + 2,
      food.y * GRID_SIZE + 3,
      2,
      4,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 6. Draw Snake with Glowing Neon Trails
    const theme = getThemeColors();
    const snake = snakeRef.current;

    snake.forEach((part, index) => {
      const isHead = index === 0;
      ctx.save();
      ctx.shadowBlur = isHead ? 16 : 8;
      ctx.shadowColor = theme.body;
      
      // Head uses lighter contrast head theme color
      ctx.fillStyle = isHead ? theme.head : theme.body;

      ctx.beginPath();
      if (isHead) {
        // Rounder head segment
        ctx.roundRect(
          part.x * GRID_SIZE + 1.5,
          part.y * GRID_SIZE + 1.5,
          GRID_SIZE - 3,
          GRID_SIZE - 3,
          5
        );
      } else {
        // Slightly smaller body segments
        ctx.roundRect(
          part.x * GRID_SIZE + 2.5,
          part.y * GRID_SIZE + 2.5,
          GRID_SIZE - 5,
          GRID_SIZE - 5,
          3
        );
      }
      ctx.fill();

      // Draw eyes on the snake head
      if (isHead) {
        ctx.fillStyle = '#060e20';
        ctx.shadowBlur = 0;
        const curDir = directionRef.current;
        
        // Position eye pixels relative to head moving direction
        if (curDir.x === 1) { // Moving Right
          ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 4, 2, 2);
          ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 14, 2, 2);
        } else if (curDir.x === -1) { // Moving Left
          ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 4, 2, 2);
          ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 14, 2, 2);
        } else if (curDir.y === -1) { // Moving Up
          ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 4, 2, 2);
          ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 4, 2, 2);
        } else { // Moving Down
          ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 14, 2, 2);
          ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 14, 2, 2);
        }
      }
      ctx.restore();
    });

    // 7. Draw Vector Burst Particles
    const particles = particlesRef.current;
    particles.forEach((p, idx) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Update positions
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // friction
      p.vy *= 0.95;
      p.alpha = Math.max(0, p.alpha - 0.03);
      p.life--;
    });

    // Remove expired particles
    particlesRef.current = particles.filter((p) => p.life > 0 && p.alpha > 0);
  };

  // Game loop updates
  const updateGame = () => {
    // Make sure we are playing
    if (gameState !== 'playing') return;

    // Apply movement direction updates
    directionRef.current = nextDirectionRef.current;
    const head = {
      x: snakeRef.current[0].x + directionRef.current.x,
      y: snakeRef.current[0].y + directionRef.current.y,
    };

    // Portal Gates Teleport Check (Arcade mode)
    if (mode === 'arcade') {
      const pa = portalARef.current;
      const pb = portalBRef.current;
      if (pa && head.x === pa.x && head.y === pa.y) {
        if (pb) {
          head.x = pb.x;
          head.y = pb.y;
          // Spawn transition burst
          createParticles(pb.x, pb.y, '#00daf3');
          playGoldenEatSound();
        }
      } else if (pb && head.x === pb.x && head.y === pb.y) {
        if (pa) {
          head.x = pa.x;
          head.y = pa.y;
          createParticles(pa.x, pa.y, '#ff4b89');
          playGoldenEatSound();
        }
      }
    }

    // Boundary Collisions Check
    if (mode === 'zen') {
      // Zen mode wraps around borders smoothly!
      if (head.x < 0) head.x = TILE_COUNT - 1;
      if (head.x >= TILE_COUNT) head.x = 0;
      if (head.y < 0) head.y = TILE_COUNT - 1;
      if (head.y >= TILE_COUNT) head.y = 0;
    } else {
      // Classic & Arcade modes fail on wall crashes
      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleGameOver();
        return;
      }
    }

    // Self & Obstacles Collision check
    const currentSnake = snakeRef.current;
    
    // In Zen mode, self collision does not kill!
    if (mode !== 'zen') {
      // Self crash
      for (const seg of currentSnake) {
        if (head.x === seg.x && head.y === seg.y) {
          handleGameOver();
          return;
        }
      }

      // Arcade Obstacles crash
      if (mode === 'arcade') {
        for (const obs of obstaclesRef.current) {
          if (head.x === obs.x && head.y === obs.y) {
            handleGameOver();
            return;
          }
        }
      }
    }

    // Progress snake head insertion
    currentSnake.unshift(head);

    // Fruit Collision Check
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      const isGolden = isGoldenRef.current;
      const points = isGolden ? 300 : 100;
      
      const newScore = score + points;
      setScore(newScore);
      onScoreChange(newScore);
      onFruitEaten(isGolden);

      // Trigger explosions
      const theme = getThemeColors();
      createParticles(food.x, food.y, isGolden ? '#ffdf00' : theme.body);

      if (isGolden) {
        playGoldenEatSound();
        onChallengeProgress('golden_feast', 1);
      } else {
        playEatSound();
      }

      // Progress global objectives
      onChallengeProgress('no_walls', 1);
      if (settings.speedMultiplier >= 1.5) {
        onChallengeProgress('speed_run', 1);
      }

      // Grow to size check
      onChallengeProgress('growth_spurt', currentSnake.length, true);

      // Re-spawn fruit
      spawnFood();
    } else {
      // Remove tail to progress normal movement
      currentSnake.pop();
    }

    // Survive Challenge Check
    if (mode === 'arcade' && Date.now() - lastSecondTimeRef.current >= 1000) {
      secondsSurvivedRef.current += 1;
      lastSecondTimeRef.current = Date.now();
      onChallengeProgress('survivor', 1);
    }
  };

  const handleGameOver = () => {
    setGameState('gameover');
    playGameOverSound();
    onGameOver(score);
  };

  // Main tick thread driving animations & update steps
  useEffect(() => {
    let lastTickTime = 0;
    
    const gameTick = (timestamp: number) => {
      runTimeRef.current += 1;

      // Dynamic Speed Frame Throttle
      // Base tick interval 110ms, throttled or accelerated by settings and size
      const sizeMultiplier = Math.max(0.6, 1 - (snakeRef.current.length * 0.012));
      const baseTickInterval = 115;
      const currentTickInterval = (baseTickInterval / settings.speedMultiplier) * sizeMultiplier;

      const elapsed = timestamp - lastTickTime;
      if (elapsed > currentTickInterval) {
        lastTickTime = timestamp;
        updateGame();
      }

      // Smooth render animations (like particles and food pulse) occur every frame
      render();

      animationFrameId.current = requestAnimationFrame(gameTick);
    };

    if (gameState === 'playing') {
      animationFrameId.current = requestAnimationFrame(gameTick);
    } else {
      // Just render the background, food and snake statically when paused or gameover
      render();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, mode, settings.speedMultiplier, score]);

  // Initial setup trigger
  useEffect(() => {
    snakeRef.current = [
      { x: 15, y: 15 },
      { x: 15, y: 16 },
      { x: 15, y: 17 },
    ];
    render();
  }, [mode]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center">
      {/* Canvas view box */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className={`w-full max-w-[600px] aspect-square rounded-xl bg-surface-container-lowest transition-all duration-300 ${getThemeColors().border}`}
          id="game-canvas"
        />

        {/* Start Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-panel rounded-xl z-10 transition-opacity duration-300" id="start-overlay">
            <div className="text-center space-y-6 px-4">
              <h2 className="font-headline-lg text-4xl sm:text-5xl text-primary tracking-tighter drop-shadow-[0_0_12px_rgba(0,255,65,0.6)] uppercase">
                {mode === 'challenges' && activeChallenge ? activeChallenge.name : 'READY?'}
              </h2>
              <p className="font-label-caps text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                {mode === 'challenges' && activeChallenge 
                  ? activeChallenge.description 
                  : 'USE ARROW KEYS, WASD OR MOBILE TOUCH D-PAD TO NAVIGATE THE GRID.'}
              </p>
              
              <button
                onClick={initGame}
                className="px-10 py-4 bg-primary-container text-on-primary-container font-label-caps text-lg rounded-lg neon-glow-primary hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0 uppercase"
                id="start-btn"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-panel rounded-xl z-20 transition-opacity duration-300" id="game-over-overlay">
            <div className="text-center space-y-5 px-4">
              <h2 className="font-headline-lg text-4xl sm:text-5xl text-secondary-container tracking-tighter drop-shadow-[0_0_12px_rgba(255,75,137,0.6)] uppercase">
                GAME OVER
              </h2>
              
              <div className="py-4 px-8 bg-surface-container-high rounded-xl inline-block border border-secondary/30">
                <p className="font-label-caps text-on-surface-variant text-xs">FINAL SCORE</p>
                <p className="font-mono text-3xl sm:text-4xl text-primary font-bold">{score.toLocaleString()}</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={initGame}
                  className="px-10 py-4 bg-secondary-container text-on-secondary-fixed font-label-caps text-lg rounded-lg neon-glow-secondary hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0 uppercase"
                  id="restart-btn"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-panel rounded-xl z-10">
            <div className="text-center space-y-4">
              <h2 className="font-headline-lg text-4xl text-tertiary-fixed-dim tracking-tighter drop-shadow-[0_0_10px_#00daf3]">GAME PAUSED</h2>
              <p className="font-label-caps text-xs text-on-surface-variant">TAKE A BREATH, PILOT</p>
              <button
                onClick={() => setGameState('playing')}
                className="px-8 py-3 bg-primary-container text-on-primary-container font-label-caps text-sm rounded-lg neon-glow-primary hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase"
              >
                RESUME
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Touch D-PAD for Mobile / Tablet */}
      <div className="mt-6 p-4 w-full max-w-[280px] grid grid-cols-3 gap-2 sm:hidden bg-surface-container-low/50 rounded-2xl border border-outline-variant/30">
        <div />
        <button
          onClick={() => changeDirection({ x: 0, y: -1 })}
          className="p-4 bg-surface-container-high active:bg-primary-container active:text-on-primary-container rounded-xl flex items-center justify-center border border-outline-variant text-primary font-bold text-lg select-none cursor-pointer"
        >
          ▲
        </button>
        <div />
        
        <button
          onClick={() => changeDirection({ x: -1, y: 0 })}
          className="p-4 bg-surface-container-high active:bg-primary-container active:text-on-primary-container rounded-xl flex items-center justify-center border border-outline-variant text-primary font-bold text-lg select-none cursor-pointer"
        >
          ◀
        </button>
        <button
          onClick={() => {
            if (gameState === 'playing') setGameState('paused');
            else if (gameState === 'paused') setGameState('playing');
          }}
          className="p-4 bg-surface-container-highest active:scale-95 rounded-xl flex items-center justify-center border border-outline-variant text-secondary text-xs select-none uppercase font-bold cursor-pointer"
        >
          {gameState === 'playing' ? 'II' : '▶'}
        </button>
        <button
          onClick={() => changeDirection({ x: 1, y: 0 })}
          className="p-4 bg-surface-container-high active:bg-primary-container active:text-on-primary-container rounded-xl flex items-center justify-center border border-outline-variant text-primary font-bold text-lg select-none cursor-pointer"
        >
          ▶
        </button>

        <div />
        <button
          onClick={() => changeDirection({ x: 0, y: 1 })}
          className="p-4 bg-surface-container-high active:bg-primary-container active:text-on-primary-container rounded-xl flex items-center justify-center border border-outline-variant text-primary font-bold text-lg select-none cursor-pointer"
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
};
