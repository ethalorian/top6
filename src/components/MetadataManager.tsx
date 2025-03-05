// MetadataManager.tsx - React component for managing UP metadata
'use client';

import React, { useState, useEffect } from 'react';
import { useUPMetadata } from '../hooks/useUPMetadata';

interface Address {
  value: string;
  valid: boolean;
}

interface MetadataManagerProps {
  title?: string;
  schemaName?: string;
  maxAddresses?: number;
  className?: string;
}

export const MetadataManager: React.FC<MetadataManagerProps> = ({
  title = 'Universal Profile Metadata',
  schemaName = 'MyTopAccounts',
  maxAddresses = 6,
  className = '',
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
  const [loadAttempted, setLoadAttempted] = useState(false);

  // Load addresses on initial mount if connected
  useEffect(() => {
    if (isConnected && !loadAttempted) {
      loadAddresses();
      setLoadAttempted(true);
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-700">Please connect your Universal Profile to manage metadata</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      
      {/* Connected Profile */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-600 mb-2">Connected Profile:</p>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mr-2"></div>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded flex-1 truncate">{profileAddress}</p>
        </div>
      </div>
      
      {/* Address Management */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Manage Addresses</h3>
        
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={address.value}
                  onChange={(e) => handleAddressChange(index, e.target.value)}
                  className={`w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                    ${address.value && !address.valid
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : address.value && address.valid
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }`}
                  placeholder="0x..."
                />
                {address.value && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {address.valid ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeAddressField(index)}
                disabled={addresses.length <= 1}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 
                  hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent
                  text-red-600 disabled:text-gray-400 transition-colors"
                aria-label="Remove address"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        {addresses.length < maxAddresses && (
          <button
            onClick={addAddressField}
            className="mt-3 flex items-center justify-center w-full p-2 border border-dashed border-gray-300 
              rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Address
          </button>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={saveAddresses}
          disabled={loading || !addresses.some(addr => addr.valid)}
          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
            text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 
            focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : 'Save to Profile'}
        </button>
        
        <button
          onClick={loadAddresses}
          disabled={loading}
          className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50
            text-gray-800 disabled:text-gray-400 font-medium rounded-lg transition-colors 
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : 'Load from Profile'}
        </button>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {txHash && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-800">Transaction successful</h4>
            <p className="text-sm text-green-700 mt-1">
              <a 
                href={`https://explorer.lukso.network/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-800 transition-colors"
              >
                View transaction on LUKSO Explorer
              </a>
            </p>
          </div>
        </div>
      )}
      
      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Saved Addresses</h3>
          <ul className="divide-y divide-gray-200">
            {savedAddresses.map((addr, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="font-mono text-sm bg-white p-2 rounded border border-gray-200 flex-1 truncate hover:text-clip transition-all">
                  {addr}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetadataManager;