import * as web3 from "@solana/web3.js";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runCompleteSetup() {
  console.log("🦆 Duck Game Honeycomb Setup");
  console.log("============================");
  
  try {
    // Check if admin key exists
    if (!fs.existsSync("./keys/admin.json")) {
      throw new Error("Admin key not found at ./keys/admin.json. Please ensure the admin key is in place.");
    }
    
    // Load and display admin info
    const adminWalletFile = JSON.parse(fs.readFileSync("./keys/admin.json", "utf8"));
    const adminKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(adminWalletFile));
    
    console.log("Admin Authority:", adminKeyPair.publicKey.toString());
    console.log("");
    
    // Run each setup step
    console.log("Step 1: Creating new project...");
    await execAsync("npm run create-project");
    
    console.log("\nStep 2: Setting up user system...");
    await execAsync("npm run create-users");
    
    console.log("\nStep 3: Setting up profile system...");
    await execAsync("npm run create-profiles");
    
    console.log("\nStep 4: Setting up resource system...");
    await execAsync("npm run create-resources");
    
    console.log("\n🎉 COMPLETE SETUP FINISHED!");
    console.log("============================");
    
    // Display final configuration
    if (fs.existsSync("./config.json")) {
      const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
      console.log("\nFinal Configuration:");
      console.log("- Project ID:", config.projectId);
      console.log("- Project Name:", config.name);
      console.log("- Authority:", config.authority);
      console.log("- Test User:", config.testUser?.wallet || "Not created");
      console.log("- Config file: ./config.json");
      
      console.log("\nNext Steps:");
      console.log("1. Run 'npm run authenticate' to get access tokens");
      console.log("2. Use the project ID in your game client");
      console.log("3. Integrate with your game's user management");
      console.log("4. Set up resource minting/burning as needed");
    }
    
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log("- Ensure ./keys/admin.json exists and contains a valid keypair");
    console.log("- Check your internet connection");
    console.log("- Verify the Honeycomb testnet is accessible");
    process.exit(1);
  }
}

// Run complete setup
runCompleteSetup();