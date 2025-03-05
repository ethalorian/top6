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
    console.log('Decoding ABI address array, raw data:', data);
    
    // The encoded data is in Ethereum ABI format for dynamic arrays:
    // 1. First 32 bytes (offset where array data starts)
    // 2. Location of array length (another 32 bytes)
    // 3. Array length (32 bytes)
    // 4. Each address (20 bytes padded to 32 bytes)
    
    const decoded = ethers.utils.defaultAbiCoder.decode(['address[]'], data);
    console.log('Decoded to clean address array:', decoded[0]);
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
    // Special handling for address[] which is especially important for LUKSO UP
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
      } catch {  // Not capturing the error variable at all
        console.log('Standard address[] decoding failed, trying custom approach');
        
        // Try a different approach - extract any valid addresses from the data
        // This is much more reliable than trying to guess the exact layout
        const addresses: string[] = [];
        
        // Process the data in 32-byte (64 hex chars) chunks
        for (let i = 2; i < data.length; i += 64) {
          if (i + 64 <= data.length) {
            // The last 20 bytes of each 32-byte chunk might be an address
            const potentialAddress = '0x' + data.substring(i + 24, i + 64);
            
            // Only include valid Ethereum addresses
            if (/^0x[0-9a-fA-F]{40}$/.test(potentialAddress)) {
              // Quick check to avoid false positives - addresses shouldn't be all zeros
              if (potentialAddress !== '0x0000000000000000000000000000000000000000') {
                addresses.push(potentialAddress);
              }
            }
          }
        }
        
        if (addresses.length > 0) {
          console.log('Found addresses using alternative extraction:', addresses);
          return addresses;
        }
        
        // If all else fails, at least provide debugging info
        console.error('Could not extract addresses using any method');
        console.error('Raw data:', data);
        return [];
      }
    }
    
    // Handle other types
    const abiTypeMap: Record<string, string> = {
      'address': 'address',
      'address[]': 'address[]',
      'uint256': 'uint256',
      'uint128': 'uint128',
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
export function encodeERC725YValue(value: string | string[] | number | boolean | Record<string, unknown> | null, valueType: string): string {
  try {
    // Handle null values
    if (value === null) {
      // For null values, return an empty bytes value
      return '0x';
    }
    
    // Convert ERC725Y valueType to ethers ABI type (same mapping as above)
    const abiTypeMap: Record<string, string> = {
      'address': 'address',
      'address[]': 'address[]',
      'uint256': 'uint256',
      'uint128': 'uint128',
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

/**
 * Explains the structure of ABI-encoded address array data
 * This is useful for debugging and understanding the format
 * 
 * @param data The raw ABI-encoded data
 * @returns An explanation object with component parts
 */
export function explainAddressArrayEncoding(data: string): Record<string, string> {
  if (!data.startsWith('0x') || data.length < 194) {
    return { error: 'Invalid ABI data format' };
  }
  
  // The standard layout for an ABI-encoded address[] is:
  // 1. First 32 bytes (0x + 64 chars): Offset pointer
  // 2. Next 32 bytes: Usually a second offset
  // 3. Next 32 bytes: Additional metadata or array length
  // 4. Next 32 bytes: Array length
  // 5. Remaining 32-byte chunks: The addresses (padded to 32 bytes each)
  
  try {
    const offsetHex = data.substring(0, 66);
    const offset = parseInt(offsetHex, 16);
    
    const secondOffsetHex = data.substring(66, 130);
    const secondOffset = parseInt(secondOffsetHex, 16);
    
    // Try to find where the array length might be stored
    let lengthPosition = 130;
    if (offset === 32) {
      // Common case: offset is 32, array data starts at position 32 bytes (64 hex chars + 2 for '0x') into the data
      lengthPosition = 66;
    } else if (offset === 96) {
      // Another common case: offset is 96, array length might be at a different position
      lengthPosition = 194;
    }
    
    const lengthHex = data.substring(lengthPosition, lengthPosition + 64);
    const arrayLength = parseInt(lengthHex, 16);
    
    // Extract addresses
    const addresses: string[] = [];
    const startOfAddresses = lengthPosition + 64;
    
    for (let i = 0; i < arrayLength; i++) {
      const startIndex = startOfAddresses + (i * 64);
      const addressHex = '0x' + data.substring(startIndex + 24, startIndex + 64);
      addresses.push(addressHex);
    }
    
    return {
      format: 'ABI-encoded address[]',
      offsetPointer: offsetHex,
      offsetValue: `${offset} bytes`,
      secondOffset: secondOffsetHex,
      secondOffsetValue: `${secondOffset} bytes`,
      lengthHex: lengthHex,
      arrayLength: arrayLength.toString(),
      addresses: JSON.stringify(addresses)
    };
  } catch (error) {
    console.error('Error explaining ABI data:', error);
    return { error: 'Failed to parse ABI data: ' + (error as Error).message };
  }
}