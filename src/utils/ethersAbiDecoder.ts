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
    // Guard against invalid input
    if (!data || typeof data !== 'string' || data === '0x') {
      return [];
    }

    // The LUKSO format has multiple offsets before the actual array data
    // 1. First we find the main offset
    const mainOffsetHex = data.substring(0, 66);
    const mainOffset = parseInt(mainOffsetHex.substring(2), 16);
    
    // 2. Locate potential array length position
    // The array length is typically after several offsets
    let lengthPos = 2 + (mainOffset * 2); // Start at the main offset
    
    // Look for array length marker by skipping potential nested offsets
    // Try to find the pattern where we have a small number (array length)
    // followed by address data
    for (let searchPos = lengthPos; searchPos < data.length - 64; searchPos += 64) {
      const valueHex = data.substring(searchPos, searchPos + 64);
      const value = parseInt(valueHex, 16);
      
      // If we find a small value (likely array length) that's reasonable
      if (value > 0 && value < 100) {
        const addresses: string[] = [];
        
        // Check if this is followed by address data
        for (let i = 0; i < value && i < 20; i++) { // Limit to 20 addresses as safety
          const addrPos = searchPos + 64 + (i * 64);
          
          if (addrPos + 64 <= data.length) {
            const addrHex = '0x' + data.substring(addrPos + 24, addrPos + 64);
            
            if (/^0x[a-fA-F0-9]{40}$/.test(addrHex) && 
                !addrHex.startsWith('0x00000000000000000000')) {
              try {
                const checksumAddr = ethers.utils.getAddress(addrHex);
                addresses.push(checksumAddr);
              } catch {
                // Invalid address, skip
              }
            }
          }
        }
        
        // If we found valid addresses, return them
        if (addresses.length > 0) {
          return addresses;
        }
      }
    }
    
    // Fallback: scan for address patterns in the data
    const addressPattern = /[a-fA-F0-9]{40}/g;
    const matches = data.match(addressPattern) || [];
    
    return matches
      .map(match => '0x' + match)
      .filter(addr => !addr.startsWith('0x00000000000000000000'))
      .map(addr => {
        try {
          return ethers.utils.getAddress(addr);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];
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
    console.log('Encoding address array:', addresses);
    
    // Validate addresses before encoding
    if (!Array.isArray(addresses)) {
      console.error('Invalid addresses format - not an array:', addresses);
      return '0x';
    }
    
    // Filter out any invalid or undefined addresses
    const validAddresses: string[] = addresses.filter((address: string): boolean => 
      typeof address === 'string' && 
      /^0x[a-fA-F0-9]{40}$/.test(address)
    );
    
    if (validAddresses.length === 0) {
      console.error('No valid addresses to encode');
      return '0x';
    }
    
    console.log('Valid addresses for encoding:', validAddresses);
    
    // Use try-catch to catch any encoding errors
    try {
      const encoded: string = ethers.utils.defaultAbiCoder.encode(['address[]'], [validAddresses]);
      console.log('Successfully encoded address array:', encoded);
      return encoded;
    } catch (encodeError) {
      console.error('Error during ABI encoding:', encodeError);
      return '0x';
    }
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
  // Guard against invalid input
  if (!data || typeof data !== 'string') {
    console.warn('Invalid or missing data for decoding, returning default:', data, 'Type:', valueType);
    return valueType === 'address[]' ? [] : null;
  }

  try {
    // Special handling for address[] which seems to have a different format
    if (valueType === 'address[]') {
      console.log('Decoding address array, raw data:', data);
      return decodeAddressArray(data);
    }
    
    // Handle other types
    const abiTypeMap: Record<string, string> = {
      'address': 'address',
      'address[]': 'address[]',
      'uint256': 'uint256',
      'uint128': 'uint128',
      'bytes32': 'bytes32',
      'bytes': 'string', // Changed to 'string' to match ethers ABI coder expectations
      'string': 'string',
      'bool': 'bool'
    };
    
    // Handle tuples
    if (valueType.startsWith('(') && valueType.endsWith(')')) {
      const innerTypes: string[] = valueType.slice(1, -1).split(',');
      const abiTypes: string[] = innerTypes.map((t: string): string => abiTypeMap[t] || t);
      return ethers.utils.defaultAbiCoder.decode(abiTypes, data);
    }
    
    // Handle arrays
    if (valueType.endsWith('[]')) {
      const baseType: string = valueType.slice(0, -2);
      const abiType: string = abiTypeMap[baseType] ? `${abiTypeMap[baseType]}[]` : valueType;
      const decoded: unknown = ethers.utils.defaultAbiCoder.decode([abiType], data)[0];
      // Restrict to string[] since our schema only uses address[]
      return decoded as string[];
    }
    
    // Handle basic types
    const abiType: string = abiTypeMap[valueType] || valueType;
    console.log('Decoding basic type:', abiType, 'with data:', data);
    const decoded: unknown = ethers.utils.defaultAbiCoder.decode([abiType], data)[0];
    return decoded as string | number | boolean;
  } catch (error) {
    console.error(`Error decoding value with type ${valueType}:`, error);
    console.error('Raw data:', data);
    return valueType === 'address[]' ? [] : null; // Safe default based on type
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
    console.log('Encoding value:', value, 'with type:', valueType);
    
    // Handle null or undefined values
    if (value === null || value === undefined) {
      console.log('Encoding null/undefined value as empty bytes');
      return '0x';
    }
    
    // Special handling for address[] to prevent encoding errors
    if (valueType === 'address[]') {
      if (!Array.isArray(value)) {
        console.error('Expected array for address[] type but got:', typeof value);
        return '0x';
      }
      
      return encodeAddressArray(value as string[]);
    }
    
    // Convert ERC725Y valueType to ethers ABI type
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
      const innerTypes: string[] = valueType.slice(1, -1).split(',');
      const abiTypes: string[] = innerTypes.map((t: string): string => abiTypeMap[t] || t);
      
      // Ensure value is properly formatted
      const tupleValue: unknown[] = Array.isArray(value) ? value : [value];
      console.log('Encoding tuple with types:', abiTypes, 'and values:', tupleValue);
      
      return ethers.utils.defaultAbiCoder.encode(abiTypes, tupleValue);
    }
    
    // Handle arrays
    if (valueType.endsWith('[]')) {
      const baseType: string = valueType.slice(0, -2);
      const abiType: string = abiTypeMap[baseType] ? `${abiTypeMap[baseType]}[]` : valueType;
      
      // Ensure value is an array
      if (!Array.isArray(value)) {
        console.error('Expected array for type', valueType, 'but got:', typeof value);
        return '0x';
      }
      
      // Filter out invalid values and assert the array type
      const validValues = (value as (string | number | boolean)[]).filter(v => v !== undefined && v !== null);
      console.log('Encoding array with type:', abiType, 'and values:', validValues);
      
      return ethers.utils.defaultAbiCoder.encode([abiType], [validValues]);
    }
    
    // Handle basic types
    const abiType: string = abiTypeMap[valueType] || valueType;
    console.log('Encoding basic type:', abiType, 'with value:', value);
    
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
  if (!data || typeof data !== 'string' || data.length < 194) {
    return { error: 'Invalid or insufficient ABI data format' };
  }
  
  try {
    const offsetHex: string = data.substring(0, 66);
    const offset: number = parseInt(offsetHex, 16);
    
    const secondOffsetHex: string = data.substring(66, 130);
    const secondOffset: number = parseInt(secondOffsetHex, 16);
    
    // Try to find where the array length might be stored
    let lengthPosition: number = 130;
    if (offset === 32) {
      // Common case: offset is 32, array data starts at position 32 bytes (64 hex chars + 2 for '0x') into the data
      lengthPosition = 66;
    } else if (offset === 96) {
      // Another common case: offset is 96, array length might be at a different position
      lengthPosition = 194;
    }
    
    const lengthHex: string = data.substring(lengthPosition, lengthPosition + 64);
    const arrayLength: number = parseInt(lengthHex, 16);
    
    // Extract addresses
    const addresses: string[] = [];
    const startOfAddresses: number = lengthPosition + 64;
    
    for (let i = 0; i < arrayLength; i++) {
      const startIndex: number = startOfAddresses + (i * 64);
      const addressHex: string = '0x' + data.substring(startIndex + 24, startIndex + 64);
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

/**
 * Decodes a specific address at the given index from an ABI-encoded address array
 * 
 * @param data The raw ABI-encoded data
 * @param index The index of the address to retrieve (0-based)
 * @returns The address at the specified index or null if not found
 */
export function decodeAddressAtIndex(data: string, index: number): string | null {
  try {
    // Guard against invalid input
    if (!data || typeof data !== 'string' || data === '0x' || index < 0) {
      console.log('Invalid data or index for address decoding:', data, index);
      return null;
    }

    console.log(`Decoding address at index ${index}, raw data:`, data);
    
    // The format follows ABI encoding:
    // 1. 0x + first 64 chars: offset pointer
    // 2. Next 64 chars: Array length (at the offset position)
    // 3. Each address padded to 32 bytes (64 chars)
    
    // Find the array length
    const offsetHex = data.substring(0, 66);
    const offset = parseInt(offsetHex.substring(2), 16);
    console.log('Offset pointer:', offset, 'hex:', offsetHex);
    
    // Position where array length is stored (at the offset position)
    const lengthPos = 2 + (offset * 2); // convert bytes to hex chars
    
    if (lengthPos + 64 <= data.length) {
      const lengthHex = '0x' + data.substring(lengthPos, lengthPos + 64);
      const arrayLength = parseInt(lengthHex.substring(2), 16);
      console.log('Array length:', arrayLength, 'hex:', lengthHex);
      
      // Check if index is within range
      if (index >= arrayLength) {
        console.log(`Index ${index} is out of range, array length is ${arrayLength}`);
        return null;
      }
      
      // Start position of the first address (after the length field)
      const startAddressPos = lengthPos + 64;
      
      // Calculate position of the requested address
      const addrPos = startAddressPos + (index * 64);
      
      if (addrPos + 64 <= data.length) {
        // Address is in the last 40 chars of the 64-char segment
        // (20 bytes of a 32-byte word)
        const addrHex = '0x' + data.substring(addrPos + 24, addrPos + 64);
        
        if (/^0x[a-fA-F0-9]{40}$/.test(addrHex) && 
            !addrHex.startsWith('0x00000000000000000000')) {
          try {
            // Format with proper checksum
            const checksumAddr = ethers.utils.getAddress(addrHex);
            console.log(`Found valid address at index ${index}:`, checksumAddr);
            return checksumAddr;
          } catch {
            console.log('Invalid checksum for address:', addrHex);
          }
        }
      }
    }
    
    console.log(`No valid address found at index ${index}`);
    return null;
  } catch (error) {
    console.error(`Error decoding address at index ${index}:`, error);
    return null;
  }
}

/**
 * Updates an address at a specific index in an ABI-encoded address array
 * 
 * @param data The raw ABI-encoded data
 * @param index The index of the address to update (0-based)
 * @param newAddress The new address to set at the specified index
 * @returns The updated ABI-encoded data or null if the operation failed
 */
export function updateAddressAtIndex(data: string, index: number, newAddress: string): string | null {
  try {
    // Guard against invalid input
    if (!data || typeof data !== 'string' || data === '0x' || index < 0) {
      console.log('Invalid data or index for address update:', data, index);
      return null;
    }
    
    if (!newAddress || !/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      console.log('Invalid new address:', newAddress);
      return null;
    }
    
    console.log(`Updating address at index ${index} to ${newAddress}`);
    
    // First decode the entire array
    const addresses = decodeAddressArray(data);
    
    // Check if index is within range
    if (index >= addresses.length) {
      console.log(`Index ${index} is out of range, array length is ${addresses.length}`);
      return null;
    }
    
    // Update the address at the specified index
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = newAddress;
    
    // Re-encode the updated array
    return encodeAddressArray(updatedAddresses);
  } catch (error) {
    console.error(`Error updating address at index ${index}:`, error);
    return null;
  }
}