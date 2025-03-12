import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import 'isomorphic-fetch';
import { FetchDataOutput } from '@erc725/erc725.js/build/main/src/types/decodeData.js';
import { top6Schema } from './GetDataKeys';

// Static variables
export const RPC_ENDPOINT = 'https://rpc.lukso.sigmacore.io';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';
export const SAMPLE_PROFILE_ADDRESS = '0x9139def55c73c12bcda9c44f12326686e3948634';

// 💡 Note: You can debug any smart contract by using the ERC725 Tools
// 👉 https://erc725-inspect.lukso.tech/inspector?address=0x9139def55c73c12bcda9c44f12326686e3948634&network=testnet

// Parameters for ERC725 Instance
export const config = { ipfsGateway: IPFS_GATEWAY };

// Profile link interface
export interface ProfileLink {
  title: string;
  url: string;
}

// Profile data interface
export interface ProfileMetadata {
  name?: string;
  description?: string;
  links?: ProfileLink[];
  tags?: string[];
}

// Picture data interface
export interface ProfilePictures {
  backgroundImageLinks: Array<[string, string]>;
  profileImageLinks: Array<[string, string]>;
  fullSizeBackgroundImg?: string;
  fullSizeProfileImg?: string;
}

// Top6 data interface
export interface Top6Data {
  addresses: string[];
}

export type AddressType = string;

// Profile image interface 
interface ProfileImage {
  url: string;
}

// Background image interface
interface BackgroundImage {
  url: string;
}

// LSP3Profile interface for type safety
interface LSP3ProfileData {
  name?: string;
  description?: string;
  links?: ProfileLink[];
  tags?: string[];
  backgroundImage?: Record<string, BackgroundImage>;
  profileImage?: Record<string, ProfileImage>;
}

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
    const profile = profileData.value.LSP3Profile as LSP3ProfileData;
    metadata.name = profile.name;
    metadata.description = profile.description;
    metadata.links = profile.links;
    metadata.tags = profile.tags;
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
    const profile = pictureData.value.LSP3Profile as LSP3ProfileData;
    const backgroundImagesIPFS = profile.backgroundImage;
    const profileImagesIPFS = profile.profileImage;
    
    try {
      if (backgroundImagesIPFS) {
        for (const i in backgroundImagesIPFS) {
          pictures.backgroundImageLinks.push([
            i,
            backgroundImagesIPFS[i].url.replace('ipfs://', IPFS_GATEWAY),
          ]);
        }
      }

      if (profileImagesIPFS) {
        for (const i in profileImagesIPFS) {
          pictures.profileImageLinks.push([
            i,
            profileImagesIPFS[i].url.replace('ipfs://', IPFS_GATEWAY),
          ]);
        }
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
// Uncomment these to test the functions
// fetchProfileMetadata(SAMPLE_PROFILE_ADDRESS).then(console.log);
// fetchPictureData(SAMPLE_PROFILE_ADDRESS).then(console.log);
// extractTop6Data(SAMPLE_PROFILE_ADDRESS).then(console.log);