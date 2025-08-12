// Use Honeynet for testing with free SOL airdrops
export const HONEYCOMB_RPC_URL = "https://rpc.test.honeycombprotocol.com";
export const HONEYCOMB_API_URL = "https://edge.test.honeycombprotocol.com/";

// Admin address from environment variable
export const ADMIN_ADDRESS = process.env.VITE_ADMIN_ADDRESS;

// Season 1 Configuration
export const SEASON_1_TIME_LIMIT = 220; // 30 seconds for all 5 levels
export const SEASON_1_LEVELS = 5;

// Level data for Season 1
export const SEASON_1_DATA = {
  // Level 1 - Tutorial level (original level)
  level1: {
    player: { x: 512, y: 576 },
    blocks: [
      { x: 0, y: 640, width: 770, height: 128 },
      { x: 384, y: 192, width: 448, height: 64 },
      { x: 640, y: 384, width: 192, height: 256 },
      { x: 0, y: 0, width: 768, height: 64 },
      { x: 704, y: 64, width: 64, height: 192 },
      { x: -64, y: 384, width: 448, height: 64 },
      { x: -64, y: 448, width: 128, height: 192 },
      { x: -64, y: 64, width: 128, height: 192 },
      { x: 256, y: 192, width: 128, height: 256 },
    ],
    key: { x: 615, y: 118, width: 32, height: 32 },
    door: { x: 128, y: 546, width: 98, height: 94 },
    spikes: [
      { x: 445, y: 235, width: 40, height: 40 },
      { x: 400, y: 235, width: 40, height: 40 },
    ],
    clouds: { x: 0, y: 0, width: 768, height: 192 },
  },

  // Level 2 - Jump Challenge
  level2: {
    player: { x: 50, y: 576 },
    blocks: [
      { x: 0, y: 640, width: 768, height: 128 },
      { x: 0, y: 0, width: 768, height: 64 },
      { x: 128, y: 512, width: 64, height: 64 },
      { x: 256, y: 448, width: 64, height: 64 },
      { x: 384, y: 384, width: 64, height: 64 },
      { x: 512, y: 320, width: 64, height: 64 },
      { x: 640, y: 256, width: 64, height: 64 },
      { x: 576, y: 192, width: 128, height: 64 },
    ],
    key: { x: 615, y: 128, width: 32, height: 32 },
    door: { x: 30, y: 546, width: 98, height: 94 },
    spikes: [
      { x: 200, y: 600, width: 40, height: 40 },
      { x: 330, y: 600, width: 40, height: 40 },
      { x: 460, y: 600, width: 40, height: 40 },
    ],
    clouds: { x: 0, y: 0, width: 768, height: 192 },
  },

  // Level 3 - Spike Maze
  level3: {
    player: { x: 50, y: 576 },
    blocks: [
      { x: 0, y: 640, width: 768, height: 128 },
      { x: 0, y: 0, width: 768, height: 64 },
      { x: 0, y: 64, width: 64, height: 256 },
      { x: 704, y: 64, width: 64, height: 576 },
      { x: 128, y: 320, width: 192, height: 64 },
      { x: 384, y: 192, width: 192, height: 64 },
      { x: 192, y: 448, width: 384, height: 64 },
    ],
    key: { x: 650, y: 550, width: 32, height: 32 },
    door: { x: 30, y: 250, width: 98, height: 94 },
    spikes: [
      { x: 150, y: 280, width: 40, height: 40 },
      { x: 250, y: 280, width: 40, height: 40 },
      { x: 400, y: 152, width: 40, height: 40 },
      { x: 500, y: 152, width: 40, height: 40 },
      { x: 300, y: 408, width: 40, height: 40 },
      { x: 400, y: 408, width: 40, height: 40 },
    ],
    clouds: { x: 0, y: 0, width: 768, height: 192 },
  },

  // Level 4 - Narrow Passages
  level4: {
    player: { x: 50, y: 576 },
    blocks: [
      { x: 0, y: 640, width: 768, height: 128 },
      { x: 0, y: 0, width: 768, height: 64 },
      { x: 0, y: 64, width: 64, height: 576 },
      { x: 704, y: 64, width: 64, height: 576 },
      { x: 128, y: 64, width: 64, height: 192 },
      { x: 256, y: 256, width: 64, height: 192 },
      { x: 384, y: 64, width: 64, height: 192 },
      { x: 512, y: 256, width: 64, height: 192 },
      { x: 576, y: 64, width: 64, height: 192 },
    ],
    key: { x: 650, y: 550, width: 32, height: 32 },
    door: { x: 30, y: 546, width: 98, height: 94 },
    spikes: [
      { x: 128, y: 216, width: 40, height: 40 },
      { x: 256, y: 216, width: 40, height: 40 },
      { x: 384, y: 216, width: 40, height: 40 },
      { x: 512, y: 216, width: 40, height: 40 },
      { x: 576, y: 216, width: 40, height: 40 },
    ],
    clouds: { x: 0, y: 0, width: 768, height: 192 },
  },

  // Level 5 - Final Boss Arena
  // level5: {
  //   player: { x: 384, y: 576 },
  //   blocks: [
  //     { x: 0, y: 640, width: 768, height: 128 },
  //     { x: 0, y: 0, width: 768, height: 64 },
  //     { x: 0, y: 64, width: 64, height: 576 },
  //     { x: 704, y: 64, width: 64, height: 576 },
  //     { x: 64, y: 384, width: 128, height: 64 },
  //     { x: 576, y: 384, width: 128, height: 64 },
  //     { x: 256, y: 256, width: 256, height: 64 },
  //   ],
  //   key: { x: 374, y: 192, width: 32, height: 32 },
  //   door: { x: 335, y: 546, width: 98, height: 94 },
  //   spikes: [
  //     { x: 100, y: 344, width: 40, height: 40 },
  //     { x: 150, y: 344, width: 40, height: 40 },
  //     { x: 618, y: 344, width: 40, height: 40 },
  //     { x: 668, y: 344, width: 40, height: 40 },
  //     { x: 200, y: 600, width: 40, height: 40 },
  //     { x: 280, y: 600, width: 40, height: 40 },
  //     { x: 440, y: 600, width: 40, height: 40 },
  //     { x: 520, y: 600, width: 40, height: 40 },
  //   ],
  //   clouds: { x: 0, y: 0, width: 768, height: 192 },
  // },

  level5: {
    player: { x: 512, y: 576 },
    blocks: [
      { x: 0, y: 640, width: 770, height: 128 },
      { x: 384, y: 192, width: 448, height: 64 },
      { x: 640, y: 384, width: 192, height: 256 },
      { x: 0, y: 0, width: 768, height: 64 },
      { x: 704, y: 64, width: 64, height: 192 },
      { x: -64, y: 384, width: 448, height: 64 },
      { x: -64, y: 448, width: 128, height: 192 },
      { x: -64, y: 64, width: 128, height: 192 },
      { x: 256, y: 192, width: 128, height: 356 },
    ],
    key: { x: 615, y: 118, width: 32, height: 32 },
    door: { x: 128, y: 546, width: 98, height: 94 },
    spikes: [
      { x: 445, y: 235, width: 40, height: 40 },
      { x: 400, y: 235, width: 40, height: 40 },
    ],
    clouds: { x: 0, y: 0, width: 768, height: 192 },
  },

};

// Index for the 'Level 1 Key' badge we will create on-chain (DISABLED)
export const KEY_BADGE_INDEX = 0;