import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";

// Import ResourceStorageEnum from the client
import { ResourceStorageEnum } from "@honeycomb-protocol/edge-client/client/generated.js";

// Game resource definitions matching the client-side config
const GAME_RESOURCES = [
  {
    name: "Experience Points",
    symbol: "XP", 
    decimals: 0,
    uri: "https://example.com/xp-metadata.json",
    storage: ResourceStorageEnum.LedgerState, // Compressed
    tags: ["xp", "experience", "points"]
  },
  {
    name: "Achievement Badges",
    symbol: "BADGE",
    decimals: 0, 
    uri: "https://example.com/badge-metadata.json",
    storage: ResourceStorageEnum.LedgerState, // Compressed NFT-like
    tags: ["badges", "achievements", "nft"]
  }
];

async function createGameResources() {
  try {
    // Load project configuration
    if (!fs.existsSync("./config.json")) {
      throw new Error("Project not set up. Please run the complete setup first.");
    }
    
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    console.log("Creating game resources for project:", config.name);
    console.log("Project ID:", config.projectId);
    
    // Load the admin keypair
    const adminWalletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    
    const adminKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(adminWalletFile));
    console.log("Admin authority:", adminKeyPair.publicKey.toString());
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    const createdResources = [];
    
    // Create each resource
    for (const resource of GAME_RESOURCES) {
      try {
        console.log(`\nCreating resource: ${resource.name} (${resource.symbol})`);
        
        // Create the resource
        const {
          createCreateNewResourceTransaction: { resource: resourceAddress, tx: txResponse }
        } = await client.createCreateNewResourceTransaction({
          project: config.projectId,
          authority: adminKeyPair.publicKey.toString(),
          payer: adminKeyPair.publicKey.toString(),
          params: {
            name: resource.name,
            symbol: resource.symbol,
            uri: resource.uri,
            decimals: resource.decimals,
            storage: resource.storage,
            tags: resource.tags
          }
        });
        
        console.log(`Resource address generated: ${resourceAddress}`);
        
        // Send the transaction
        const result = await sendTransactionForTests(client, txResponse, [adminKeyPair]);
        
        console.log(`✅ Resource created successfully!`);
        console.log(`Transaction: ${result.signature}`);
        
        createdResources.push({
          name: resource.name,
          symbol: resource.symbol,
          address: resourceAddress,
          decimals: resource.decimals,
          storage: resource.storage,
          transactionSignature: result.signature,
          createdAt: new Date().toISOString()
        });
        
        // Wait a bit between resource creations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to create resource ${resource.symbol}:`, error);
        
        // Continue with other resources even if one fails
        createdResources.push({
          name: resource.name,
          symbol: resource.symbol,
          address: null,
          error: error.message,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    // Update config with created resources
    config.gameResources = {
      resources: createdResources,
      projectId: config.projectId,
      authority: adminKeyPair.publicKey.toString(),
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    console.log("\n=== GAME RESOURCES CREATION COMPLETE ===");
    console.log(`Created ${createdResources.filter(r => r.address).length} out of ${GAME_RESOURCES.length} resources`);
    
    // Display summary
    console.log("\nResource Summary:");
    createdResources.forEach(resource => {
      if (resource.address) {
        console.log(`✅ ${resource.symbol}: ${resource.address}`);
      } else {
        console.log(`❌ ${resource.symbol}: Failed - ${resource.error}`);
      }
    });
    
    console.log("\nNext steps:");
    console.log("1. Use these resource addresses in your game client");
    console.log("2. Set up resource trees if needed for compressed storage");
    console.log("3. Configure initial minting permissions");
    
  } catch (error) {
    console.error("Error creating game resources:", error);
    throw error;
  }
}

// Run the setup
createGameResources()
  .then(() => {
    console.log("\nGame resources creation completed!");
  })
  .catch((error) => {
    console.error("Game resources creation failed:", error);
    process.exit(1);
  });