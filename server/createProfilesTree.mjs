import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = "https://edge.test.honeycombprotocol.com/";
const RPC_URL = "https://rpc.test.honeycombprotocol.com";
const OUTPUT_PATH = join(__dirname, "tree-address.json");

// Create a minimal wallet adapter for Honeycomb
function createMinimalWallet(keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (transaction) => {
      transaction.partialSign(keypair);
      return transaction;
    },
    signAllTransactions: async (transactions) => {
      transactions.forEach(tx => tx.partialSign(keypair));
      return transactions;
    },
    connected: true,
    connecting: false,
    disconnecting: false
  };
}

async function main() {
  try {
    console.log("🦆 Honeycomb Profiles Tree Creation");
    console.log("=====================================");
    
    console.log("📁 Reading admin wallet...");
    const walletFile = JSON.parse(
      readFileSync(join(__dirname, "keys/admin.json"), "utf8")
    );
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletFile));
    console.log("👤 Admin wallet:", keyPair.publicKey.toBase58());

    console.log("🌐 Creating Edge client...");
    const client = createEdgeClient(API_URL, true);

    console.log("🌳 Creating profiles tree transaction...");
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

    console.log("🎯 Generated tree address:", treeAddress);
    
    // Log transaction data for debugging
    console.log("📊 Transaction data:", {
      hasTransaction: !!txResponse.tx?.transaction,
      transactionSize: txResponse.tx?.transaction?.length || 0,
      hasBlockhash: !!txResponse.tx?.blockhash,
      blockhash: txResponse.tx?.blockhash?.substring(0, 8) + "...",
      lastValidBlockHeight: txResponse.tx?.lastValidBlockHeight
    });

    // Method 1: Try the official Honeycomb helper
    console.log("🚀 Attempting transaction with Honeycomb helper...");
    try {
      const { sendClientTransactions } = await import("@honeycomb-protocol/edge-client/client/walletHelpers.js");
      
      const wallet = createMinimalWallet(keyPair);
      
      console.log("💫 Sending transaction...");
      const result = await sendClientTransactions(client, wallet, txResponse.tx);
      
      console.log("📄 Transaction result:", result);
      
      if (result && result.length > 0) {
        const signature = result[0]?.responses?.[0]?.signature;
        
        if (signature) {
          console.log("✅ SUCCESS! Profiles tree created!");
          console.log("🔗 Transaction signature:", signature);
          console.log("🌳 Tree address:", treeAddress);

          // Store tree address locally
          const treeData = {
            treeAddress,
            txSignature: signature,
            createdAt: new Date().toISOString(),
            project: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa"
          };
          writeFileSync(OUTPUT_PATH, JSON.stringify(treeData, null, 2));

          console.log(`📁 Tree data saved to ${OUTPUT_PATH}`);
          console.log("\n🎉 You can now run your Duck Game!");
          
          return { signature, treeAddress };
        }
      }
      
      throw new Error("No signature returned from transaction");
      
    } catch (helperError) {
      console.error("❌ Honeycomb helper failed:", helperError.message);
      
      // Method 2: Manual transaction handling as fallback
      console.log("🔄 Trying manual transaction handling...");
      
      const connection = new Connection(RPC_URL, "confirmed");
      
      if (!txResponse.tx?.transaction) {
        throw new Error("No transaction data received from Honeycomb");
      }
      
      // Check if transaction data looks valid
      const txData = txResponse.tx.transaction;
      if (typeof txData !== 'string' || txData.length < 100) {
        throw new Error(`Invalid transaction data: ${typeof txData}, length: ${txData.length}`);
      }
      
      console.log("🔍 Attempting raw transaction send...");
      const transactionBuffer = Buffer.from(txData, "base64");
      
      const signature = await connection.sendRawTransaction(transactionBuffer, {
        skipPreflight: true, // Skip preflight since it's failing
        maxRetries: 3
      });
      
      console.log("⏳ Confirming transaction...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: txResponse.tx.blockhash,
        lastValidBlockHeight: txResponse.tx.lastValidBlockHeight
      }, "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log("✅ SUCCESS! Profiles tree created with manual method!");
      console.log("🔗 Transaction signature:", signature);
      console.log("🌳 Tree address:", treeAddress);

      // Store tree address locally
      const treeData = {
        treeAddress,
        txSignature: signature,
        createdAt: new Date().toISOString(),
        project: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa",
        method: "manual"
      };
      writeFileSync(OUTPUT_PATH, JSON.stringify(treeData, null, 2));

      console.log(`📁 Tree data saved to ${OUTPUT_PATH}`);
      console.log("\n🎉 You can now run your Duck Game!");
      
      return { signature, treeAddress };
    }
    
  } catch (error) {
    console.error("❌ FAILED to create profiles tree:", error.message);
    
    console.log("\n🔍 Debugging Information:");
    console.log("- API URL:", API_URL);
    console.log("- RPC URL:", RPC_URL);
    console.log("- Project Address:", "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa");
    
    // Check if we can at least save the tree address for manual use
    if (error.message.includes("tree address") || global.treeAddress) {
      console.log("\n💡 WORKAROUND: You might be able to use the generated tree address manually:");
      console.log("Tree Address:", global.treeAddress || "Check the error logs above");
      console.log("You can try adding this to your constants.ts file as a fallback.");
    }
    
    console.log("\n🛠️  Possible Solutions:");
    console.log("1. Check your internet connection");
    console.log("2. Verify the admin wallet has sufficient SOL");
    console.log("3. Try again in a few minutes (RPC might be busy)");
    console.log("4. Check if the project address is correct");
    
    throw error;
  }
}

main()
  .then((result) => {
    if (result) {
      console.log("\n🎊 COMPLETE! Your profiles tree is ready.");
      console.log("🎮 Now run your Duck Game!");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("\n💥 Final error:", err.message);
    process.exit(1);
  });