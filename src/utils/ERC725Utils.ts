// ERC725Utils.ts - Core encoding/decoding functionality
// Note: This file implements the ERC725Y JSON Schema standard defined in LIP-2
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';

// Define your ERC725 schema - this is what defines the metadata structure
export const schema: ERC725JSONSchema[] = [
  {
    name: 'MyTopAccounts',
    key: '0x38a0b0a149d59d46ad9c7fa612f0972948f82cc6f052268ef13a9e7da8a1dc84',
    keyType: 'Singleton',
    valueType: 'address[]',
    valueContent: 'Address',
  },
];

// Define the ERC725Value type
export type ERC725Value = string | string[] | number | boolean | Record<string, unknown> | null;

export type DecodedData = {
  name: string;
  key: string;
  value: ERC725Value;
};

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
  const erc725js = new ERC725(schema);
  
  const encodedData = erc725js.encodeData([
    { keyName: schemaName, value },
  ]);
  
  return encodedData;
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
  const erc725js = new ERC725(schema);
  
  const decodedData = erc725js.decodeData([
    { keyName: keys[0], value: values[0] }
  ]);
  
  // Convert to the correct DecodedData[] type
  return Array.isArray(decodedData) ? decodedData as DecodedData[] : [decodedData as DecodedData];
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