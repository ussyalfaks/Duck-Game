import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function createProfileSystem() {
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
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    console.log("Creating profiles tree for project:", config.projectId);
    console.log("Admin authority:", adminKeyPair.publicKey.toString());
    
    // Create the profiles tree transaction
    const {
      createCreateProfilesTreeTransaction: treeSetupResponse
    } = await client.createCreateProfilesTreeTransaction({
      payer: adminKeyPair.publicKey.toString(),
      project: config.projectId,
      treeConfig: {
        basic: { 
          numAssets: 100000, // The desired number of profiles this tree will be able to store
        },
      }
    });
    
    console.log("Profiles tree transaction created, sending...");
    console.log("Tree address:", treeSetupResponse.treeAddress);
    console.log("Max capacity:", treeSetupResponse.maxTreeCapacity);
    
    // Send the transaction
    const result = await sendTransactionForTests(client, treeSetupResponse.tx, [adminKeyPair]);
    
    console.log("Profiles tree creation transaction:", result.signature);
    
    // Update config with profile information
    config.profiles = {
      name: "Duck Game Profiles",
      authority: adminKeyPair.publicKey.toString(),
      createdAt: new Date().toISOString(),
      description: "Player profiles for Duck Game",
      treeCreated: true,
      treeAddress: treeSetupResponse.treeAddress,
      maxCapacity: treeSetupResponse.maxTreeCapacity,
      transactionSignature: result.signature
    };
    
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    console.log("\n=== PROFILE SYSTEM SETUP COMPLETE ===");
    console.log("Profiles tree created successfully!");
    console.log("Tree supports up to 100,000 profiles");
    console.log("Transaction signature:", result.signature);
    console.log("Authority:", adminKeyPair.publicKey.toString());
    
  } catch (error) {
    console.error("Error creating profile system:", error);
    throw error;
  }
}

// Run the setup
createProfileSystem()
  .then(() => {
    console.log("\nProfile system ready!");
    console.log("Next: Run 'npm run create-resources' to set up XP/achievement system");
  })
  .catch((error) => {
    console.error("Profile system setup failed:", error);
    process.exit(1);
  });