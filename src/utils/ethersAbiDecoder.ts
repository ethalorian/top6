// ethersAbiDecoder.ts - Specialized decoder for Ethereum ABI-encoded data
import { ethers } from 'ethers';

/**
 * Decodes an ABI-encoded array of addresses
 * 
 * @param data The raw ABI-encoded data
 * @returns Array of addresses
 */
export function decodeAddressArray(data: string): string[] {
  try {
    // The encoded data is in Ethereum ABI format
    // For address[] we need to use defaultAbiCoder.decode
    const decoded = ethers.utils.defaultAbiCoder.decode(['address[]'], data);
    return decoded[0];
  } catch (error) {
    console.error('Error decoding address array:', error);
    return [];
  }
}

/**
 * Encodes an array of addresses to ABI format
 * 
 * @param addresses Array of addresses to encode
 * @returns ABI-encoded data
 */
export function encodeAddressArray(addresses: string[]): string {
  try {
    return ethers.utils.defaultAbiCoder.encode(['address[]'], [addresses]);
  } catch (error) {
    console.error('Error encoding address array:', error);
    return '0x';
  }
}

/**
 * Auto-detects and decodes various ERC725Y value types based on valueType
 * 
 * @param data The raw data to decode
 * @param valueType The ERC725Y valueType string
 * @returns The decoded value
 */
export function decodeERC725YValue(data: string, valueType: string): string | string[] | number | boolean | Record<string, unknown> | null {
  try {
    // Special handling for address[] which seems to have a different format
    if (valueType === 'address[]') {
      try {
        // First try standard decoding
        const decoded = ethers.utils.defaultAbiCoder.decode(['address[]'], data)[0];
        // Validate each address to ensure it's a proper Ethereum address
        const validAddresses = decoded.filter((addr: string) => 
          typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr)
        );
        
        if (validAddresses.length > 0) {
          return validAddresses;
        }
        
        throw new Error('No valid addresses found in standard decoding');
      } catch (e) {
        console.log('Standard address[] decoding failed, trying custom approach');
        
        // LUKSO UP format often has a different structure
        // Extract addresses directly from the raw data
        const addresses: string[] = [];
        
        // Skip first 64 bytes (32 bytes for offset, 32 bytes for array length)
        // Each address is 32 bytes (padded) after that
        for (let i = 66 + 64; i < data.length; i += 64) {
          if (i + 40 <= data.length) {
            // Extract the address (20 bytes = 40 chars)
            const address = '0x' + data.substring(i + 24, i + 64);
            // Only include valid Ethereum addresses (40 hex chars after 0x)
            if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
              addresses.push(address);
            }
          }
        }
        
        if (addresses.length > 0) {
          return addresses;
        }
        
        // If all else fails, try a very strict extraction of just addresses
        const addressRegex = /0x[0-9a-fA-F]{40}/g;
        const matches = data.match(addressRegex);
        
        if (matches && matches.length > 0) {
          return matches;
        }
        
        // Fall back to original method if no addresses found
        throw e;
      }
    }
    
    // Handle other types as before
    const abiTypeMap: Record<string, string> = {
      'address': 'address',
      'address[]': 'address[]',
      'uint256': 'uint256',
      'bytes32': 'bytes32',
      'bytes': 'bytes',
      'string': 'string',
      'bool': 'bool'
    };
    
    // Handle tuples
    if (valueType.startsWith('(') && valueType.endsWith(')')) {
      const innerTypes = valueType.slice(1, -1).split(',');
      const abiTypes = innerTypes.map(t => abiTypeMap[t] || t);
      return ethers.utils.defaultAbiCoder.decode(abiTypes, data);
    }
    
    // Handle arrays
    if (valueType.endsWith('[]')) {
      const baseType = valueType.slice(0, -2);
      const abiType = abiTypeMap[baseType] ? `${abiTypeMap[baseType]}[]` : valueType;
      return ethers.utils.defaultAbiCoder.decode([abiType], data)[0];
    }
    
    // Handle basic types
    const abiType = abiTypeMap[valueType] || valueType;
    return ethers.utils.defaultAbiCoder.decode([abiType], data)[0];
  } catch (error) {
    console.error(`Error decoding value with type ${valueType}:`, error);
    console.error('Raw data:', data);
    return null;
  }
}

/**
 * Encodes a value according to ERC725Y valueType
 * 
 * @param value The value to encode
 * @param valueType The ERC725Y valueType string
 * @returns The ABI-encoded data
 */
export function encodeERC725YValue(value: string | string[] | number | boolean | Record<string, unknown>, valueType: string): string {
  try {
    // Convert ERC725Y valueType to ethers ABI type (same mapping as above)
    const abiTypeMap: Record<string, string> = {
      'address': 'address',
      'address[]': 'address[]',
      'uint256': 'uint256',
      'bytes32': 'bytes32',
      'bytes': 'bytes',
      'string': 'string',
      'bool': 'bool'
    };
    
    // Handle tuples
    if (valueType.startsWith('(') && valueType.endsWith(')')) {
      const innerTypes = valueType.slice(1, -1).split(',');
      const abiTypes = innerTypes.map(t => abiTypeMap[t] || t);
      return ethers.utils.defaultAbiCoder.encode(abiTypes, Array.isArray(value) ? value : [value]);
    }
    
    // Handle arrays
    if (valueType.endsWith('[]')) {
      const baseType = valueType.slice(0, -2);
      const abiType = abiTypeMap[baseType] ? `${abiTypeMap[baseType]}[]` : valueType;
      return ethers.utils.defaultAbiCoder.encode([abiType], [value]);
    }
    
    // Handle basic types
    const abiType = abiTypeMap[valueType] || valueType;
    return ethers.utils.defaultAbiCoder.encode([abiType], [value]);
  } catch (error) {
    console.error(`Error encoding value with type ${valueType}:`, error);
    return '0x';
  }
}