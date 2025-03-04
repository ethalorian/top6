// MetadataManager.tsx - React component for managing UP metadata
'use client';

import React, { useState } from 'react';
import { useUPMetadata } from '../hooks/useUPMetadata';

interface Address {
  value: string;
  valid: boolean;
}

interface MetadataManagerProps {
  title?: string;
  schemaName?: string;
  maxAddresses?: number;
}

export const MetadataManager: React.FC<MetadataManagerProps> = ({
  title = 'Universal Profile Metadata',
  schemaName = 'MyTopAccounts',
  maxAddresses = 5,
}) => {
  const {
    storeMetadataOnProfile,
    retrieveMyMetadata,
    profileAddress,
    isConnected,
    loading,
    error,
    txHash
  } = useUPMetadata();

  const [addresses, setAddresses] = useState<Address[]>([
    { value: '', valid: false }
  ]);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  // Validate Ethereum address
  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Handle address input change
  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses];
    const valid = validateAddress(value);
    newAddresses[index] = { value, valid };
    setAddresses(newAddresses);
  };

  // Add new address field
  const addAddressField = () => {
    if (addresses.length < maxAddresses) {
      setAddresses([...addresses, { value: '', valid: false }]);
    }
  };

  // Remove address field
  const removeAddressField = (index: number) => {
    if (addresses.length > 1) {
      const newAddresses = [...addresses];
      newAddresses.splice(index, 1);
      setAddresses(newAddresses);
    }
  };

  // Save addresses to UP
  const saveAddresses = async () => {
    if (!isConnected) return;
    
    const validAddresses = addresses
      .filter(addr => addr.valid)
      .map(addr => addr.value);
    
    if (validAddresses.length === 0) {
      alert('Please add at least one valid address');
      return;
    }
    
    try {
      await storeMetadataOnProfile(schemaName, validAddresses);
      setSavedAddresses(validAddresses);
    } catch (error) {
      console.error('Failed to save addresses:', error);
    }
  };

  // Load addresses from UP
  const loadAddresses = async () => {
    if (!isConnected) return;
    
    try {
      const result = await retrieveMyMetadata(schemaName);
      if (result && result.value) {
        // Ensure result.value is treated as a string array
        const addresses = Array.isArray(result.value) 
          ? result.value.filter(item => typeof item === 'string')
          : [];
        setSavedAddresses(addresses);
        
        // Update the input fields with the verified string array
        const newAddresses = addresses.map((addr: string) => ({
          value: addr,
          valid: validateAddress(addr)
        }));
        
        // Ensure we have at least one field
        if (newAddresses.length === 0) {
          newAddresses.push({ value: '', valid: false });
        }
        
        setAddresses(newAddresses);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 border rounded">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-red-500">Please connect your Universal Profile to manage metadata</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      
      <div className="mb-4">
        <p className="text-sm mb-1">Connected Profile:</p>
        <p className="font-mono text-sm bg-gray-100 p-1 rounded">{profileAddress}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Manage Addresses</h3>
        
        {addresses.map((address, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={address.value}
              onChange={(e) => handleAddressChange(index, e.target.value)}
              className={`flex-1 p-1 border rounded ${
                address.value && !address.valid ? 'border-red-500' : ''
              }`}
              placeholder="0x..."
            />
            <button
              onClick={() => removeAddressField(index)}
              disabled={addresses.length <= 1}
              className="px-2 py-1 bg-red-100 text-red-700 rounded disabled:opacity-50"
            >
              -
            </button>
          </div>
        ))}
        
        {addresses.length < maxAddresses && (
          <button
            onClick={addAddressField}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded mt-1"
          >
            + Add Address
          </button>
        )}
      </div>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={saveAddresses}
          disabled={loading || !addresses.some(addr => addr.valid)}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save to Profile'}
        </button>
        
        <button
          onClick={loadAddresses}
          disabled={loading}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load from Profile'}
        </button>
      </div>
      
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {txHash && (
        <div className="p-2 bg-green-100 text-green-700 rounded mb-4">
          Transaction successful: 
          <a 
            href={`https://explorer.lukso.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            View transaction
          </a>
        </div>
      )}
      
      {savedAddresses.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Saved Addresses:</h3>
          <ul className="bg-gray-50 p-2 rounded">
            {savedAddresses.map((addr, i) => (
              <li key={i} className="font-mono text-sm">{addr}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetadataManager;