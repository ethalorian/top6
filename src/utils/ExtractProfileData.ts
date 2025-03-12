import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import 'isomorphic-fetch';
import { FetchDataOutput } from '@erc725/erc725.js/build/main/src/types/decodeData.js';
import { top6Schema } from './GetDataKeys';

// Static variables
export const RPC_ENDPOINT = 'https://rpc.testnet.lukso.network';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';
export const SAMPLE_PROFILE_ADDRESS = '0x9139def55c73c12bcda9c44f12326686e3948634';

// 💡 Note: You can debug any smart contract by using the ERC725 Tools
// 👉 https://erc725-inspect.lukso.tech/inspector?address=0x9139def55c73c12bcda9c44f12326686e3948634&network=testnet

// Parameters for ERC725 Instance
export const config = { ipfsGateway: IPFS_GATEWAY };

// Profile data interface
export interface ProfileMetadata {
  name?: string;
  description?: string;
  links?: any[];
  tags?: string[];
}

// Picture data interface
export interface ProfilePictures {
  backgroundImageLinks: any[];
  profileImageLinks: any[];
  fullSizeBackgroundImg?: string;
  fullSizeProfileImg?: string;
}

// Top6 data interface
export interface Top6Data {
  addresses: string[];
}

export type AddressType = string;

// Fetchable metadata information
let name: string;
let description: string;
let links: any = [];
let firstLinkTitle: string;
let firstLinkURL: string;
let tags: string[] = [];
let firstTag;

// Fetchable picture information
const backgroundImageLinks: any[] = [];
let fullSizeBackgroundImg;
const profileImageLinks: any[] = [];
let fullSizeProfileImg;

/*
 * Fetch the @param's Universal Profile's
 * LSP3 data
 *
 * @param address of Universal Profile
 * @return string JSON or custom error
 */
export async function fetchProfileData(address: string): Promise<FetchDataOutput> {
  try {
    const profile = new ERC725(erc725schema, address, RPC_ENDPOINT, config);

    const fetchedData = await profile.fetchData('LSP3Profile');

    if (!fetchedData || !fetchedData.value) {
      throw new Error('Could not fetch profile data');
    }

    return fetchedData;
  } catch (error) {
    throw new Error(`This is not an ERC725 Contract: ${error}`);
  }
}

/*
 * Fetch metadata information from the JSON dataset of
 * a Universal Profile
 * 
 * @param address of Universal Profile
 * @return ProfileMetadata object containing profile information
 */
export async function fetchProfileMetadata(address: string): Promise<ProfileMetadata> {
  const profileData = await fetchProfileData(address);
  const metadata: ProfileMetadata = {};

  if (
    profileData.value &&
    typeof profileData.value === 'object' &&
    'LSP3Profile' in profileData.value
  ) {
    // Read JSON
    metadata.name = profileData.value.LSP3Profile.name;
    metadata.description = profileData.value.LSP3Profile.description;
    metadata.links = profileData.value.LSP3Profile.links;
    metadata.tags = profileData.value.LSP3Profile.tags;
  }

  return metadata;
}

/* Fetch picture information from the JSON dataset of
 * a Universal Profile
 *
 * @param address of Universal Profile
 * @return ProfilePictures object containing image URLs
 */
export async function fetchPictureData(address: string): Promise<ProfilePictures> {
  const pictureData = await fetchProfileData(address);
  const pictures: ProfilePictures = {
    backgroundImageLinks: [],
    profileImageLinks: [],
  };

  if (
    pictureData.value &&
    typeof pictureData.value === 'object' &&
    'LSP3Profile' in pictureData.value
  ) {
    // Read JSON
    const backgroundImagesIPFS = pictureData.value.LSP3Profile.backgroundImage;
    const profileImagesIPFS = pictureData.value.LSP3Profile.profileImage;
    try {
      for (const i in backgroundImagesIPFS) {
        pictures.backgroundImageLinks.push([
          i,
          backgroundImagesIPFS[i].url.replace('ipfs://', IPFS_GATEWAY),
        ]);
      }

      for (const i in profileImagesIPFS) {
        pictures.profileImageLinks.push([
          i,
          profileImagesIPFS[i].url.replace('ipfs://', IPFS_GATEWAY),
        ]);
      }

      if (pictures.backgroundImageLinks.length > 0) {
        pictures.fullSizeBackgroundImg = pictures.backgroundImageLinks[0][1];
      }
      
      if (pictures.profileImageLinks.length > 0) {
        pictures.fullSizeProfileImg = pictures.profileImageLinks[0][1];
      }
    } catch (error) {
      console.error('Could not fetch images: ', error);
    }
  }

  return pictures;
}

/**
 * Decode data using the Top6 schema
 * @param rawValue The raw encoded value from the contract
 * @returns Array of decoded addresses
 */
export async function extractTop6Data(address: string): Promise<Top6Data> {
  try {
    // Create an ERC725 instance with the Top6 schema
    const profile = new ERC725(top6Schema, address, RPC_ENDPOINT, config);
    
    // Fetch the Top6 data
    const fetchedData = await profile.getData('Top6');
    
    // Return the decoded addresses
    if (fetchedData && fetchedData.value) {
      return { addresses: fetchedData.value as AddressType[] };
    }
    
    return { addresses: [] };
  } catch (error) {
    console.error('Error extracting Top6 data:', error);
    return { addresses: [] };
  }
}

// Debug
fetchProfileMetadata(SAMPLE_PROFILE_ADDRESS);
fetchPictureData(SAMPLE_PROFILE_ADDRESS);
// extractTop6Data(SAMPLE_PROFILE_ADDRESS);