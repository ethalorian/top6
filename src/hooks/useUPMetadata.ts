// useUPMetadata.ts - React hook for interacting with UP metadata
'use client';

import { ethers } from 'ethers';
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json';
import { ERC725 } from '@erc725/erc725.js';
import { useUPProvider } from '../providers/up-provider'; // Path to your provider
import { 
  encodeMetadata, 
  decodeMetadata, 
  schema, 
  getKeyByName,
  ERC725Value,
  DecodedData
} from '../utils/ERC725Utils';
import { useState } from 'react';

// Extract the ABI from the imported JSON
const LSP0ERC725AccountABI = LSP0ERC725Account.abi;

// Interface for provider request methods
interface ProviderRpcRequest {
  method: string;
  params?: unknown[];
}

// Define event listener types
type ProviderEventListener = (...args: unknown[]) => void;

// Define provider type
type UPProvider = {
  request: (args: ProviderRpcRequest) => Promise<unknown>;
  on: (event: string, listener: ProviderEventListener) => void;
  removeListener: (event: string, listener: ProviderEventListener) => void;
};

export interface MetadataAction {
  loading: boolean;
  error: string | null;
  txHash: string | null;
}

/**
 * React hook for interacting with UP metadata
 */
export function useUPMetadata() {
  const { provider, accounts, profileConnected } = useUPProvider();
  const [state, setState] = useState<MetadataAction>({
    loading: false,
    error: null,
    txHash: null,
  });
  
  /**
   * Store metadata on the connected Universal Profile
   */
  const storeMetadataOnProfile = async (
    schemaName: string,
    value: ERC725Value
  ): Promise<string> => {
    if (!profileConnected || accounts.length === 0) {
      throw new Error('No Universal Profile connected');
    }
    
    setState({ loading: true, error: null, txHash: null });
    
    try {
      // Encode the data
      const encodedData = encodeMetadata(schemaName, value);
      
      // Create a Web3Provider from the UP Provider
      const web3Provider = new ethers.providers.Web3Provider(provider as UPProvider);
      
      // Get the signer from the connected account
      const signer = web3Provider.getSigner(accounts[0]);
      
      // Create contract instance - using the connected UP address
      const universalProfile = new ethers.Contract(
        accounts[0],
        LSP0ERC725AccountABI,
        signer
      );
      
      // Store data on the Universal Profile
      const tx = await universalProfile.setDataBatch(
        encodedData.keys,
        encodedData.values
      );
      
      await tx.wait();
      
      setState({ loading: false, error: null, txHash: tx.hash });
      return tx.hash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage, txHash: null });
      throw error;
    }
  };
  
  /**
   * Make a direct call to the blockchain using the provider's raw request method
   */
  const callContractData = async (
    address: string,
    data: string
  ): Promise<string> => {
    try {
      // Make a direct eth_call using the provider
      const response = await (provider as UPProvider).request({
        method: 'eth_call',
        params: [
          {
            to: address,
            data: data,
          },
          'latest'
        ],
      });
      
      // Handle different response formats
      if (typeof response === 'string') {
        return response;
      } else if (response === null) {
        return '0x'; // Return empty hex for null responses
      } else if (typeof response === 'object' && response !== null) {
        // Try to extract string data from response object
        const stringValue = JSON.stringify(response);
        console.log('Provider returned object:', stringValue);
        if ('result' in response && typeof response.result === 'string') {
          return response.result;
        }
      }
      
      console.error('Unexpected provider response format:', response);
      throw new Error('Unexpected response format from provider');
    } catch (error) {
      console.error('Error in raw call:', error);
      throw error;
    }
  };
  
  /**
   * Retrieve metadata from any Universal Profile
   */
  const retrieveMetadataFromProfile = async (
    profileAddress: string,
    keyOrName: string
  ): Promise<DecodedData> => {
    setState({ loading: true, error: null, txHash: null });
    
    try {
      // Check if we're using a name or a key
      const key = keyOrName.startsWith('0x') 
        ? keyOrName 
        : getKeyByName(keyOrName) || keyOrName;
      
      // Create the function data for getData(bytes32)
      const functionSignature = '0x54f6127f'; // keccak256("getData(bytes32)") first 4 bytes
      const paddedKey = key.replace('0x', '').padStart(64, '0');
      const callData = `${functionSignature}${paddedKey}`;
      
      // Directly call the contract using the provider
      const rawResult = await callContractData(profileAddress, callData);
      
      // Log the raw result for debugging
      console.log('Raw result from contract call:', rawResult);
      
      // Parse the returned data - this is a direct byte array from the contract
      // We don't need to use ethers.js to decode it
      
      // Decode using ERC725
      const erc725js = new ERC725(schema);
      try {
        const decodedData = erc725js.decodeData([
          { keyName: key, value: rawResult }
        ]);
        
        setState({ loading: false, error: null, txHash: null });
        return decodedData[0];
      } catch (decodeError) {
        console.error('Error decoding ERC725 data:', decodeError);
        console.log('Failed to decode:', { key, rawResult });
        
        // Try an alternative approach - the data might be an address array
        if (rawResult.length > 66) {
          try {
            // Basic decoding for address arrays
            // Skip the first 64 chars (32 bytes) which are typically array length data
            const dataWithoutHeader = '0x' + rawResult.slice(66);
            
            // Try to extract addresses (each address is 20 bytes = 40 chars + '0x' prefix)
            const addresses: string[] = [];
            for (let i = 0; i < dataWithoutHeader.length; i += 64) {
              if (i + 64 <= dataWithoutHeader.length) {
                const addressData = dataWithoutHeader.slice(i, i + 64);
                // Last 40 chars = 20 bytes = address
                const address = '0x' + addressData.slice(24);
                if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
                  addresses.push(address);
                }
              }
            }
            
            if (addresses.length > 0) {
              setState({ loading: false, error: null, txHash: null });
              return {
                name: keyOrName,
                key: key,
                value: addresses
              };
            }
          } catch (e) {
            console.error('Alternative decoding failed:', e);
          }
        }
        
        // Return a fallback if all decoding fails
        setState({ loading: false, error: 'Failed to decode data format', txHash: null });
        return {
          name: keyOrName,
          key: key,
          value: rawResult
        };
      }
    } catch (error: unknown) {
      console.error('Error retrieving metadata:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage, txHash: null });
      
      // Return a fallback decoded data object in case of error
      return {
        name: keyOrName,
        key: keyOrName.startsWith('0x') ? keyOrName : getKeyByName(keyOrName) || keyOrName,
        value: [] as string[],
      };
    }
  };
  
  /**
   * Retrieve metadata from the connected Universal Profile
   */
  const retrieveMyMetadata = async (keyOrName: string): Promise<DecodedData> => {
    if (!profileConnected || accounts.length === 0) {
      throw new Error('No Universal Profile connected');
    }
    
    return retrieveMetadataFromProfile(accounts[0], keyOrName);
  };
  
  return {
    // State
    profileAddress: accounts[0],
    isConnected: profileConnected,
    ...state,
    
    // Methods
    storeMetadataOnProfile,
    retrieveMetadataFromProfile,
    retrieveMyMetadata,
    
    // Re-export utility functions
    encodeMetadata,
    decodeMetadata,
  };
}