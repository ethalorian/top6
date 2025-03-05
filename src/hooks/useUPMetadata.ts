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
import { decodeERC725YValue } from '../utils/ethersAbiDecoder';
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
      // Validate value to avoid BigInt conversion issues
      if (value === undefined) {
        throw new Error('Cannot store undefined value');
      }
      
      // Ensure we have valid addresses for address arrays
      if (Array.isArray(value)) {
        value = value.filter(v => typeof v === 'string' && /^0x[a-fA-F0-9]{40}$/.test(v));
        if (value.length === 0) {
          throw new Error('No valid addresses provided');
        }
      }
      
      console.log('Encoding metadata for:', schemaName, value);
      
      // Encode the data
      const encodedData = encodeMetadata(schemaName, value);
      
      // Validate encoded data before sending to contract
      if (!encodedData.keys.length || !encodedData.values.length) {
        throw new Error('Failed to encode metadata');
      }
      
      console.log('Encoded data:', encodedData.keys, encodedData.values);
      
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
      
      // Store data on the Universal Profile - with explicit error handling
      try {
        const tx = await universalProfile.setDataBatch(
          encodedData.keys,
          encodedData.values
        );
        
        console.log('Transaction submitted:', tx);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        setState({ loading: false, error: null, txHash: tx.hash });
        return tx.hash;
      } catch (txError: any) {
        console.error('Transaction failed:', txError);
        
        // Handle provider errors that might be nested
        const errorMessage = txError.reason || 
                            (txError.error?.message) || 
                            (txError.data?.message) || 
                            txError.message || 
                            'Unknown transaction error';
                            
        setState({ loading: false, error: errorMessage, txHash: null });
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in storeMetadataOnProfile:', error);
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
      } else if (response === null || response === undefined) {
        return '0x'; // Return empty hex for null/undefined responses
      } else if (typeof response === 'object') {
        // Some providers wrap the result
        const result = (response as Record<string, unknown>).result;
        if (typeof result === 'string') {
          return result;
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
      
      // First try to decode with ethers ABI decoder
      try {
        console.log('Trying to decode with ethers ABI decoder...');
        // Get schema item to determine the valueType
        const schemaItem = schema.find(item => item.key === key || item.name === keyOrName);
        const valueType = schemaItem?.valueType || 'address[]'; // Default to address[] if schema not found
        
        // Decode using ethers ABI decoder which handles the correct format
        const decodedValue = decodeERC725YValue(rawResult, valueType);
        console.log('Successfully decoded value:', decodedValue);
        
        setState({ loading: false, error: null, txHash: null });
        return {
          name: keyOrName,
          key: key,
          value: decodedValue
        };
      } catch (decodeError) {
        console.error('Error decoding with ABI decoder:', decodeError);
        
        // As a fallback, try ERC725 decoder
        try {
          const erc725js = new ERC725(schema);
          const decodedData = erc725js.decodeData([
            { keyName: key, value: rawResult }
          ]);
          
          setState({ loading: false, error: null, txHash: null });
          return decodedData[0];
        } catch (erc725Error) {
          console.error('Error decoding ERC725 data:', erc725Error);
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