import { ERC725 } from '@erc725/erc725.js';
// 💡 You can load th default schemas directly from @erc725.js
// https://docs.lukso.tech/tools/erc725js/schemas
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725JSONSchema } from '@erc725/erc725.js';

export const SAMPLE_UP_ADDRESS = '0x9139def55c73c12bcda9c44f12326686e3948634';
export const RPC_ENDPOINT = 'https://rpc.lukso.sigmacore.io';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';

// Top6 schema definition
export const top6Schema: ERC725JSONSchema[] = [
  {
    "name": "Top6",
    "key": "0x1fe8930f76ea78062f5fdcb33cd0dd012dfce683baabef33c3f6bcce2d2cea3b",
    "keyType": "Singleton",
    "valueType": "address[]",
    "valueContent":"Address",
  },
];

// Note: You can debug any smart contract by using the ERC725 Tools
// https://erc725-inspect.lukso.tech/inspector?address=0x9139def55c73c12bcda9c44f12326686e3948634&network=testnet

/**
 * Get all data keys from a Universal Profile smart contract
 * @param address The UP address to get data keys from
 * @returns All data keys from the profile
 */
export const getProfileDataKeys = async (address: string = SAMPLE_UP_ADDRESS) => {
  // Initiate erc725.js
  const erc725js = new ERC725(
    lsp3ProfileSchema,
    address,
    RPC_ENDPOINT,
    {
      ipfsGateway: IPFS_GATEWAY,
    },
  );

  // Get all data keys from the profile smart contract
  const profileData = await erc725js.getData();
  return profileData;
};

/**
 * Get Top6 data keys from a contract address
 * @param address The contract address to get Top6 data from
 * @returns Top6 data from the contract
 */
export const getTop6DataKeys = async (address: string = SAMPLE_UP_ADDRESS) => {
  // Initiate erc725.js with Top6 schema
  const erc725js = new ERC725(
    top6Schema,
    address,
    RPC_ENDPOINT,
    {
      ipfsGateway: IPFS_GATEWAY,
    },
  );

  // Get Top6 data from the contract
  const top6Data = await erc725js.getData('Top6');
  return top6Data;
};

// Example usage
// const main = async () => {
//   const data = await getProfileDataKeys();
//   console.log(data);
//   
//   const top6Data = await getTop6DataKeys();
//   console.log(top6Data);
// };
// 
// main().catch(console.error);