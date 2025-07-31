import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers";

const API_URL = "https://edge.test.honeycombprotocol.com/";

const walletFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "keys/admin.json"), "utf8")
);

const keyPair = web3.Keypair.fromSecretKey(new Uint8Array(walletFile));

const client = createEdgeClient(API_URL, true);

(async () => {
  const {
    createCreateProjectTransaction: { project: projectAddress, tx: txResponse },
  } = await client.createCreateProjectTransaction({
    name: "duck-game-react",
    authority: keyPair.publicKey.toString(),
    payer: keyPair.publicKey.toString(),
  });

  const result = await sendTransactionForTests(
    client,
    {
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight,
      transaction: txResponse.transaction,
    },
    [keyPair]
  );

  console.log("New Project Address:", projectAddress);
  console.log("Transaction Signature:", result.signature);
})();