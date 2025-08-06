
import React, { useRef, useEffect, useState } from 'react';
import Matter from 'matter-js';
import { ASSETS } from '../game/assets';
import { LEVEL_1_DATA } from '../constants';

interface GameProps {
  onKeyCollect: () => Promise<void>;
  isKeyCollected: boolean;
  onPlayerDeath: () => void;
}

const DUCK_WALK_FRAMES = [
  ASSETS.DUCK_WALK_0,
  ASSETS.DUCK_WALK_1,
  ASSETS.DUCK_WALK_2,
  ASSETS.DUCK_WALK_3,
];

export const Game: React.FC<GameProps> = ({ onKeyCollect, isKeyCollected, onPlayerDeath }) => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const playerRef = useRef<Matter.Body | null>(null);

  const [playerPosition, setPlayerPosition] = useState({ x: LEVEL_1_DATA.player.x, y: LEVEL_1_DATA.player.y });
  const [win, setWin] = useState(false);
  const [localKeyCollected, setLocalKeyCollected] = useState(false);
  const [duckFrame, setDuckFrame] = useState(0);
  const keysRef = useRef({ left: false, right: false, up: false });
  const canJumpRef = useRef(true);

  // Game setup effect
  useEffect(() => {
    const engine = engineRef.current;
    const world = engine.world;
    engine.gravity.y = 1.5;

    const blockBodies = LEVEL_1_DATA.blocks.map(block =>
      Matter.Bodies.rectangle(
        block.x + block.width / 2,
        block.y + block.height / 2,
        block.width,
        block.height,
        { isStatic: true, render: { visible: false } }
      )
    );

    const player = Matter.Bodies.rectangle(
      LEVEL_1_DATA.player.x,
      LEVEL_1_DATA.player.y,
      50, 60, // player dimensions
      { 
        label: 'player', 
        restitution: 0.1, 
        friction: 0.01,
        inertia: Infinity, // prevent rotation
      }
    );
    playerRef.current = player;
    Matter.World.add(world, [...blockBodies, player]);

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
      if (!playerRef.current) return;

      // Player movement
      const velocity = playerRef.current.velocity;
      if (keysRef.current.left) {
        Matter.Body.setVelocity(playerRef.current, { x: -3.5, y: velocity.y });
      } else if (keysRef.current.right) {
        Matter.Body.setVelocity(playerRef.current, { x: 3.5, y: velocity.y });
      }
      
      // Jumping
      const isMoving = keysRef.current.left || keysRef.current.right;
      if(isMoving && frameCount % 6 === 0) setDuckFrame(f => (f + 1) % DUCK_WALK_FRAMES.length);
      else if (!isMoving) setDuckFrame(0);

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
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Collision detection effect
  useEffect(() => {
    const playerBox = { x: playerPosition.x - 25, y: playerPosition.y - 30, w: 50, h: 60 };

    // Key collision
    if (!localKeyCollected && !isKeyCollected) {
      const keyBox = { x: LEVEL_1_DATA.key.x, y: LEVEL_1_DATA.key.y, w: LEVEL_1_DATA.key.width, h: LEVEL_1_DATA.key.height };
      if (playerBox.x < keyBox.x + keyBox.w && playerBox.x + playerBox.w > keyBox.x &&
          playerBox.y < keyBox.y + keyBox.h && playerBox.y + playerBox.h > keyBox.y) {
        setLocalKeyCollected(true); // Prevent re-triggering while tx is pending
        onKeyCollect();
      }
    }

    // Door collision
    if (isKeyCollected && !win) {
      const doorBox = { x: LEVEL_1_DATA.door.x, y: LEVEL_1_DATA.door.y, w: LEVEL_1_DATA.door.width, h: LEVEL_1_DATA.door.height };
       if (playerBox.x < doorBox.x + doorBox.w && playerBox.x + playerBox.w > doorBox.x &&
          playerBox.y < doorBox.y + doorBox.h && playerBox.y + playerBox.h > doorBox.y) {
        setWin(true);
      }
    }

    // Spike collision
    for (const spike of LEVEL_1_DATA.spikes) {
      const spikeBox = { x: spike.x, y: spike.y, w: spike.width, h: spike.height };
      if (playerBox.x < spikeBox.x + spikeBox.w && playerBox.x + playerBox.w > spikeBox.x &&
          playerBox.y < spikeBox.y + spikeBox.h && playerBox.y + playerBox.h > spikeBox.y) {
        onPlayerDeath();
        break;
      }
    }
  }, [playerPosition, isKeyCollected, localKeyCollected, win, onKeyCollect, onPlayerDeath]);
  
  return (
    <div
      ref={gameAreaRef}
      className="w-full lg:w-2/3 h-[768px] bg-sky-300 relative overflow-hidden rounded-lg border-4 border-brand-primary"
    >
      <img src={ASSETS.CLOUDS} alt="Clouds" className="absolute top-0 left-0 w-full h-auto opacity-70" />
      
      {LEVEL_1_DATA.blocks.map((block, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: block.x, top: block.y, width: block.width, height: block.height,
          backgroundImage: `url(${ASSETS.TILESET})`,
          backgroundSize: '64px 64px'
        }}/>
      ))}
      
      {!(isKeyCollected || localKeyCollected) && <img src={ASSETS.KEY} alt="Key" className="absolute" style={{ left: LEVEL_1_DATA.key.x, top: LEVEL_1_DATA.key.y, width: LEVEL_1_DATA.key.width, height: LEVEL_1_DATA.key.height }} />}
      
      <img src={isKeyCollected ? ASSETS.DOOR_UNLOCKED : ASSETS.DOOR_LOCKED} alt="Door" className="absolute" style={{ left: LEVEL_1_DATA.door.x, top: LEVEL_1_DATA.door.y, width: LEVEL_1_DATA.door.width, height: LEVEL_1_DATA.door.height }} />
      
      {LEVEL_1_DATA.spikes.map((spike, i) => <img key={i} src={ASSETS.SPIKE} alt="Spike" className="absolute" style={{ left: spike.x, top: spike.y, width: spike.width, height: spike.height }} />)}
      
      <img src={DUCK_WALK_FRAMES[duckFrame]} alt="Player" className="absolute" style={{ left: playerPosition.x - 32, top: playerPosition.y - 32, width: 64, height: 64, transform: keysRef.current.left ? 'scaleX(-1)' : 'scaleX(1)' }}/>
      
      {win && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-gray-800 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-4xl font-bold mb-4">🎉 You Win! 🎉</h2>
            <p className="mb-6">You've unlocked the door and completed the level!</p>
            <button onClick={onPlayerDeath} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded">Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};
