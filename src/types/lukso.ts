import { ERC725JSONSchema } from '@erc725/erc725.js';

/**
 * Interface for managing top accounts on a LUKSO Universal Profile
 */
export interface TopAccountsManager {
  addresses: string[];
  addAddress(address: string): boolean;
  removeAddress(address: string): boolean;
  getAddresses(): string[];
  encodeAddresses(): any;
  storeAddressesOnProfile(privateKey: string, rpcUrl: string): Promise<string>;
}

/**
 * Encoded data returned by ERC725.js
 */
export interface EncodedData {
  keys: string[];
  values: string[];
}

/**
 * Configuration for ERC725 schema
 */
export interface ERC725SchemaConfig {
  TOP_ACCOUNTS_SCHEMA: ERC725JSONSchema[];
  TOP_ACCOUNTS_KEY: string;
}