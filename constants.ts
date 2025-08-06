
// Use Honeynet for testing with free SOL airdrops
export const HONEYCOMB_RPC_URL = "https://rpc.test.honeycombprotocol.com";
export const HONEYCOMB_API_URL = "https://edge.test.honeycombprotocol.com/";

// Hardcoded Level 1 Layout for the Duck Game
export const LEVEL_1_DATA = {
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
};

// Index for the 'Level 1 Key' badge we will create on-chain
export const KEY_BADGE_INDEX = 0;
