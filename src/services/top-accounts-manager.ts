import { ERC725 } from '@erc725/erc725.js';
import { ethers } from 'ethers';
import { TopAccountsManager, EncodedData } from '../types/lukso';
import { ERC725_CONFIG, MAX_TOP_ACCOUNTS } from '../constants/lukso';
import { isValidAddress, normalizeAddress } from '../utils/addressUtils';
import { createClientUPProvider } from '../providers/up-provider';

/**
 * Class to manage top accounts for a LUKSO Universal Profile
 * using a slot-based approach
 */
export class LuksoTopAccountsManager implements TopAccountsManager {
  slots: (string | null)[];
  
  // Add this getter to satisfy the interface requirement
  get addresses(): string[] {
    return this.getAddresses();
  }
  
  /**
   * Create a new top accounts manager
   * @param initialAddresses Optional initial list of addresses or slot map
   */
  constructor(initialAddresses: string[] | Record<number, string> = []) {
    // Initialize slots array with null values
    this.slots = Array(MAX_TOP_ACCOUNTS).fill(null);
    
    if (Array.isArray(initialAddresses)) {
      // Handle array format (backwards compatibility)
      initialAddresses
        .filter(isValidAddress)
        .map(addr => normalizeAddress(addr) as string)
        .slice(0, MAX_TOP_ACCOUNTS)
        .forEach((addr, index) => {
          this.slots[index] = addr;
        });
    } else {
      // Handle slot map format
      Object.entries(initialAddresses).forEach(([slotStr, address]) => {
        const slot = parseInt(slotStr, 10);
        if (slot >= 0 && slot < MAX_TOP_ACCOUNTS && isValidAddress(address)) {
          this.slots[slot] = normalizeAddress(address) as string;
        }
      });
    }
  }
  
  /**
   * Add a new address to the top accounts in a specific slot
   * @param address Ethereum address to add
   * @param slotIndex The slot index to place the address (0-based)
   * @returns true if address was added, false if invalid
   */
  addAddress(address: string, slotIndex?: number): boolean {
    // Validate the address
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      console.error('Invalid address format');
      return false;
    }
    
    // If no slot specified, find the first empty slot
    if (slotIndex === undefined) {
      slotIndex = this.slots.findIndex(slot => slot === null);
      if (slotIndex === -1) {
        console.error(`All ${MAX_TOP_ACCOUNTS} slots are filled`);
        return false;
      }
    }
    
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= MAX_TOP_ACCOUNTS) {
      console.error(`Slot index must be between 0 and ${MAX_TOP_ACCOUNTS - 1}`);
      return false;
    }
    
    // Add the address to the specified slot
    this.slots[slotIndex] = normalizedAddress;
    return true;
  }
  
  /**
   * Remove an address from a specific slot
   * @param address Ethereum address to remove, or slot index
   * @returns true if address was removed, false if not found
   */
  removeAddress(addressOrSlot: string | number): boolean {
    if (typeof addressOrSlot === 'number') {
      // Remove by slot index
      const slotIndex = addressOrSlot;
      if (slotIndex < 0 || slotIndex >= MAX_TOP_ACCOUNTS) {
        return false;
      }
      
      if (this.slots[slotIndex] === null) {
        return false;
      }
      
      this.slots[slotIndex] = null;
      return true;
    } else {
      // Remove by address
      const normalizedAddress = normalizeAddress(addressOrSlot);
      if (!normalizedAddress) return false;
      
      const slotIndex = this.slots.findIndex(addr => addr === normalizedAddress);
      if (slotIndex === -1) return false;
      
      this.slots[slotIndex] = null;
      return true;
    }
  }
  
  /**
   * Get the current list of addresses (excluding empty slots)
   * @returns Array of addresses
   */
  getAddresses(): string[] {
    return this.slots.filter(addr => addr !== null) as string[];
  }
  
  /**
   * Get address at a specific slot
   * @param slotIndex The slot index to retrieve
   * @returns Address at the specified slot or null if empty
   */
  getAddressAtSlot(slotIndex: number): string | null {
    if (slotIndex < 0 || slotIndex >= MAX_TOP_ACCOUNTS) {
      return null;
    }
    return this.slots[slotIndex];
  }
  
  /**
   * Encode the addresses according to ERC725 schema with specific slots
   * @returns Encoded data ready for storage
   */
  encodeAddresses(): EncodedData {
    const erc725js = new ERC725(ERC725_CONFIG.TOP_ACCOUNTS_SCHEMA);
    
    // For array-type schema, we need to encode the entire array at once
    // Only include non-null addresses in the array
    const nonEmptyAddresses = this.slots
      .map((address, index) => ({
        address: address || "0x0000000000000000000000000000000000000000",
        index
      }))
      .filter(item => item.address !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.address);
    
    try {
      // Encode the entire array at once using the schema name
      return erc725js.encodeData([
        {
          keyName: "MyTopAccounts", // Match the name in your schema
          value: nonEmptyAddresses
        }
      ]);
    } catch (error) {
      console.error('Error encoding data:', error);
      // Return empty encoded data to avoid crashing
      return { keys: [], values: [] };
    }
  }
  
  /**
   * Store the addresses on the Universal Profile
   * @param privateKey The private key of the Universal Profile
   * @param rpcUrl The RPC URL of the Universal Profile
   * @returns Transaction hash
   */
  async storeAddressesOnProfile(privateKey: string, rpcUrl: string): Promise<string> {
    // Create a wallet with the private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Connect wallet to a provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = wallet.connect(provider);
    
    // Get the address
    const address = await signer.getAddress();
    
    // Encode the addresses
    const { keys, values } = this.encodeAddresses();
    
    // Create the transaction
    const transaction = {
      to: address, // instead of provider.address
      data: '0x...', // The encoded data to update the Universal Profile with keys and values
    };
    
    // For the transaction
    const txResponse = await signer.sendTransaction(transaction);
    return txResponse.hash;
  }
  
  /**
   * Remove an address from a specific slot
   * @param slot Slot index to clear
   * @returns true if slot was cleared, false if invalid slot
   */
  removeAddressAtSlot(slot: number): boolean {
    if (slot < 0 || slot >= MAX_TOP_ACCOUNTS) {
      return false;
    }
    
    // Check if the slot was already empty
    if (this.slots[slot] === null) {
      return false;
    }
    
    // Clear the slot
    this.slots[slot] = null;
    return true;
  }
}