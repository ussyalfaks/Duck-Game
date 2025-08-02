import { Keypair, Connection, Transaction, PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//honeycomb-protocol
// This script creates a profiles tree on the Honeycomb Protocol using the Edge client.
const API_URL = "https://edge.test.honeycombprotocol.com/";
const OUTPUT_PATH = join(__dirname, "tree-address.json");
// Ensure the output directory exists
async function main() {
  try {
    console.log("Reading admin wallet...");
    const walletFile = JSON.parse(
      readFileSync(join(__dirname, "keys/admin.json"), "utf8")
    );
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletFile));

    console.log("Creating Edge client...");
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

    const txResponse = response.createCreateProfilesTreeTransaction;
    const treeAddress = txResponse.treeAddress;

    console.log("Sending transaction manually...");
    console.log("Tree address:", treeAddress);
    
    // Manual transaction handling since the helper is having issues
    const connection = new Connection("https://rpc.test.honeycombprotocol.com", "confirmed");
    
    try {
      // Try to send as raw transaction data
      const transactionBuffer = Buffer.from(txResponse.tx.transaction, "base64");
      
      console.log("Sending raw transaction...");
      const signature = await connection.sendRawTransaction(transactionBuffer, {
        skipPreflight: false,
        preflightCommitment: "confirmed"
      });
      
      console.log("Confirming transaction...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: txResponse.tx.blockhash,
        lastValidBlockHeight: txResponse.tx.lastValidBlockHeight
      });
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log("✅ Profiles tree created successfully!");
      console.log("🔗 Transaction signature:", signature);
      console.log("🌳 Tree address:", treeAddress);

      // Store tree address locally
      const treeData = {
        treeAddress,
        txSignature: signature,
        createdAt: new Date().toISOString()
      };
      writeFileSync(OUTPUT_PATH, JSON.stringify(treeData, null, 2));

      console.log(`📁 Tree address saved to ${OUTPUT_PATH}`);
      return signature;
      
    } catch (rawError) {
      console.error("Raw transaction failed:", rawError.message);
      throw rawError;
    }
  } catch (error) {
    console.error("❌ Failed to create profiles tree:", error.message);
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