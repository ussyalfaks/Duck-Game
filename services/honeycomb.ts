
import createEdgeClient from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { HONEYCOMB_API_URL } from "../constants";
import { TxResponse } from "../types";

// Create a singleton client instance
export const honeycombClient = createEdgeClient(HONEYCOMB_API_URL, true);

// Utility function to sign and send transactions received from the honeycomb client
export const signAndSendTransaction = async (
  wallet: WalletContextState,
  txResponse: TxResponse | { tx: TxResponse }
) => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or does not support signing");
  }

  // The transaction response can be nested under a 'tx' property
  const finalTxResponse = 'tx' in txResponse ? txResponse.tx : txResponse;

  try {
    const response = await sendClientTransactions(
      honeycombClient,
      wallet,
      finalTxResponse
    );
    console.log("Transaction successful:", response);
    return response;
  } catch (error) {
    console.error("Failed to send transaction:", error);
    throw error;
  }
};
