import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import 'isomorphic-fetch';
import { FetchDataOutput } from '@erc725/erc725.js/build/main/src/types/decodeData.js';
import { top6Schema } from './GetDataKeys';

// Static variables
export const RPC_ENDPOINT = 'https://rpc.lukso.sigmacore.io';
export const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs/';
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

// Function to properly format IPFS URLs
export function formatIPFSUrl(url: string): string {
  if (!url) return '';
  
  // If the URL is already an HTTP URL, return it as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    // Remove ipfs:// prefix and ensure no double slashes
    const cid = url.replace('ipfs://', '');
    return `${IPFS_GATEWAY}${cid}`;
  }
  
  // If it's just a CID, add the gateway
  return `${IPFS_GATEWAY}${url}`;
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

  console.log(`Fetching picture data for address: ${address}`);
  
  if (
    pictureData.value &&
    typeof pictureData.value === 'object' &&
    'LSP3Profile' in pictureData.value
  ) {
    // Read JSON
    const profile = pictureData.value.LSP3Profile as LSP3ProfileData;
    console.log('LSP3Profile data:', JSON.stringify(profile, null, 2));
    
    const backgroundImagesIPFS = profile.backgroundImage;
    const profileImagesIPFS = profile.profileImage;
    
    console.log('Background images from profile:', backgroundImagesIPFS);
    console.log('Profile images from profile:', profileImagesIPFS);
    
    try {
      if (backgroundImagesIPFS) {
        for (const i in backgroundImagesIPFS) {
          const imageUrl = formatIPFSUrl(backgroundImagesIPFS[i].url);
          console.log(`Adding background image: ${i} -> ${imageUrl}`);
          pictures.backgroundImageLinks.push([i, imageUrl]);
        }
      }

      if (profileImagesIPFS) {
        for (const i in profileImagesIPFS) {
          const imageUrl = formatIPFSUrl(profileImagesIPFS[i].url);
          console.log(`Adding profile image: ${i} -> ${imageUrl}`);
          pictures.profileImageLinks.push([i, imageUrl]);
        }
      }

      if (pictures.backgroundImageLinks.length > 0) {
        pictures.fullSizeBackgroundImg = pictures.backgroundImageLinks[0][1];
        console.log('Full size background image:', pictures.fullSizeBackgroundImg);
      }
      
      if (pictures.profileImageLinks.length > 0) {
        pictures.fullSizeProfileImg = pictures.profileImageLinks[0][1];
        console.log('Full size profile image:', pictures.fullSizeProfileImg);
      }
    } catch (error) {
      console.error('Could not fetch images: ', error);
    }
  } else {
    console.log('No LSP3Profile data found in response:', pictureData);
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