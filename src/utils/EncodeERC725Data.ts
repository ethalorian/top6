import { ERC725 } from '@erc725/erc725.js';
import { top6Schema } from './GetDataKeys';

export type AddressType = string;
export const RPC_ENDPOINT = 'https://rpc.lukso.sigmacore.io';

// Define a placeholder value for empty slots
export const EMPTY_SLOT_PLACEHOLDER = '0x0000000000000000000000000000000000000000';

/**
 * Create an ERC725 instance with the Top6 schema
 * @param address Optional contract address
 * @returns ERC725 instance with Top6 schema
 */
export const createERC725InstanceForEncoding = (address?: string) => {
  return new ERC725(
    top6Schema,
    address, // Optional address
    RPC_ENDPOINT
  );
};

/**
 * Encode Top6 addresses data according to ERC725 schema
 * @param addresses Array of addresses to encode (may contain empty slots)
 * @returns Encoded data object with keyName and encoded value
 */
export const encodeTop6Data = (addresses: AddressType[]) => {
  // Replace empty addresses with the placeholder address
  const processedAddresses = addresses.map(addr => 
    !addr || addr.trim() === '' ? EMPTY_SLOT_PLACEHOLDER : addr
  );
  
  const erc725js = createERC725InstanceForEncoding();
  return erc725js.encodeData([
    { keyName: 'Top6', value: processedAddresses },
  ]);
};

/**
 * Decode data using the Top6 schema
 * @param encodedData Object containing the keyName and encoded data from the contract
 * @returns Array of decoded addresses (with placeholders replaced by empty strings)
 */
export const decodeTop6Data = (encodedData: { keyName: string; value: string }) => {
  const erc725js = createERC725InstanceForEncoding();
  const decodedData = erc725js.decodeData([encodedData]);
  
  // The decoded data will be in the format [{ name: 'Top6', value: ['0x...', '0x...'] }]
  if (decodedData && decodedData.length > 0 && decodedData[0].value) {
    // Replace placeholder addresses with empty strings
    return (decodedData[0].value as AddressType[]).map(addr => 
      addr === EMPTY_SLOT_PLACEHOLDER ? '' : addr
    );
  }
  
  return [];
};

/**
 * Decode raw contract data for Top6
 * @param rawValue The raw encoded value from the contract
 * @returns Array of decoded addresses
 */
export const decodeRawTop6Data = (rawValue: string) => {
  // Create the proper format for the decodeData method
  const encodedData = {
    keyName: 'Top6',
    value: rawValue
  };
  
  return decodeTop6Data(encodedData);
};

// Example usage:
// const testAddresses = [
//   '0x1234567890123456789012345678901234567890',
//   '0x0987654321098765432109876543210987654321'
// ];
// 
// // Encode the addresses
// const encodedData = encodeTop6Data(testAddresses);
// console.log('Encoded data:', encodedData);
// 
// // Decode the encoded data
// const decodedAddresses = decodeTop6Data({ keyName: 'Top6', value: encodedData.values[0] });
// console.log('Decoded addresses:', decodedAddresses); 