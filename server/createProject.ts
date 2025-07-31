import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://edge.test.honeycombprotocol.com/";
const PROJECT_ADDRESS = "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa";

async function main() {
  try {
    console.log("Reading admin wallet...");
    const walletFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, "keys/admin.json"), "utf8")
    );
    const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));

    console.log("Creating Edge client...");
    const client = createEdgeClient(API_URL, true);

    console.log("Creating profiles tree transaction...");
    const {
      createCreateProfilesTreeTransaction: { tx: txResponse, treeAddress }
    } = await client.createCreateProfilesTreeTransaction({
      project: PROJECT_ADDRESS,
      payer: keyPair.publicKey.toString(),
      treeConfig: {
        basic: {
          numAssets: 100000
        }
      }
    });

    console.log("Reconstructing transaction...");
    const transaction = web3.Transaction.from(Buffer.from(txResponse.transaction, "base64"));
    transaction.recentBlockhash = txResponse.blockhash;
    transaction.feePayer = keyPair.publicKey;

    console.log("Signing transaction...");
    transaction.partialSign(keyPair);

    const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

    console.log("Sending transaction...");
    const signature = await web3.sendAndConfirmTransaction(connection, transaction, [keyPair]);

    console.log("✅ Profiles tree created successfully!");
    console.log("Transaction signature:", signature);
    console.log("Tree address:", treeAddress.toString());

    return signature;
  } catch (error) {
    console.error("❌ Failed to create profiles tree:", error.message);
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
