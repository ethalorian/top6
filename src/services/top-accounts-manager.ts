import { ERC725 } from '@erc725/erc725.js';
import { ethers } from 'ethers';
import { TopAccountsManager, EncodedData } from '../types/lukso';
import { ERC725_CONFIG, MAX_TOP_ACCOUNTS } from '../constants/lukso';
import { isValidAddress, normalizeAddress } from '../utils/addressUtils';

/**
 * Class to manage top accounts for a LUKSO Universal Profile
 */
export class LuksoTopAccountsManager implements TopAccountsManager {
  addresses: string[];
  
  /**
   * Create a new top accounts manager
   * @param initialAddresses Optional initial list of addresses
   */
  constructor(initialAddresses: string[] = []) {
    // Validate addresses and limit to maximum number
    this.addresses = initialAddresses
      .filter(isValidAddress)
      .map(addr => normalizeAddress(addr) as string)
      .slice(0, MAX_TOP_ACCOUNTS);
  }
  
  /**
   * Add a new address to the top accounts
   * @param address Ethereum address to add
   * @returns true if address was added, false if invalid or list was full
   */
  addAddress(address: string): boolean {
    // Validate the address
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      console.error('Invalid address format');
      return false;
    }
    
    // Check if address already exists
    if (this.addresses.includes(normalizedAddress)) {
      console.warn('Address already exists in the list');
      return false;
    }
    
    // Check if we've reached the maximum number of addresses
    if (this.addresses.length >= MAX_TOP_ACCOUNTS) {
      console.error(`Cannot add more than ${MAX_TOP_ACCOUNTS} addresses`);
      return false;
    }
    
    // Add the address
    this.addresses.push(normalizedAddress);
    return true;
  }
  
  /**
   * Remove an address from the top accounts
   * @param address Ethereum address to remove
   * @returns true if address was removed, false if not found
   */
  removeAddress(address: string): boolean {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) return false;
    
    const initialLength = this.addresses.length;
    this.addresses = this.addresses.filter(addr => addr !== normalizedAddress);
    return this.addresses.length < initialLength;
  }
  
  /**
   * Get the current list of addresses
   * @returns Array of addresses
   */
  getAddresses(): string[] {
    return [...this.addresses];
  }
  
  /**
   * Encode the addresses according to ERC725 schema
   * @returns Encoded data ready for storage
   */
  encodeAddresses(): EncodedData {
    const erc725js = new ERC725(ERC725_CONFIG.TOP_ACCOUNTS_SCHEMA);
    return erc725js.encodeData([
      { keyName: 'MyTopAccounts', value: this.addresses },
    ]);
  }
  
  /**
   * Store the addresses on the Universal Profile
   * @param privateKey Private key of the profile owner
   * @param rpcUrl RPC URL for LUKSO network
   * @returns Transaction hash
   */
  async storeAddressesOnProfile(privateKey: string, rpcUrl: string): Promise<string> {
    // Set up provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Get Universal Profile address from wallet
    const universalProfileAddress = wallet.address;
    
    // Encode the addresses
    const encodedData = this.encodeAddresses();
    
    // Create LSP6 interface to interact with Universal Profile
    const universalProfileInterface = new ethers.utils.Interface([
      "function setData(bytes32[] memory _keys, bytes[] memory _values) external"
    ]);
    
    // Prepare transaction
    const transaction = {
      to: universalProfileAddress,
      data: universalProfileInterface.encodeFunctionData("setData", [
        encodedData.keys,
        encodedData.values
      ])
    };
    
    // Send transaction
    const tx = await wallet.sendTransaction(transaction);
    return tx.hash;
  }
}