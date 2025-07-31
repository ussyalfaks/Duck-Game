import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function main() {
  try {
    console.log("Reading admin wallet...");
    const walletFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, "keys/admin.json"), "utf8")
    );
    const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));
    
    console.log("Creating Edge client...");
    // Try multiple import methods
    let createEdgeClient;
    try {
      // Method 1: Try named import
      const module1 = await import("@honeycomb-protocol/edge-client");
      createEdgeClient = module1.createEdgeClient || module1.default;
    } catch (e1) {
      try {
        // Method 2: Try accessing from client subdirectory
        const module2 = await import("@honeycomb-protocol/edge-client/client/index.js");
        createEdgeClient = module2.createEdgeClient || module2.default;
      } catch (e2) {
        console.error("Failed to import createEdgeClient:", e1, e2);
        throw new Error("Could not import createEdgeClient");
      }
    }
    
    if (typeof createEdgeClient !== 'function') {
      console.error("createEdgeClient is not a function:", typeof createEdgeClient);
      console.error("Available exports:", Object.keys(createEdgeClient || {}));
      throw new Error("createEdgeClient is not a function");
    }
    
    const client = createEdgeClient(API_URL, true);
    
    console.log("Creating profiles tree transaction...");
    const response = await client.createCreateProfilesTreeTransaction({
      project: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa",
      payer: keyPair.publicKey.toString(),
      treeConfig: {
        basic: {
          numAssets: 100000
        }
      }
    });

    // Extract the transaction response
    const txResponse = response.createCreateProfilesTreeTransaction.tx;

    console.log("Connecting to Solana testnet...");
    const connection = new web3.Connection("https://rpc.test.honeycombprotocol.com", "confirmed");

    console.log("Processing transaction...");
    const messageBytes = Buffer.from(txResponse.transaction, "base64");
    const tx = web3.Transaction.from(messageBytes);
    tx.sign(keyPair);
    
    console.log("Sending transaction...");
    const signature = await connection.sendRawTransaction(tx.serialize());
    
    console.log("Waiting for confirmation...");
    await connection.confirmTransaction({
      signature,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    });

    console.log("Profiles tree created successfully!");
    console.log("Transaction signature:", signature);
    
    return signature;
  } catch (error) {
    console.error("Failed to create profiles tree:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });