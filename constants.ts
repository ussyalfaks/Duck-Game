
// Use Honeynet for testing with free SOL airdrops
export const HONEYCOMB_RPC_URL = "https://rpc.test.honeycombprotocol.com";
export const HONEYCOMB_API_URL = "https://edge.test.honeycombprotocol.com/";

// Hardcoded Level 1 Layout for the Duck Game
export const LEVEL_1_DATA = {
  player: { x: 100, y: 576 },
  blocks: [
    { x: 0, y: 640, width: 768, height: 128 },
    { x: 384, y: 480, width: 256, height: 32 },
    { x: 128, y: 350, width: 192, height: 32 },
    { x: 600, y: 250, width: 168, height: 32 },
    { x: 0, y: 150, width: 200, height: 32 },
  ],
  key: { x: 660, y: 200, width: 48, height: 48 },
  door: { x: 64, y: 86, width: 98, height: 94 },
  spikes: [
    { x: 400, y: 440, width: 40, height: 40 },
    { x: 440, y: 440, width: 40, height: 40 },
    { x: 480, y: 440, width: 40, height: 40 },
  ],
  clouds: { x: 0, y: 0, width: 768, height: 192 },
};

// Index for the 'Level 1 Key' badge we will create on-chain
export const KEY_BADGE_INDEX = 0;
