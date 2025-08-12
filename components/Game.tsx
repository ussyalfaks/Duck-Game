import React, { useRef, useEffect, useState } from 'react';
import Matter from 'matter-js';
import { ASSETS } from '../game/assets';
import { SEASON_1_DATA, SEASON_1_TIME_LIMIT } from '../constants';

interface GameProps {
  onKeyCollect: () => Promise<void>;
  isKeyCollected: boolean;
  onPlayerDeath: () => void;
  onSeasonComplete: () => void;
}

const DUCK_WALK_FRAMES = [
  ASSETS.DUCK_WALK_0,
  ASSETS.DUCK_WALK_1,
  ASSETS.DUCK_WALK_2,
  ASSETS.DUCK_WALK_3,
];

export const Game: React.FC<GameProps> = ({ 
  onKeyCollect, 
  isKeyCollected, 
  onPlayerDeath, 
  onSeasonComplete 
}) => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const playerRef = useRef<Matter.Body | null>(null);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerPosition, setPlayerPosition] = useState({ 
    x: SEASON_1_DATA.level1.player.x, 
    y: SEASON_1_DATA.level1.player.y 
  });
  const [levelWin, setLevelWin] = useState(false);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SEASON_1_TIME_LIMIT);
  const [localKeyCollected, setLocalKeyCollected] = useState(false);
  const [duckFrame, setDuckFrame] = useState(0);
  const [hearts, setHearts] = useState(3); // Hearts state
  const [isInvincible, setIsInvincible] = useState(false); // Invincibility frames
  
  const keysRef = useRef({ left: false, right: false, up: false });
  const canJumpRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current level data
  const getCurrentLevelData = () => {
    const levelKey = `level${currentLevel}` as keyof typeof SEASON_1_DATA;
    return SEASON_1_DATA[levelKey];
  };

  // Reset level function
  const resetLevel = () => {
    console.log(`Resetting level ${currentLevel}...`);
    const currentLevelData = getCurrentLevelData();
    
    // Reset player position
    if (playerRef.current) {
      Matter.Body.setPosition(playerRef.current, { 
        x: currentLevelData.player.x, 
        y: currentLevelData.player.y 
      });
      Matter.Body.setVelocity(playerRef.current, { x: 0, y: 0 });
    }
    
    setPlayerPosition({ 
      x: currentLevelData.player.x, 
      y: currentLevelData.player.y 
    });
    setLocalKeyCollected(false);
    setLevelWin(false);
    
    // Start invincibility frames for 2 seconds
    setIsInvincible(true);
    setTimeout(() => setIsInvincible(false), 2000);
  };

  // Reset season function
  const resetSeason = () => {
    console.log('Resetting entire season...');
    setCurrentLevel(1);
    setHearts(3);
    setTimeLeft(SEASON_1_TIME_LIMIT);
    setSeasonComplete(false);
    setGameOver(false);
    setLevelWin(false);
    setLocalKeyCollected(false);
    setIsInvincible(false);
    
    // Setup level 1
    setupLevel(1);
    
    // Reset player position to level 1
    const level1Data = SEASON_1_DATA.level1;
    setPlayerPosition({ x: level1Data.player.x, y: level1Data.player.y });
  };

  // Handle spike collision
  const handleSpikeHit = () => {
    if (isInvincible) return; // Don't take damage during invincibility frames
    
    const newHearts = hearts - 1;
    setHearts(newHearts);
    
    if (newHearts <= 0) {
      // No hearts left, reset the entire season
      setGameOver(true);
      setTimeout(() => {
        resetSeason();
      }, 2000);
    } else {
      // Still have hearts, just reset the current level
      resetLevel();
    }
  };

  // Timer effect
  useEffect(() => {
    if (seasonComplete || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setTimeout(() => {
            resetSeason();
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [seasonComplete, gameOver, currentLevel]);

  // Level progression effect
  useEffect(() => {
    if (levelWin && !seasonComplete) {
      const timer = setTimeout(() => {
        if (currentLevel < 5) {
          // Move to next level
          setCurrentLevel(prev => prev + 1);
          setLevelWin(false);
          setLocalKeyCollected(false);
          
          // Reset player position for new level
          const nextLevelData = SEASON_1_DATA[`level${currentLevel + 1}` as keyof typeof SEASON_1_DATA];
          setPlayerPosition({ x: nextLevelData.player.x, y: nextLevelData.player.y });
          
          // Reset Matter.js world for new level
          setupLevel(currentLevel + 1);
        } else {
          // Season complete!
          setSeasonComplete(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          onSeasonComplete();
        }
      }, 2000); // 2 second delay between levels

      return () => clearTimeout(timer);
    }
  }, [levelWin, currentLevel, seasonComplete, onSeasonComplete]);

  // Setup level function
  const setupLevel = (level: number) => {
    const engine = engineRef.current;
    const world = engine.world;

    // Clear existing world
    Matter.World.clear(world, false);

    // Get level data
    const levelData = SEASON_1_DATA[`level${level}` as keyof typeof SEASON_1_DATA];

    // Create blocks for this level
    const blockBodies = levelData.blocks.map(block =>
      Matter.Bodies.rectangle(
        block.x + block.width / 2,
        block.y + block.height / 2,
        block.width,
        block.height,
        { isStatic: true, render: { visible: false } }
      )
    );

    // Create player
    const player = Matter.Bodies.rectangle(
      levelData.player.x,
      levelData.player.y,
      50, 60, // player dimensions
      { 
        label: 'player', 
        restitution: 0.1, 
        friction: 0.01,
        inertia: Infinity, // prevent rotation
      }
    );
    playerRef.current = player;

    // Add bodies to world
    Matter.World.add(world, [...blockBodies, player]);

    // Reset player position state
    setPlayerPosition({ x: levelData.player.x, y: levelData.player.y });
  };

  // Game setup effect
  useEffect(() => {
    const engine = engineRef.current;
    engine.gravity.y = 1.5;

    // Setup initial level
    setupLevel(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frameCount = 0;
    const update = () => {
      if (!playerRef.current || gameOver || seasonComplete) return;

      // Player movement
      const velocity = playerRef.current.velocity;
      if (keysRef.current.left) {
        Matter.Body.setVelocity(playerRef.current, { x: -3.5, y: velocity.y });
      } else if (keysRef.current.right) {
        Matter.Body.setVelocity(playerRef.current, { x: 3.5, y: velocity.y });
      }
      
      // Animation
      const isMoving = keysRef.current.left || keysRef.current.right;
      if(isMoving && frameCount % 6 === 0) setDuckFrame(f => (f + 1) % DUCK_WALK_FRAMES.length);
      else if (!isMoving) setDuckFrame(0);

      // Ground detection for jumping
      const currentLevelData = getCurrentLevelData();
      const blockBodies = currentLevelData.blocks.map(block =>
        Matter.Bodies.rectangle(
          block.x + block.width / 2,
          block.y + block.height / 2,
          block.width,
          block.height,
          { isStatic: true }
        )
      );
      
      const collisions = Matter.Query.collides(playerRef.current, blockBodies);
      const onGround = collisions.length > 0;
      if(onGround) canJumpRef.current = true;

      if (keysRef.current.up && canJumpRef.current) {
        Matter.Body.setVelocity(playerRef.current, { x: velocity.x, y: -20 });
        canJumpRef.current = false;
      }
      
      Matter.Engine.update(engine, 1000 / 60);

      // Update React state for rendering
      setPlayerPosition({ x: playerRef.current.position.x, y: playerRef.current.position.y });
      
      // Screen wrapping
      if (playerRef.current.position.x > 768 + 25) Matter.Body.setPosition(playerRef.current, {x: -25, y: playerRef.current.position.y});
      if (playerRef.current.position.x < -25) Matter.Body.setPosition(playerRef.current, {x: 768 + 25, y: playerRef.current.position.y});

      frameCount++;
      requestAnimationFrame(update);
    };
    update();

    return () => {
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, seasonComplete]);

  // Collision detection effect
  useEffect(() => {
    if (gameOver || seasonComplete) return;

    const playerBox = { x: playerPosition.x - 25, y: playerPosition.y - 30, w: 50, h: 60 };
    const currentLevelData = getCurrentLevelData();

    // Key collision
    if (!localKeyCollected && !levelWin) {
      const keyBox = { x: currentLevelData.key.x, y: currentLevelData.key.y, w: currentLevelData.key.width, h: currentLevelData.key.height };
      if (playerBox.x < keyBox.x + keyBox.w && playerBox.x + playerBox.w > keyBox.x &&
          playerBox.y < keyBox.y + keyBox.h && playerBox.y + playerBox.h > keyBox.y) {
        setLocalKeyCollected(true);
        // DISABLED: No badge claiming
        // onKeyCollect();
      }
    }

    // Door collision
    if (localKeyCollected && !levelWin) {
      const doorBox = { x: currentLevelData.door.x, y: currentLevelData.door.y, w: currentLevelData.door.width, h: currentLevelData.door.height };
       if (playerBox.x < doorBox.x + doorBox.w && playerBox.x + playerBox.w > doorBox.x &&
          playerBox.y < doorBox.y + doorBox.h && playerBox.y + playerBox.h > doorBox.y) {
        setLevelWin(true);
      }
    }

    // Spike collision (only if not invincible)
    if (!isInvincible) {
      for (const spike of currentLevelData.spikes) {
        const spikeBox = { x: spike.x, y: spike.y, w: spike.width, h: spike.height };
        if (playerBox.x < spikeBox.x + spikeBox.w && playerBox.x + playerBox.w > spikeBox.x &&
            playerBox.y < spikeBox.y + spikeBox.h && playerBox.y + playerBox.h > spikeBox.y) {
          handleSpikeHit();
          break;
        }
      }
    }
  }, [playerPosition, localKeyCollected, levelWin, gameOver, seasonComplete, isInvincible, hearts]);

  const currentLevelData = getCurrentLevelData();
  
  return (
    <div
      ref={gameAreaRef}
      className="w-full lg:w-2/3 h-[768px] bg-sky-300 relative overflow-hidden rounded-lg border-4 border-brand-primary"
    >
      {/* Timer Display */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg font-bold text-lg z-10">
        Time: {timeLeft}s
      </div>

      {/* Level Display */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg font-bold text-lg z-10">
        Level {currentLevel}/5
      </div>

      {/* Hearts Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 px-4 py-2 rounded-lg z-10 flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <img
            key={i}
            src={ASSETS.HEART}
            alt="Heart"
            className={`w-6 h-6 ${i < hearts ? 'opacity-100' : 'opacity-30'} ${isInvincible && i === hearts - 1 ? 'animate-pulse' : ''}`}
          />
        ))}
      </div>

      <img src={ASSETS.CLOUDS} alt="Clouds" className="absolute top-0 left-0 w-full h-auto opacity-70" />
      
      {currentLevelData.blocks.map((block, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: block.x, top: block.y, width: block.width, height: block.height,
          backgroundImage: `url(${ASSETS.TILESET})`,
          backgroundSize: '64px 64px'
        }}/>
      ))}
      
      {!localKeyCollected && <img src={ASSETS.KEY} alt="Key" className="absolute" style={{ left: currentLevelData.key.x, top: currentLevelData.key.y, width: currentLevelData.key.width, height: currentLevelData.key.height }} />}
      
      <img src={localKeyCollected ? ASSETS.DOOR_UNLOCKED : ASSETS.DOOR_LOCKED} alt="Door" className="absolute" style={{ left: currentLevelData.door.x, top: currentLevelData.door.y, width: currentLevelData.door.width, height: currentLevelData.door.height }} />
      
      {currentLevelData.spikes.map((spike, i) => <img key={i} src={ASSETS.SPIKE} alt="Spike" className="absolute" style={{ left: spike.x, top: spike.y, width: spike.width, height: spike.height }} />)}
      
      {/* Player with invincibility visual effect */}
      <img 
        src={DUCK_WALK_FRAMES[duckFrame]} 
        alt="Player" 
        className={`absolute ${isInvincible ? 'animate-pulse opacity-60' : ''}`} 
        style={{ 
          left: playerPosition.x - 32, 
          top: playerPosition.y - 32, 
          width: 64, 
          height: 64, 
          transform: keysRef.current.left ? 'scaleX(-1)' : 'scaleX(1)' 
        }}
      />
      
      {/* Level Complete Modal */}
      {levelWin && !seasonComplete && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white text-gray-800 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-3xl font-bold mb-4">🎉 Level {currentLevel} Complete! 🎉</h2>
            <p className="mb-4">Moving to Level {currentLevel + 1}...</p>
            <div className="animate-spin h-8 w-8 border-4 border-brand-secondary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      )}

      {/* Season Complete Modal */}
      {seasonComplete && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white text-gray-800 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-4xl font-bold mb-4">🎊 Season 1 Complete! 🎊</h2>
            <p className="mb-2">Congratulations! You've completed all 5 levels!</p>
            <p className="mb-6 text-lg font-semibold">Final Time: {SEASON_1_TIME_LIMIT - timeLeft}s</p>
            <div className="space-x-4">
              <button onClick={resetSeason} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded">Play Again</button>
              <button onClick={() => window.location.reload()} className="bg-brand-primary text-white font-bold py-2 px-6 rounded">Go Home</button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-red-800 text-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-4xl font-bold mb-4">{hearts <= 0 ? '💔 No Hearts Left!' : '⏰ Time\'s Up!'}</h2>
            <p className="mb-2">{hearts <= 0 ? 'You lost all your hearts!' : 'You ran out of time!'}</p>
            <p className="mb-6">You reached Level {currentLevel} out of 5</p>
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Restarting season...</p>
          </div>
        </div>
      )}
    </div>
  );
};