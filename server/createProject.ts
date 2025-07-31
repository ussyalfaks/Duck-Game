import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://edge.test.honeycombprotocol.com/";
const RPC_URL = "https://rpc.test.honeycombprotocol.com";

// Create a wallet adapter compatible object from a Keypair
function createWalletFromKeypair(keypair: web3.Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (transaction: web3.Transaction) => {
      transaction.partialSign(keypair);
      return transaction;
    },
    signAllTransactions: async (transactions: web3.Transaction[]) => {
      transactions.forEach(tx => tx.partialSign(keypair));
      return transactions;
    }
  };
}

async function main() {
  try {
    console.log("Reading admin wallet...");
    const walletFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, "keys/admin.json"), "utf8")
    );
    const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));
    
    // Create wallet adapter object
    const wallet = createWalletFromKeypair(keyPair);

    console.log("Creating Edge client...");
    const client = createEdgeClient(API_URL, true);

    console.log("Creating project transaction...");
    const response = await client.createCreateProjectTransaction({
      name: "Honeycomb Duck Game",
      authority: keyPair.publicKey.toString(),
      payer: keyPair.publicKey.toString(),
      profileDataConfig: {
        achievements: ["Level 1 Cleared"],
        customDataFields: [],
      },
    });

    const txResponse = response.createCreateProjectTransaction;
    const projectAddress = txResponse.project;

    console.log("Sending transaction using Honeycomb helper...");
    console.log("Project address:", projectAddress);
    
    // Extract the actual transaction data (the helper expects just the tx part)
    const transactionData = txResponse.tx;
    
    // Use the sendClientTransactions helper with our wallet adapter
    const result = await sendClientTransactions(client, wallet, transactionData);
    
    console.log("Transaction result:", result);
    
    // Extract signature from result
    let signature = null;
    if (result && Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (firstResult.responses && firstResult.responses.length > 0) {
        signature = firstResult.responses[0].signature;
      }
    }

    if (!signature) {
      throw new Error("No signature found in transaction result");
    }

    console.log("✅ Project created successfully!");
    console.log("🔗 Transaction signature:", signature);
    console.log("🏗️ Project address:", projectAddress);

    // Store project data locally
    const projectData = {
      projectAddress,
      txSignature: signature,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(__dirname, "project-address.json"), 
      JSON.stringify(projectData, null, 2)
    );

    console.log(`📁 Project address saved to project-address.json`);
    return signature;
  } catch (error) {
    console.error("❌ Failed to create project:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });