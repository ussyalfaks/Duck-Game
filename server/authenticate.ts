import * as web3 from "@solana/web3.js";
import fs from "fs";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import nacl from "tweetnacl";
import base58 from "bs58";

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function authenticateUser(userKeyPath: string = "./keys/testUser.json") {
  try {
    // Load project configuration
    if (!fs.existsSync("./config.json")) {
      throw new Error("Project not set up. Please run the complete setup first.");
    }
    
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    console.log("Authenticating user for project:", config.name);
    
    // Load user keypair
    if (!fs.existsSync(userKeyPath)) {
      throw new Error(`User key file not found: ${userKeyPath}. Please run 'npm run create-users' first.`);
    }
    
    const userWalletFile = JSON.parse(fs.readFileSync(userKeyPath, "utf8"));
    const userKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(userWalletFile));
    
    console.log("Authenticating user:", userKeyPair.publicKey.toString());
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    // Request authentication message
    const {
      authRequest: { message: authRequest },
    } = await client.authRequest({
      wallet: userKeyPair.publicKey.toString(),
    });
    
    console.log("Auth request message:", authRequest);
    
    // Sign the authentication message
    const encodedMessage = new TextEncoder().encode(authRequest);
    const signedUIntArray = nacl.sign.detached(encodedMessage, userKeyPair.secretKey);
    const signature = base58.encode(signedUIntArray);
    
    // Confirm authentication and get access token
    const { authConfirm } = await client.authConfirm({
      wallet: userKeyPair.publicKey.toString(),
      signature,
    });
    
    console.log("\n=== AUTHENTICATION SUCCESSFUL ===");
    console.log("Access Token:", authConfirm.accessToken);
    
    // Save authentication info
    const authInfo = {
      wallet: userKeyPair.publicKey.toString(),
      accessToken: authConfirm.accessToken,
      authenticatedAt: new Date().toISOString(),
      projectId: config.projectId
    };
    
    fs.writeFileSync("./auth.json", JSON.stringify(authInfo, null, 2));
    console.log("Authentication info saved to auth.json");
    
    return authInfo;
    
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
}

// Command line usage
const userKeyPath = process.argv[2] || "./keys/testUser.json";

authenticateUser(userKeyPath)
  .then(() => {
    console.log("\nUser authenticated successfully!");
    console.log("You can now use the access token for authenticated API calls.");
  })
  .catch((error) => {
    console.error("Authentication process failed:", error);
    process.exit(1);
  });