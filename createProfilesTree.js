const web3 = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");
const { createEdgeClient } = require("@honeycomb-protocol/edge-client");

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function main() {
  try {
    console.log("Reading admin wallet...");
    const walletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));
    
    console.log("Creating Edge client...");
    const client = createEdgeClient(API_URL, true);
    
    console.log("Creating profiles tree transaction...");
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

    console.log("Connecting to Solana devnet...");
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

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
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
