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
    try {
      // Create ERC725 instance with proper schema
      const erc725js = new ERC725(ERC725_CONFIG.TOP_ACCOUNTS_SCHEMA);
      
      // Get non-empty addresses (preserving slot functionality)
      const nonEmptyAddresses = this.slots
        .filter(address => address !== null)
        .map(address => address as string);
      
      console.log('Addresses being encoded:', nonEmptyAddresses);
      
      if (nonEmptyAddresses.length === 0) {
        console.warn('No addresses to encode');
        return { keys: [], values: [] };
      }
      
      // Encode using the same pattern as the original implementation
      const encoded = erc725js.encodeData([
        { keyName: 'MyTopAccounts', value: nonEmptyAddresses }
      ]);
      
      console.log('Encoded data:', encoded);
      return encoded;
    } catch (error) {
      console.error('Error encoding data:', error);
      return { keys: [], values: [] };
    }
  }
  
  /**
   * Store the addresses on the Universal Profile using a LUKSO UP provider
   * @param provider The UP provider from useUPProvider
   * @param address The address of the Universal Profile
   * @returns Transaction hash
   */
  async storeAddressesOnProfile(
    provider: ReturnType<typeof createClientUPProvider>, 
    address: string
  ): Promise<string> {
    if (!provider || !address) {
      throw new Error('Provider and address are required');
    }
    
    try {
      // Encode the addresses
      const { keys, values } = this.encodeAddresses();
      
      if (keys.length === 0 || values.length === 0) {
        throw new Error('No data to encode');
      }
      
      console.log('Encoded data to send:', { keys, values });
      
      // Prepare transaction data
      const functionSelector = '0x14a6c251'; // setData(bytes32[],bytes[])
      const encodedParams = ethers.utils.defaultAbiCoder.encode(
        ['bytes32[]', 'bytes[]'], 
        [keys, values]
      );
      
      const data = ethers.utils.hexConcat([functionSelector, encodedParams]);
      
      // Send transaction with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{
              from: address,
              to: address,
              data: data,
              gas: ethers.utils.hexValue(500000), // Increased gas limit for safety
            }]
          });
          
          console.log('Transaction submitted successfully:', txHash);
          return txHash as string;
        } catch (error) {
          attempts++;
          console.error(`Transaction attempt ${attempts} failed:`, error);
          
          if (attempts >= maxAttempts) {
            throw error;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      throw new Error('Failed to submit transaction after multiple attempts');
    } catch (error) {
      console.error('Error storing addresses:', error);
      throw error;
    }
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

  /**
   * Retrieve top accounts from any Universal Profile address
   * @param upAddress The Universal Profile address to query
   * @returns Array of stored top account addresses
   */
  async getStoredAddresses(upAddress: string): Promise<string[]> {
    try {
      // Create a standard ethers provider for read-only operations
      const provider = new ethers.providers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
      
      // Initialize ERC725 with the provider and target address
      const erc725js = new ERC725(
        ERC725_CONFIG.TOP_ACCOUNTS_SCHEMA,
        upAddress,
        provider
      );
      
      // Get data using the key name from your schema
      const data = await erc725js.getData('MyTopAccounts');
      console.log('Retrieved top accounts data:', data);
      
      // Handle the complex data structure ERC725.js returns
      if (data && data.value && Array.isArray(data.value)) {
        return data.value.filter(Boolean) as string[];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error retrieving top accounts:', error);
      return [];
    }
  }
}