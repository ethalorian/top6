import { ethers } from 'ethers';

/**
 * Validates if the provided string is a valid Ethereum address
 * @param address Address to validate
 * @returns True if the address is valid
 */
export function isValidAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

/**
 * Normalizes an Ethereum address to checksum format
 * @param address Address to normalize
 * @returns Checksummed address or null if invalid
 */
export function normalizeAddress(address: string): string | null {
  try {
    if (!isValidAddress(address)) {
      return null;
    }
    return ethers.utils.getAddress(address);
  } catch (error) {
    return null;
  }
}