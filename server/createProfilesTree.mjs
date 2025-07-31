import { Keypair } from "@solana/web3.js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = "https://edge.test.honeycombprotocol.com/";
const OUTPUT_PATH = join(__dirname, "tree-address.json");

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

    console.log("Sending transaction using Honeycomb helper...");
    const signature = await sendClientTransactions(client, keyPair, txResponse);

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
