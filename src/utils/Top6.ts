import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js'

export type AddressType = string;

export const schema: ERC725JSONSchema[] = [
  {
    "name": "Top6",
    "key": "0x9a24e706cd29677181fae33186e93e1fef9d5e33edd111c8b5fa8560cc99650f",
    "keyType": "Singleton",
    "valueType": "address[]",
    "valueContent":"Address",
  },
];

export const RPC_ENDPOINT = 'https://rpc.testnet.lukso.network';

export const createERC725Instance = (address?: string) => {
  return new ERC725(
    schema,
    address, // Optional address
    RPC_ENDPOINT
  );
};

export const erc725js = createERC725Instance();

export const Top6Addresses: AddressType[] = [];

export const encodeTop6Data = (addresses: AddressType[]) => {
  return erc725js.encodeData([
    { keyName: 'Top6', value: addresses },
  ]);
};

/**
 * Decode data using the Top6 schema
 * @param encodedData Object containing the keyName and encoded data from the contract
 * @returns Array of decoded addresses
 */
export const decodeTop6Data = (encodedData: { keyName: string; value: string }) => {
  const decodedData = erc725js.decodeData([encodedData]);
  
  // The decoded data will be in the format [{ name: 'Top6', value: ['0x...', '0x...'] }]
  if (decodedData && decodedData.length > 0 && decodedData[0].value) {
    return decodedData[0].value as AddressType[];
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

/**
 * Fetch and decode Top6 data directly from a contract address
 * @param address The contract address to fetch Top6 data from
 * @returns Promise resolving to an array of Top6 addresses
 */
export const getTop6Addresses = async (address: string): Promise<AddressType[]> => {
  try {
    // Create a new ERC725 instance with the given address
    const contractInstance = createERC725Instance(address);
    
    // Fetch the Top6 data from the contract
    const result = await contractInstance.getData('Top6');
    
    // If the result is valid, return the addresses
    if (result && result.value) {
      return result.value as AddressType[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Top6 addresses:', error);
    return [];
  }
};

// Example usage
// const encodedData = encodeTop6Data(Top6Addresses);
// console.log('encodedData: ', encodedData);
// 
// // Decode example
// const addresses = decodeTop6Data({ keyName: 'Top6', value: encodedData.values[0] });
// console.log('decoded addresses:', addresses);
//
// // Fetch directly from contract
// const fetchedAddresses = await getTop6Addresses('0x123...your-contract-address-here');
// console.log('Fetched addresses:', fetchedAddresses);