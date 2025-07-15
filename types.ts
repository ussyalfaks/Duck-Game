
// Simplified types based on Honeycomb Protocol client responses
export interface HCB_Project {
  id: number;
  address: string;
  name: string;
  authority: string;
  driver: string;
}

export interface HCB_Profile {
  address: string;
  name: string;
  bio: string;
  pfp: string;
  project: string;
  xp: number;
  achievements: number[];
  badges: number[];
  customData: { key: string; value: string[] }[];
}

export interface HCB_User {
  address: string;
  id: number;
  name: string;
  pfp: string;
  bio: string;
  wallets: string[];
  profiles: HCB_Profile[];
}

// Enums from @honeycomb-protocol/edge-client for creating transactions
export enum HiveControlPermissionInput {
  ManageProjectDriver = "ManageProjectDriver",
}

export enum BadgesCondition {
  Public = "Public",
}

export enum ResourceStorageEnum {
  LedgerState = "LedgerState",
  AccountState = "AccountState",
}

export interface TxResponse {
  blockhash: string;
  lastValidBlockHeight: number;
  transaction: string;
}
