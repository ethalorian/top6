import { ERC725 } from '@erc725/erc725.js';
// 💡 You can load th default schemas directly from @erc725.js
// https://docs.lukso.tech/tools/erc725js/schemas
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';

export const SAMPLE_UP_ADDRESS = '0x9139def55c73c12bcda9c44f12326686e3948634';
export const RPC_ENDPOINT = 'https://rpc.testnet.lukso.network';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';

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

// Example usage
// const main = async () => {
//   const data = await getProfileDataKeys();
//   console.log(data);
// };
// 
// main().catch(console.error);