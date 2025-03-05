// ERC725Utils.ts - Core encoding/decoding functionality
// Note: This file implements the ERC725Y JSON Schema standard defined in LIP-2
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { encodeERC725YValue, decodeERC725YValue } from './ethersAbiDecoder';

// Define your ERC725 schema - this is what defines the metadata structure
export const schema: ERC725JSONSchema[] = [
  {
    name: 'MyTopAccounts',
    key: '0x38a0b0a149d59d46ad9c7fa612f0972948f82cc6f052268ef13a9e7da8a1dc84',
    keyType: 'Singleton',
    valueType: 'address[]',
    valueContent: 'Address',
  },
  // You can add more schema items here as needed
];

// Define the ERC725Value type
export type ERC725Value = string | string[] | number | boolean | Record<string, unknown> | null;

// Define the DecodedData type
export interface DecodedData {
  name: string;
  key: string;
  value: ERC725Value;
}

/**
 * Encodes metadata according to ERC725 schema
 * @param schemaName Name of the schema element to encode
 * @param value Value to encode
 * @returns Encoded data with keys and values
 */
export function encodeMetadata(
  schemaName: string,
  value: ERC725Value
): { keys: string[]; values: string[] } {
  // Find the schema item for this name
  const schemaItem = schema.find(item => item.name === schemaName);
  
  if (!schemaItem) {
    throw new Error(`Schema item "${schemaName}" not found`);
  }
  
  // Process value for encoding safety
  let processedValue: ERC725Value = value;
  
  if (value === null) {
    processedValue = '';
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    // Convert complex objects to JSON strings
    processedValue = JSON.stringify(value);
  } else if (Array.isArray(value)) {
    // Ensure arrays contain only valid values
    processedValue = value.filter(v => v !== null && v !== undefined);
    
    // For address arrays, ensure they're properly formatted
    if (schemaItem.valueType === 'address[]') {
      processedValue = (processedValue as string[]).filter(
        addr => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr)
      );
    }
  }
  
  // For address arrays, use the ethers encoder which handles ABI encoding correctly
  if (schemaItem.valueType === 'address[]' || 
      (schemaItem.valueType.includes('[]') && schemaItem.valueContent === 'Address')) {
    try {
      // Use ethers ABI encoder for address arrays
      const encodedValue = encodeERC725YValue(processedValue, schemaItem.valueType);
      
      return {
        keys: [schemaItem.key],
        values: [encodedValue]
      };
    } catch (error) {
      console.error('Error encoding with ethers ABI:', error);
      // Fall back to ERC725.js encoding
    }
  }
  
  // Standard ERC725.js encoding for other types
  try {
    const erc725js = new ERC725(schema);
    const encodedData = erc725js.encodeData([
      { keyName: schemaName, value: processedValue },
    ]);
    
    return encodedData;
  } catch (erc725Error) {
    console.error('Error encoding with ERC725.js:', erc725Error);
    
    // Last resort fallback for address arrays
    if (schemaItem.valueType === 'address[]' && Array.isArray(processedValue)) {
      try {
        // Manual ABI encoding using ethers
        const encodedValue = encodeERC725YValue(processedValue, 'address[]');
        return {
          keys: [schemaItem.key],
          values: [encodedValue]
        };
      } catch (ethersError) {
        console.error('Final fallback encoding failed:', ethersError);
        throw erc725Error; // Throw the original error if all else fails
      }
    }
    
    throw erc725Error;
  }
}

/**
 * Decodes metadata according to ERC725 schema
 * @param keys The keys from the encoded data
 * @param values The values from the encoded data
 * @returns Decoded data
 */
export function decodeMetadata(
  keys: string[],
  values: string[]
): DecodedData[] {
  if (!keys.length || !values.length) {
    return [];
  }
  
  const results: DecodedData[] = [];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = values[i];
    
    // Find the schema item for this key
    const schemaItem = schema.find(item => item.key === key);
    
    if (schemaItem) {
      // For address arrays, use the ethers decoder
      if (schemaItem.valueType === 'address[]' || 
          (schemaItem.valueType.includes('[]') && schemaItem.valueContent === 'Address')) {
        try {
          const decodedValue = decodeERC725YValue(value, schemaItem.valueType);
          results.push({
            name: schemaItem.name,
            key: key,
            value: decodedValue
          });
          continue; // Skip to the next item
        } catch (error) {
          console.error('Error decoding with ethers ABI:', error);
          // Fall back to ERC725.js decoding
        }
      }
      
      // Standard ERC725.js decoding for other types
      try {
        const erc725js = new ERC725(schema);
        const decodedData = erc725js.decodeData([
          { keyName: key, value }
        ]);
        
        if (Array.isArray(decodedData) && decodedData.length > 0) {
          results.push(decodedData[0] as DecodedData);
        }
      } catch (erc725Error) {
        console.error('Error decoding with ERC725.js:', erc725Error);
        
        // Fallback for raw data
        results.push({
          name: schemaItem.name,
          key: key,
          value: value
        });
      }
    } else {
      // Unknown key, just return the raw data
      results.push({
        name: `Unknown(${key})`,
        key: key,
        value: value
      });
    }
  }
  
  return results;
}

/**
 * Convenience function to decode a single item
 */
export function decodeMetadataSingle(
  key: string,
  value: string
): DecodedData {
  const results = decodeMetadata([key], [value]);
  return results[0] || { name: `Unknown(${key})`, key, value };
}

/**
 * Get the key from schema by name
 * @param name Schema name
 * @returns Key string or undefined if not found
 */
export function getKeyByName(name: string): string | undefined {
  const schemaItem = schema.find(item => item.name === name);
  return schemaItem?.key;
}

/**
 * Get a schema item by name or key
 * @param nameOrKey Schema name or key
 * @returns Schema item or undefined if not found
 */
export function getSchemaItem(nameOrKey: string): ERC725JSONSchema | undefined {
  return schema.find(item => 
    item.name === nameOrKey || item.key === nameOrKey
  );
}