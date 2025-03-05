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
    // Special handling for address[] which seems to have a different format
    if (valueType === 'address[]') {
      console.log('Decoding address array, raw data:', data);
      
      try {
        // First try standard decoding
        const decoded = ethers.utils.defaultAbiCoder.decode(['address[]'], data)[0];
        console.log('Standard decoding result:', decoded);
        
        // Validate addresses - only accept valid Ethereum addresses
        const validAddresses = decoded
          .filter((addr: string) => 
            typeof addr === 'string' && 
            /^0x[a-fA-F0-9]{40}$/.test(addr) &&
            // Exclude special addresses that are actually metadata
            !addr.startsWith('0x000000000000000000000000000000000000000')
          );
        
        if (validAddresses.length > 0) {
          console.log('Valid addresses after filtering:', validAddresses);
          return validAddresses;
        }
        
        throw new Error('No valid addresses found in standard decoding');
      } catch {
        console.log('Standard decoding failed, trying LUKSO specific format');
        
        // Based on the specific LUKSO format we're seeing:
        // Find the valid Ethereum addresses by looking at each 32-byte chunk
        // and filtering for addresses that don't start with many zeros
        
        const addresses: string[] = [];
        
        // Process 32-byte chunks
        for (let i = 2; i < data.length / 64; i++) {
          const start = i * 64;
          const end = start + 64;
          
          if (end <= data.length) {
            // Get the last 20 bytes (40 chars) of each 32-byte chunk
            const addressCandidate = '0x' + data.substring(start + 24, end);
            
            // Only include if it's a valid address and not a special metadata address
            if (/^0x[a-fA-F0-9]{40}$/.test(addressCandidate) && 
                !addressCandidate.startsWith('0x00000000000000000000000000000000000000')) {
              try {
                addresses.push(ethers.utils.getAddress(addressCandidate));
              } catch {
                // Skip if not valid checksum
              }
            }
          }
        }
        
        console.log('LUKSO format addresses:', addresses);
        return addresses;
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