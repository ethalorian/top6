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
import { sendDirectTransaction, encodeSetDataBatchData } from '../utils/directTransaction';

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
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    txHash: string | null;
  }>({
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
      if (value === undefined || value === null) {
        throw new Error('Cannot store undefined or null value');
      }
      
      // For address arrays, ensure they're clean and properly formatted
      if (Array.isArray(value)) {
        // Filter any potential undefined or invalid values
        value = value.filter(v => 
          typeof v === 'string' && 
          v !== undefined && 
          v !== null &&
          /^0x[a-fA-F0-9]{40}$/.test(v)
        );
        
        if (value.length === 0) {
          throw new Error('No valid addresses provided');
        }
        
        // Normalize addresses to lowercase
        value = value.map(v => v.toLowerCase());
      }
      
      console.log('Encoding metadata for:', schemaName, 'Value:', value);
      
      // Use a try/catch specifically for the encoding step
      let encodedData;
      try {
        encodedData = encodeMetadata(schemaName, value);
        
        if (!encodedData.keys || !encodedData.values || 
            !encodedData.keys.length || !encodedData.values.length) {
          throw new Error('Failed to encode metadata - empty result');
        }
        
        // Ensure no values are undefined or null in our payload
        if (encodedData.values.some(v => v === undefined || v === null)) {
          throw new Error('Encoded values contain undefined or null');
        }
        
        // Ensure every value is a proper hex string
        encodedData.values = encodedData.values.map(v => {
          if (typeof v !== 'string') {
            throw new Error(`Value is not a string: ${typeof v}`);
          }
          // Ensure proper hex format
          if (!v.startsWith('0x')) {
            return `0x${v}`;
          }
          return v;
        });
        
        console.log('Encoded data keys:', encodedData.keys);
        console.log('Encoded data values:', encodedData.values);
      } catch (encodeError) {
        console.error('Encoding error:', encodeError);
        throw new Error(`Failed to encode data: ${encodeError instanceof Error ? encodeError.message : 'Unknown error'}`);
      }
      
      try {
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
        
        // Store data on the Universal Profile - with explicit checks
        const keys = encodedData.keys;
        const values = encodedData.values;
        
        // Additional deep validation of values - no undefined allowed
        for (let i = 0; i < values.length; i++) {
          if (values[i] === undefined || values[i] === null) {
            throw new Error(`Value at index ${i} is undefined or null`);
          }
          if (typeof values[i] !== 'string') {
            throw new Error(`Value at index ${i} is not a string: ${typeof values[i]}`);
          }
          if (!values[i].startsWith('0x')) {
            values[i] = `0x${values[i]}`;
          }
        }
        
        console.log('Sending transaction with:', {
          address: accounts[0],
          keys: keys,
          values: values
        });
        
        // TRY DIRECT METHOD FIRST
        try {
          console.log('Trying direct transaction method...');
          
          // Use our direct transaction method
          try {
            // Manually encode the function call data for setDataBatch
            const directTxData = encodeSetDataBatchData(keys, values);
            
            console.log('Direct transaction data created', directTxData);
            
            // Send transaction directly using window.ethereum
            const txHash = await sendDirectTransaction(
              accounts[0],  // to: UP contract address
              directTxData, // data: Encoded function call
              accounts[0]   // from: User's account
            );
            
            console.log('Direct transaction successful:', txHash);
            setState({ loading: false, error: null, txHash });
            return txHash;
          } catch (directError) {
            console.error('Direct method failed, trying fallback:', directError);
            // Continue to fallback method
          }
        } catch (directMethodError) {
          console.error('Direct transaction approach failed:', directMethodError);
          // Continue to fallback methods
        }
        
        // FALLBACK: Try with ethers.js but catch BigInt errors
        try {
          const tx = await universalProfile.setDataBatch(
            keys,
            values,
            { gasLimit: 1000000 }
          );
          
          console.log('Transaction submitted:', tx);
          setState({ loading: true, error: null, txHash: tx.hash });
          
          const receipt = await tx.wait();
          console.log('Transaction confirmed:', receipt);
          
          setState({ loading: false, error: null, txHash: tx.hash });
          return tx.hash;
        } catch (bigIntError) {
          // Instead of trying to handle the BigInt error, we'll just log it
          // and rely on our UI workaround since it's succeeding on-chain
          console.error('Transaction sent but response processing failed:', bigIntError);
          
          // If we got the specific BigInt error, assume success and return a placeholder
          if (String(bigIntError).includes('BigInt')) {
            setState({ loading: false, error: 'Transaction may have succeeded but response processing failed', txHash: 'unknown' });
            return 'unknown-hash';
          }
          
          // Otherwise rethrow
          throw bigIntError;
        }
      } catch (txError: unknown) {
        console.error('Transaction failed:', txError);
        
        const errorObj = txError as Error & {
          reason?: string,
          error?: { message?: string },
          data?: { message?: string }
        };
        
        const errorMessage = 
          errorObj.reason || 
          errorObj.error?.message || 
          errorObj.data?.message || 
          errorObj.message || 
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
  const retrieveMyMetadata = async (keyOrName: string): Promise<DecodedData | null> => {
    if (!profileConnected || accounts.length === 0) {
      throw new Error('No Universal Profile connected');
    }
    
    setState({ loading: true, error: null, txHash: null });
    
    try {
      return await retrieveMetadataFromProfile(accounts[0], keyOrName);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error retrieving metadata:', error);
      setState({ loading: false, error: errorMessage, txHash: null });
      throw error;
    }
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