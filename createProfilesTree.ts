import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";

const API_URL = "https://edge.test.honeycombprotocol.com/";

const walletFile = JSON.parse(
  fs.readFileSync(path.join("./keys/admin.json"), "utf8")
);
const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));

const client = createEdgeClient(API_URL, true);

async function createProfilesTree() {
  try {
    const {
      createCreateProfilesTreeTransaction: { tx: txResponse },
    } = await client.createCreateProfilesTreeTransaction({
      project: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa",
      payer: keyPair.publicKey.toString(),
      treeConfig: {
        basic: {
          numAssets: 100000
        }
      }
    });

  try {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    console.log("Connected to Solana devnet");

    // Convert transaction string to buffer
    // Handle the transaction directly
    const transaction = txResponse.transaction;
    if (typeof transaction === 'string') {
      const messageBytes = Buffer.from(transaction, 'base64');
      const message = web3.VersionedMessage.deserialize(messageBytes);
      const versionedTx = new web3.VersionedTransaction(message);
    
    // Sign the transaction
    transaction.sign(keyPair);
    
    // Send the transaction
    console.log("Sending transaction...");
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Profiles tree created! Signature:", signature);
  } catch (error) {
    console.error("Failed to create profiles tree:", error);
    process.exit(1);
  }
})();