// ERC725Utils.ts - Core encoding/decoding functionality
// Note: This file does not use the deprecated @lukso/lsp-factory.js library
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

/**
 * Encodes metadata according to ERC725 schema
 * @param schemaName Name of the schema element to encode
 * @param value Value to encode
 * @returns Encoded data with keys and values
 */
export function encodeMetadata(
  schemaName: string,
  value: any
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
): any {
  const erc725js = new ERC725(schema);
  
  const decodedData = erc725js.decodeData([
    { keyName: keys[0], value: values[0] }
  ]);
  
  return decodedData;
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