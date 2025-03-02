import { ERC725 } from '@erc725/erc725.js';
import { ethers } from 'ethers';
import { createClientUPProvider } from '../providers/up-provider';

// Define required types if they're missing
export type EncodedData = {
  keys: string[];
  values: string[];
};

// Define constants if not available in constants file
const MAX_TOP_ACCOUNTS = 10;
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const TOP_ACCOUNTS_DATA_KEY = '0x38a0b0a149d59d46ad9c7fa612f0972948f82cc6f052268ef13a9e7da8a1dc84';

// ERC725 schema for top accounts
const TOP_ACCOUNTS_SCHEMA = [{
  name: 'MyTopAccounts',
  key: TOP_ACCOUNTS_DATA_KEY,
  keyType: 'Singleton',
  valueType: 'address[]',
  valueContent: 'Address'
}];

// Types
type AddressSlots = (string | null)[];
type Provider = ReturnType<typeof createClientUPProvider>;

// Address validation utilities
function isValidAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

function normalizeAddress(address: string): string | null {
  if (!isValidAddress(address)) return null;
  return ethers.utils.getAddress(address);
}

// ===== Core Address Management Functions =====

/**
 * Create a new slots array with initial addresses
 */
export function createAddressSlots(initialAddresses: string[] = []): AddressSlots {
  const slots = Array(MAX_TOP_ACCOUNTS).fill(null);
  
  initialAddresses.forEach((addr, index) => {
    if (index < MAX_TOP_ACCOUNTS && isValidAddress(addr)) {
      slots[index] = normalizeAddress(addr) as string;
    }
  });
  
  return slots;
}

/**
 * Add an address to slots
 */
export function addAddress(slots: AddressSlots, address: string, slotIndex?: number): AddressSlots {
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) return slots;
  
  // Create a copy of slots to avoid mutation
  const newSlots = [...slots];
  
  // Find first empty slot if none specified
  if (slotIndex === undefined) {
    slotIndex = slots.findIndex(slot => slot === null);
    if (slotIndex === -1) return slots; // All slots filled
  }
  
  // Validate slot index
  if (slotIndex < 0 || slotIndex >= MAX_TOP_ACCOUNTS) return slots;
  
  // Add address to slot
  newSlots[slotIndex] = normalizedAddress;
  return newSlots;
}

/**
 * Remove an address from slots
 */
export function removeAddress(slots: AddressSlots, addressOrSlot: string | number): AddressSlots {
  // Create a copy of slots to avoid mutation
  const newSlots = [...slots];
  
  if (typeof addressOrSlot === 'number') {
    // Remove by slot index
    if (addressOrSlot < 0 || addressOrSlot >= MAX_TOP_ACCOUNTS) return slots;
    if (slots[addressOrSlot] === null) return slots;
    
    newSlots[addressOrSlot] = null;
  } else {
    // Remove by address
    const normalizedAddr = normalizeAddress(addressOrSlot);
    if (!normalizedAddr) return slots;
    
    const index = slots.findIndex(addr => addr === normalizedAddr);
    if (index === -1) return slots;
    
    newSlots[index] = null;
  }
  
  return newSlots;
}

/**
 * Get non-null addresses from slots
 */
export function getAddresses(slots: AddressSlots): string[] {
  return slots.filter(addr => addr !== null) as string[];
}

/**
 * Get address at a specific slot
 */
export function getAddressAtSlot(slots: AddressSlots, slotIndex: number): string | null {
  if (slotIndex < 0 || slotIndex >= MAX_TOP_ACCOUNTS) return null;
  return slots[slotIndex];
}

// ===== Data Encoding & Transaction Functions =====

/**
 * Encode addresses for storage on Universal Profile
 */
export function encodeAddresses(slots: AddressSlots): EncodedData {
  const addresses = getAddresses(slots);
  if (addresses.length === 0) return { keys: [], values: [] };
  
  const erc725js = new ERC725(TOP_ACCOUNTS_SCHEMA);
  
  return erc725js.encodeData([
    { keyName: 'MyTopAccounts', value: addresses }
  ]);
}

/**
 * Store addresses on Universal Profile
 */
export async function storeAddressesOnProfile(
  slots: AddressSlots,
  provider: Provider,
  upAddress: string
): Promise<string> {
  // Basic validation
  if (!provider || !upAddress) {
    throw new Error('Provider and UP address are required');
  }
  
  // Check permissions first
  const canUpdate = await canUpdateTopAccounts(provider, upAddress);
  if (!canUpdate) {
    throw new Error('Your account does not have permission to update top accounts');
  }
  
  try {
    // Encode the addresses
    const { keys, values } = encodeAddresses(slots);
    if (keys.length === 0 || values.length === 0) {
      throw new Error('No addresses to store');
    }
    
    // Create transaction data
    const functionSelector = '0x14a6c251'; // setData(bytes32[],bytes[])
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
      ['bytes32[]', 'bytes[]'], 
      [keys, values]
    );
    
    // Create full transaction payload
    const data = ethers.utils.hexConcat([functionSelector, encodedParams]);
    const transaction = {
      from: upAddress,
      to: upAddress,
      data: data
    };
    
    // Send transaction
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
    
    return txHash as string;
  } catch (error) {
    console.error('Error storing addresses:', error);
    throw error;
  }
}

/**
 * Retrieve stored addresses from a Universal Profile
 */
export async function getStoredAddresses(upAddress: string): Promise<string[]> {
  try {
    // Create read-only provider
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    // Initialize ERC725 with schema
    const erc725js = new ERC725(
      TOP_ACCOUNTS_SCHEMA,
      upAddress,
      provider
    );
    
    // Get the data
    const data = await erc725js.getData('MyTopAccounts');
    
    // Extract addresses from result
    return data && data.value && Array.isArray(data.value) 
      ? data.value.filter(Boolean) as string[]
      : [];
  } catch (error) {
    console.error('Error retrieving stored addresses:', error);
    return [];
  }
}

// ===== Permission-Related Functions =====

/**
 * Check if account can update top accounts
 */
export async function canUpdateTopAccounts(
  provider: Provider,
  upAddress: string
): Promise<boolean> {
  try {
    // Create read-only provider for permission checks
    const readProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const erc725 = new ERC725([], upAddress, readProvider);
    
    // Check if account is the profile owner
    const isOwner = await isProfileOwner(readProvider, upAddress);
    if (isOwner) return true;
    
    // Check for SETDATA permissions
    const permissionKey = `0x4b80742de2bf82acb3630000${upAddress.substring(2).toLowerCase()}`;
    const permissions = await erc725.getData(permissionKey);
    if (!permissions || !permissions.value) return false;
    
    // Convert to string for bitwise operations
    const permValue = permissions.value.toString();
    
    // Check for SETDATA (bit 18) or SUPER_SETDATA (bit 17)
    const hasSetData = (BigInt(permValue) & BigInt('0x0000000000000000000000000000000000000000000000000000000000040000')) !== BigInt(0);
    const hasSuperSetData = (BigInt(permValue) & BigInt('0x0000000000000000000000000000000000000000000000000000000000020000')) !== BigInt(0);
    
    // If has super setdata, no need to check specific key access
    if (hasSuperSetData) return true;
    
    // If has regular setdata, check if the specific key is allowed
    if (hasSetData) {
      const allowedKeysKey = `0x4b80742de2bf866c29110000${upAddress.substring(2).toLowerCase()}`;
      const allowedKeys = await erc725.getData(allowedKeysKey);
      
      // Convert to string and check if our key is included
      const allowedKeysValue = allowedKeys?.value ? allowedKeys.value.toString() : '';
      return Boolean(allowedKeysValue.includes(TOP_ACCOUNTS_DATA_KEY));
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if address is the owner of a profile
 */
export async function isProfileOwner(
  provider: ethers.providers.Provider,
  profileAddress: string
): Promise<boolean> {
  try {
    // Simple ABI with just the owner function
    const upAbi = ["function owner() view returns (address)"];
    const contract = new ethers.Contract(profileAddress, upAbi, provider);
    
    // Get owner address and compare with profile address
    const owner = await contract.owner();
    return owner.toLowerCase() === profileAddress.toLowerCase();
  } catch (error) {
    console.error('Error checking owner:', error);
    return false;
  }
}