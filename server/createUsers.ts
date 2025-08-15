import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function createUserSystem() {
  try {
    // Load project configuration
    if (!fs.existsSync("./config.json")) {
      throw new Error("Project not set up. Please run 'npm run create-project' first.");
    }
    
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    console.log("Using project:", config.name);
    console.log("Project ID:", config.projectId);
    
    // Load the admin keypair
    const adminWalletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    
    const adminKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(adminWalletFile));
    
    // Generate a test user keypair
    const userKeyPair = web3.Keypair.generate();
    
    // Save user keypair for testing
    fs.writeFileSync(
      path.join("./keys/testUser.json"),
      JSON.stringify(Array.from(userKeyPair.secretKey))
    );
    
    console.log("Admin Wallet:", adminKeyPair.publicKey.toString());
    console.log("Test User Wallet:", userKeyPair.publicKey.toString());
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    // Create a test user
    const {
      createNewUserTransaction: txResponse,
    } = await client.createNewUserTransaction({
      wallet: userKeyPair.publicKey.toString(),
      info: {
        name: "Test Player",
        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        bio: "Duck Game Test Player",
      },
      payer: adminKeyPair.publicKey.toString(),
    });
    
    // Send the transaction
    const result = await sendTransactionForTests(client, txResponse, [
      adminKeyPair,
    ]);
    
    console.log("User Creation Transaction:", result.signature);
    
    // Find and verify the user
    const usersArray = await client.findUsers({
      wallets: [userKeyPair.publicKey.toString()],
    });
    
    console.log("Created User:", usersArray);
    
    // Update config with user information
    config.testUser = {
      wallet: userKeyPair.publicKey.toString(),
      name: "Test Player",
      createdAt: new Date().toISOString(),
      transactionSignature: result.signature
    };
    
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    console.log("\n=== USER SYSTEM SETUP COMPLETE ===");
    console.log("Test user created and saved to keys/testUser.json");
    console.log("User wallet:", userKeyPair.publicKey.toString());
    
  } catch (error) {
    console.error("Error creating user system:", error);
    throw error;
  }
}

// Run the setup
createUserSystem()
  .then(() => {
    console.log("\nUser system ready!");
    console.log("Next: Run 'npm run create-profiles' to set up profiles");
  })
  .catch((error) => {
    console.error("User system setup failed:", error);
    process.exit(1);
  });