import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function createNewProject() {
  try {
    // Load the admin keypair
    const walletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    
    const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));
    
    console.log("Admin Authority Wallet Address:", keyPair.publicKey.toString());
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    // Create the project transaction
    const {
      createCreateProjectTransaction: { project: projectAddress, tx: txResponse },
    } = await client.createCreateProjectTransaction({
      name: "Duck Game Project", // Updated project name
      authority: keyPair.publicKey.toString(),
      payer: keyPair.publicKey.toString(),
    });
    
    console.log("Project Address Generated:", projectAddress);
    
    // Send the transaction
    const result = await sendTransactionForTests(
      client,
      {
        blockhash: txResponse.blockhash,
        lastValidBlockHeight: txResponse.lastValidBlockHeight,
        transaction: txResponse.transaction,
      },
      [keyPair]
    );
    
    console.log("Transaction Signature:", result.signature);
    
    // Save project configuration to file
    const projectConfig = {
      projectId: projectAddress,
      authority: keyPair.publicKey.toString(),
      createdAt: new Date().toISOString(),
      transactionSignature: result.signature,
      apiUrl: API_URL,
      name: "Duck Game Project"
    };
    
    fs.writeFileSync(
      path.join("./config.json"),
      JSON.stringify(projectConfig, null, 2)
    );
    
    console.log("\n=== PROJECT SETUP COMPLETE ===");
    console.log("Project ID:", projectAddress);
    console.log("Authority:", keyPair.publicKey.toString());
    console.log("Configuration saved to: ./config.json");
    console.log("Transaction Explorer:", `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    
    return projectConfig;
    
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

// Run the setup
createNewProject()
  .then((config) => {
    console.log("\nNext steps:");
    console.log("1. Run 'npm run create-users' to set up user system");
    console.log("2. Run 'npm run create-profiles' to set up profile system");
    console.log("3. Run 'npm run create-resources' to set up XP/achievement system");
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });