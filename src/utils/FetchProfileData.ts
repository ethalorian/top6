import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { top6Schema } from './GetDataKeys';

export const SAMPLE_UP_ADDRESS = '0xEda145b45f76EDB44F112B0d46654044E7B8F319';
export const RPC_ENDPOINT = 'https://rpc.lukso.sigmacore.io';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';

export type AddressType = string;

// Creates a new ERC725 instance for the given address
export const createERC725Instance = (address: string) => {
  return new ERC725(
    lsp3ProfileSchema,
    address,
    RPC_ENDPOINT,
    {
      ipfsGateway: IPFS_GATEWAY,
    },
  );
};

// Creates a new ERC725 instance with Top6 schema for the given address
export const createTop6ERC725Instance = (address: string) => {
  return new ERC725(
    top6Schema,
    address,
    RPC_ENDPOINT,
    {
      ipfsGateway: IPFS_GATEWAY,
    },
  );
};

// 💡 Note: You can debug any smart contract using the ERC725 Tools
// 👉 https://erc725-inspect.lukso.tech/inspector?address=0xEda145b45f76EDB44F112B0d46654044E7B8F319&network=testnet

// Download and verify the profile metadata JSON file
export const fetchProfileMetadata = async (address: string) => {
  const erc725js = createERC725Instance(address);
  const profileMetaData = await erc725js.fetchData('LSP3Profile');
  return profileMetaData;
};

// Fetch all of the profile's issued assets
export const fetchIssuedAssets = async (address: string) => {
  const erc725js = createERC725Instance(address);
  const issuedAssetsDataKey = await erc725js.fetchData('LSP12IssuedAssets[]');
  return issuedAssetsDataKey;
};

// Fetch all owned assets of the profile
export const fetchReceivedAssets = async (address: string) => {
  const erc725js = createERC725Instance(address);
  const receivedAssetsDataKey = await erc725js.fetchData('LSP5ReceivedAssets[]');
  return receivedAssetsDataKey;
};

// Fetch the profile's universal receiver
export const fetchUniversalReceiver = async (address: string) => {
  const erc725js = createERC725Instance(address);
  const universalReceiverDataKey = await erc725js.fetchData('LSP1UniversalReceiverDelegate');
  return universalReceiverDataKey;
};

/**
 * Fetch Top6 addresses directly from a contract address
 * @param address The contract address to fetch Top6 data from
 * @returns Promise resolving to an array of Top6 addresses
 */
export const fetchTop6Addresses = async (address: string): Promise<AddressType[]> => {
  try {
    // Check if address is valid
    if (!address || !address.startsWith('0x')) {
      console.error('Invalid address format:', address);
      return [];
    }

    console.log(`Attempting to fetch Top6 data from address: ${address}`);
    
    // Create a new ERC725 instance with the given address and Top6 schema
    const contractInstance = createTop6ERC725Instance(address);
    
    try {
      // Try to fetch the Top6 data from the contract
      const result = await contractInstance.getData('Top6');
      
      // If the result is valid, return the addresses
      if (result && result.value) {
        console.log('Successfully fetched Top6 addresses:', result.value);
        return result.value as AddressType[];
      } else {
        console.log('No Top6 data found for address:', address);
        return [];
      }
    } catch (innerError: any) {
      // Handle specific error for ERC725Y interface issues
      if (innerError.message && innerError.message.includes('does not support ERC725Y interface')) {
        console.warn(`Contract ${address} does not support the ERC725Y interface. This is normal if it's not a Universal Profile contract.`);
      }
      
      // Log the error for debugging but return empty array to avoid breaking the UI
      console.error('Error fetching Top6 addresses:', innerError);
      return [];
    }
  } catch (error) {
    console.error('Unexpected error in fetchTop6Addresses:', error);
    return [];
  }
};

// Example usage function
export const fetchAllProfileData = async (address: string = SAMPLE_UP_ADDRESS) => {
  const profileData = await fetchProfileMetadata(address);
  const issuedAssets = await fetchIssuedAssets(address);
  const receivedAssets = await fetchReceivedAssets(address);
  const universalReceiver = await fetchUniversalReceiver(address);
  const top6Addresses = await fetchTop6Addresses(address);
  
  return {
    profileData,
    issuedAssets,
    receivedAssets,
    universalReceiver,
    top6Addresses
  };
};