// useUPMetadata.ts - React hook for interacting with UP metadata
'use client';

import { ethers } from 'ethers';
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json';
import { ERC725 } from '@erc725/erc725.js';
import { useUPProvider } from '../providers/up-provider'; // Path to your provider
import { encodeMetadata, decodeMetadata, schema, getKeyByName } from '../utils/ERC725Utils';
import { useState } from 'react';

// Extract the ABI from the imported JSON
const LSP0ERC725AccountABI = LSP0ERC725Account.abi;

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
    value: any
  ): Promise<string> => {
    if (!profileConnected || accounts.length === 0) {
      throw new Error('No Universal Profile connected');
    }
    
    setState({ loading: true, error: null, txHash: null });
    
    try {
      // Encode the data
      const encodedData = encodeMetadata(schemaName, value);
      
      // Create a Web3Provider from the UP Provider
      const web3Provider = new ethers.providers.Web3Provider(provider as any);
      
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
    } catch (error: any) {
      setState({ loading: false, error: error.message || 'Unknown error', txHash: null });
      throw error;
    }
  };
  
  /**
   * Retrieve metadata from any Universal Profile
   */
  const retrieveMetadataFromProfile = async (
    profileAddress: string,
    keyOrName: string
  ): Promise<any> => {
    setState({ loading: true, error: null, txHash: null });
    
    try {
      // Check if we're using a name or a key
      const key = keyOrName.startsWith('0x') 
        ? keyOrName 
        : getKeyByName(keyOrName) || keyOrName;
      
      // Create a Web3Provider from the UP Provider
      const web3Provider = new ethers.providers.Web3Provider(provider as any);
      
      // Create contract instance
      const universalProfile = new ethers.Contract(
        profileAddress,
        LSP0ERC725AccountABI,
        web3Provider
      );
      
      // Get data from the Universal Profile
      const value = await universalProfile.getData(key);
      
      // Decode the data
      const erc725js = new ERC725(schema);
      const decodedData = erc725js.decodeData([
        { keyName: key, value }
      ]);
      
      setState({ loading: false, error: null, txHash: null });
      return decodedData;
    } catch (error: any) {
      setState({ loading: false, error: error.message || 'Unknown error', txHash: null });
      throw error;
    }
  };
  
  /**
   * Retrieve metadata from the connected Universal Profile
   */
  const retrieveMyMetadata = async (keyOrName: string): Promise<any> => {
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