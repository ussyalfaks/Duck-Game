import { WalletContextState } from "@solana/wallet-adapter-react";
import { honeycombClient } from "./honeycomb";
import base58 from "bs58";

export interface AuthResult {
  accessToken: string;
  user: any;
}

export const authenticateUser = async (wallet: WalletContextState): Promise<AuthResult | null> => {
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error("Wallet not connected or does not support message signing");
  }

  try {
    console.log("Requesting auth message...");
    const { authRequest: { message: authRequest } } = await honeycombClient.authRequest({
      wallet: wallet.publicKey.toString()
    });

    console.log("Auth request received:", authRequest);

    // Convert the auth request into a UInt8Array
    const encodedMessage = new TextEncoder().encode(authRequest);
    
    // Sign the message
    console.log("Signing auth message...");
    const signedUIntArray = await wallet.signMessage(encodedMessage);
    
    // Convert the signed message into a base58 encoded string
    const signature = base58.encode(signedUIntArray);
    
    // Send the signed message to confirm authentication
    console.log("Confirming authentication...");
    const { authConfirm } = await honeycombClient.authConfirm({ 
      wallet: wallet.publicKey.toString(), 
      signature 
    });

    console.log("Authentication successful:", authConfirm);
    return authConfirm;
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
};