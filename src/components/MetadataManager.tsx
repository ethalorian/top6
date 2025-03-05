// MetadataManager.tsx - React component for managing UP metadata
'use client';

import React, { useState } from 'react';
import { useUPMetadata } from '../hooks/useUPMetadata';

export const MetadataManager: React.FC = () => {
  const {
    storeMetadataOnProfile,
    retrieveMyMetadata,
    profileAddress,
    isConnected
  } = useUPMetadata();

  const [addresses, setAddresses] = useState<string[]>(['']);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validate Ethereum address
  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  
  // Handle address input change
  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };
  
  // Add new address field
  const addAddressField = () => {
    setAddresses([...addresses, '']);
  };
  
  // Save addresses to UP
  const saveAddresses = () => {
    if (!isConnected || isSaving) return;
    
    const validAddresses = addresses
      .filter(addr => validateAddress(addr));
    
    if (validAddresses.length === 0) {
      setError('Please add at least one valid address');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    console.log('Saving addresses:', validAddresses);
    
    storeMetadataOnProfile('MyTopAccounts', validAddresses)
      .then(txHash => {
        console.log('Save successful with hash:', txHash);
        setSavedAddresses(validAddresses);
        setIsSaving(false);
      })
      .catch(err => {
        console.error('Save failed with error:', err);
        setError(err.message || 'Failed to save addresses');
        setIsSaving(false);
      });
  };
  
  // Load addresses from UP
  const loadAddresses = () => {
    if (!isConnected || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    console.log('Loading addresses...');
    
    retrieveMyMetadata('MyTopAccounts')
      .then(result => {
        console.log('Load result:', result);
        
        if (result && result.value) {
          // Process addresses
          const loadedAddresses = Array.isArray(result.value) 
            ? result.value.filter(item => typeof item === 'string')
            : [];
            
          console.log('Processed addresses:', loadedAddresses);
          setSavedAddresses(loadedAddresses);
          setAddresses(loadedAddresses.length > 0 ? loadedAddresses : ['']);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Load failed with error:', err);
        setError(err.message || 'Failed to load addresses');
        setIsLoading(false);
      });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>UP Metadata Tester</h1>
      
      {isConnected ? (
        <p>Connected to: {profileAddress}</p>
      ) : (
        <p>Not connected. Please connect your UP.</p>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Addresses</h2>
        {addresses.map((address, index) => (
          <div key={index} style={{ marginBottom: '10px', display: 'flex' }}>
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(index, e.target.value)}
              placeholder="0x..."
              style={{ 
                width: '100%', 
                padding: '8px',
                borderColor: validateAddress(address) ? 'green' : 'red'
              }}
            />
          </div>
        ))}
        
        <button onClick={addAddressField} style={{ marginBottom: '10px' }}>
          Add Address
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={saveAddresses} 
          disabled={isSaving}
          style={{ padding: '10px', background: '#4299e1', color: 'white' }}
        >
          {isSaving ? 'Saving...' : 'Save Addresses'}
        </button>
        
        <button 
          onClick={loadAddresses} 
          disabled={isLoading}
          style={{ padding: '10px' }}
        >
          {isLoading ? 'Loading...' : 'Load Addresses'}
        </button>
      </div>
      
      {error && (
        <div style={{ padding: '10px', background: '#fed7d7', color: '#9b2c2c', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {savedAddresses.length > 0 && (
        <div>
          <h2>Saved Addresses</h2>
          <ul style={{ padding: '0', listStyle: 'none' }}>
            {savedAddresses.map((addr, i) => (
              <li key={i} style={{ marginBottom: '5px', fontFamily: 'monospace' }}>
                {addr}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetadataManager;