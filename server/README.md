# Duck Game Honeycomb Server Setup

## 🚨 Important: Setup Scripts Only

**This is NOT a traditional game server.** These scripts are **one-time setup tools** that create your Honeycomb project and configure blockchain resources. The actual game is **100% client-side** and connects directly to the blockchain.

### What This Server Does:
- ✅ **Creates** your Honeycomb project on-chain 
- ✅ **Configures** game resources (XP, badges, etc.)
- ✅ **Generates** configuration files for the client
- ✅ **Initializes** the blockchain foundation

### What This Server Does NOT Do:
- ❌ **Store player data** (all data lives on blockchain)
- ❌ **Handle gameplay** (client connects directly to Solana)
- ❌ **Manage user sessions** (wallet-based authentication)
- ❌ **Process game logic** (happens client-side)

**After setup, the game operates without any backend server dependency.**

---

This server-side implementation creates a new Honeycomb project with your own authority and sets up all necessary resources for the Duck Game.

## Prerequisites

1. **Admin Key**: Your admin private key should be in `./keys/admin.json`
2. **Dependencies**: Run `npm install` to install all required packages
3. **Network Access**: Ensure you can access the Honeycomb testnet
4. **⚠️ Testnet SOL**: Your admin wallet needs SOL for setup transactions

### 💰 Getting Testnet SOL for Setup

**Critical:** The admin wallet must have testnet SOL to create the Honeycomb project and set up resources. Without SOL, all setup operations will fail.

#### Get SOL for Your Admin Wallet:
```bash
# Replace with your admin wallet address from keys/admin.json
solana airdrop 3 <YOUR_ADMIN_WALLET_ADDRESS> -u https://rpc.test.honeycombprotocol.com
```

#### Finding Your Admin Wallet Address:
1. **Check your `keys/admin.json`** file
2. **Extract the public key** from the keypair
3. **Or use Solana CLI:**
   ```bash
   solana-keygen pubkey ./keys/admin.json
   ```

#### Alternative Faucets:
- [Official Solana Faucet](https://faucet.solana.com/) - Select "Devnet"
- [QuickNode Faucet](https://faucet.quicknode.com/solana/devnet)

**⚠️ Setup will fail without SOL for:**
- Creating the Honeycomb project
- Setting up resource definitions  
- Configuring badge systems
- All blockchain transactions

## Quick Start

### Option 1: Complete Setup (Recommended)
```bash
npm install
npm run setup
```
This runs the complete setup process automatically.

### Option 2: Step-by-Step Setup
```bash
npm install

# Step 1: Create new project
npm run create-project

# Step 2: Set up user system
npm run create-users

# Step 3: Set up profile system
npm run create-profiles

# Step 4: Set up resource/XP/achievement system
npm run create-resources

# Step 5: Authenticate a user (optional)
npm run authenticate
```

## What Gets Created

### 1. Project Setup
- **New Project ID**: Under your authority
- **Admin Authority**: Your admin wallet controls the project
- **Configuration**: Saved to `config.json`

### 2. User System
- **Test User**: A sample user account for testing
- **User Keys**: Saved to `keys/testUser.json`
- **User Management**: Framework for creating and managing users

### 3. Profile System
- **Profile Structure**: Template for player profiles
- **Metadata**: Profile information structure

### 4. Resource System
- **Experience Points (XP)**: Point system for gameplay
- **Achievement Badges**: Special milestone rewards
- **Duck Coins**: In-game currency
- **Power-up Items**: Consumable boost items
- **Level System**: 6 progression levels
- **Badge Types**: 5 different achievement badges

### 5. Authentication
- **Access Tokens**: For authenticated API calls
- **Message Signing**: Secure user authentication
- **Auth Storage**: Credentials saved to `auth.json`

## Generated Files

After setup, you'll have:
- `config.json` - Complete project configuration
- `keys/testUser.json` - Test user keypair
- `auth.json` - Authentication tokens (after running authenticate)

## Configuration Details

The `config.json` file contains:
```json
{
  "projectId": "Your-New-Project-ID",
  "authority": "Your-Admin-Wallet-Address",
  "name": "Duck Game Project",
  "testUser": { ... },
  "profiles": { ... },
  "resources": { ... }
}
```

## Using in Your Game

After setup, the generated `config.json` contains everything your **client-side game** needs:

1. **Project ID**: Use `config.projectId` for direct blockchain interactions
2. **Resource Addresses**: XP, badge, and other resource addresses for minting/burning
3. **Authority**: Your admin wallet address for administrative operations
4. **Configuration**: All necessary IDs and addresses for Honeycomb integration

**The client game uses this configuration to connect directly to Honeycomb/Solana - no server required.**

## Troubleshooting

- **"Admin key not found"**: Ensure `keys/admin.json` exists
- **"Insufficient funds"**: Your admin wallet needs testnet SOL - use the faucet above
- **"Project not set up"**: Run `npm run create-project` first  
- **"Transaction failed"**: Check your admin wallet has enough SOL for gas fees
- **Network errors**: Check Honeycomb testnet connectivity
- **Permission errors**: Verify your admin key has sufficient SOL (at least 1-2 SOL recommended)

## API Endpoints

The setup uses Honeycomb's testnet:
- **Edge API**: `https://edge.test.honeycombprotocol.com/`
- **RPC**: `https://rpc.test.honeycombprotocol.com/`
- **Explorer**: `https://explorer.solana.com/` (with custom RPC)

## Next Steps

After setup:
1. **Copy `config.json`** to your client application's constants
2. **Use Project ID** in your client's Honeycomb integration
3. **Configure Resource Addresses** for XP, badges, and other resources
4. **Test Direct Blockchain Connection** from your client
5. **Deploy Client** - no server deployment needed!

Your Duck Game now has its own Honeycomb project under your complete control!

## 🔄 Client-Blockchain Architecture

```
Setup Scripts (One-Time)     Client Game (Runtime)
┌─────────────────┐         ┌─────────────────┐
│  Server Setup   │ ──────▶ │   React App     │
│  (This Folder)  │  config │ (Main Game)     │
└─────────────────┘   .json └─────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Honeycomb API   │         │ Honeycomb API   │
│ (Project Create)│         │ (Game Runtime)  │ 
└─────────────────┘         └─────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Solana Network  │ ◀──────▶│ Solana Network  │
│ (Setup Data)    │         │ (Live Gameplay) │
└─────────────────┘         └─────────────────┘
```

**The setup scripts create the foundation, then the client takes over completely.**