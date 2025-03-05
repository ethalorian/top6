// MetadataManager.tsx - React component for managing UP metadata
'use client';

import React, { useState, useEffect } from 'react';
import { useUPMetadata } from '../hooks/useUPMetadata';

interface MetadataManagerProps {
  title: string;
  schemaName: string;
  maxAddresses: number;
}

export const MetadataManager: React.FC<MetadataManagerProps> = ({ 
  title, 
  schemaName, 
  maxAddresses 
}) => {
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
  const [indexOperation, setIndexOperation] = useState<{ index: number, status: 'saving' | 'success' | 'error', message?: string } | null>(null);
  
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
    if (addresses.length >= maxAddresses) {
      setError(`Maximum of ${maxAddresses} addresses allowed`);
      return;
    }
    setAddresses([...addresses, '']);
  };
  
  // Save a specific address at a given index - with fire and forget approach
  const saveAddressAtIndex = async (index: number) => {
    if (!isConnected || isSaving || index < 0 || index >= addresses.length) return;
    
    const address = addresses[index];
    if (!validateAddress(address)) {
      setError(`Address at position ${index + 1} is invalid`);
      return;
    }
    
    setIndexOperation({ index, status: 'saving' });
    setError(null);
    
    try {
      // Get current addresses
      const currentAddresses = [...savedAddresses];
      
      // Extend array if needed
      while (currentAddresses.length <= index) {
        currentAddresses.push('0x0000000000000000000000000000000000000000');
      }
      
      // Update the address
      currentAddresses[index] = address.toLowerCase();
      
      // Fire and forget - don't wait for the result
      storeMetadataOnProfile(schemaName, currentAddresses)
        .catch(err => console.error('Transaction error (background):', err));
      
      // Optimistically update UI
      setSavedAddresses(currentAddresses);
      setIndexOperation({ index, status: 'success' });
      
      // Clear operation status after delay
      setTimeout(() => {
        setIndexOperation(null);
      }, 2000);
      
    } catch (err) {
      console.error(`Save at index ${index} failed:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIndexOperation({ index, status: 'error' });
    }
  };
  
  // Delete a specific address
  const deleteAddressAtIndex = (index: number) => {
    if (index < 0 || index >= addresses.length) return;
    
    const newAddresses = [...addresses];
    newAddresses.splice(index, 1);
    
    if (newAddresses.length === 0) {
      newAddresses.push(''); // Always keep at least one input field
    }
    
    setAddresses(newAddresses);
  };
  
  // Save all addresses - with fire and forget approach
  const saveAddresses = async () => {
    if (!isConnected || isSaving) return;
    
    // Validate addresses
    const validAddresses = addresses.filter(validateAddress);
    
    if (validAddresses.length === 0) {
      setError('No valid addresses to save');
      return;
    }
    
    console.log('Saving valid addresses:', validAddresses);
    setIsSaving(true);
    setError(null);
    
    try {
      // Fire and forget approach - don't await the result
      storeMetadataOnProfile(schemaName, validAddresses)
        .catch(err => console.error('Transaction error (background):', err));
      
      // Optimistically update UI
      setSavedAddresses(validAddresses);
      
      // Notify user
      setError("Transaction sent. Click 'Refresh Addresses' to verify changes.");
      setIsSaving(false);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsSaving(false);
    }
  };
  
  // Load addresses from UP
  const loadAddresses = () => {
    if (!isConnected || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    console.log('Loading addresses...');
    
    retrieveMyMetadata(schemaName)
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

  // Add a safety timeout for the indexOperation
  useEffect(() => {
    // If any operation is "saving" for more than 30 seconds, reset it
    // This prevents UI getting stuck in "saving" state
    if (indexOperation?.status === 'saving') {
      const timer = setTimeout(() => {
        console.log('Operation timeout - resetting state');
        setIndexOperation(null);
        setError('Operation timed out. Please try again.');
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [indexOperation]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{title}</h1>
      
      {isConnected ? (
        <p>Connected to: {profileAddress}</p>
      ) : (
        <p>Not connected. Please connect your UP.</p>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Addresses</h2>
        {addresses.map((address, index) => (
          <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(index, e.target.value)}
              placeholder="0x..."
              style={{ 
                flex: 1,
                padding: '8px',
                borderColor: validateAddress(address) ? 'green' : 'red'
              }}
            />
            <div style={{ display: 'flex', marginLeft: '10px' }}>
              <button 
                onClick={() => saveAddressAtIndex(index)}
                disabled={!validateAddress(address) || (indexOperation?.index === index && indexOperation?.status === 'saving')}
                style={{ 
                  padding: '4px 8px',
                  background: indexOperation?.index === index && indexOperation?.status === 'success' ? 'green' : '#4299e1',
                  color: 'white'
                }}
              >
                {indexOperation?.index === index && indexOperation?.status === 'saving' 
                  ? 'Saving...' 
                  : indexOperation?.index === index && indexOperation?.status === 'success'
                    ? '✓'
                    : 'Save'}
              </button>
              <button 
                onClick={() => deleteAddressAtIndex(index)}
                style={{ padding: '4px 8px', marginLeft: '5px' }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addAddressField} 
          disabled={addresses.length >= maxAddresses}
          style={{ marginBottom: '10px' }}
        >
          Add Address
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={saveAddresses} 
          disabled={isSaving}
          style={{ padding: '10px', background: '#4299e1', color: 'white' }}
        >
          {isSaving ? 'Saving...' : 'Save All Addresses'}
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
              <li key={i} style={{ marginBottom: '5px', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>{i}:</span> {addr}
                <button 
                  onClick={() => {
                    // Copy this address to the editing address at the same index
                    const newAddresses = [...addresses];
                    // Extend the array if needed
                    while (newAddresses.length <= i) {
                      newAddresses.push('');
                    }
                    newAddresses[i] = addr;
                    setAddresses(newAddresses);
                    
                    // Highlight this field visually (optional)
                    setIndexOperation({ 
                      index: i, 
                      status: 'success', 
                      message: 'Ready to edit' 
                    });
                    
                    // Clear highlight after 1.5 seconds
                    setTimeout(() => {
                      if (indexOperation?.index === i) {
                        setIndexOperation(null);
                      }
                    }, 1500);
                  }}
                  style={{ marginLeft: '10px', padding: '2px 5px', fontSize: '12px' }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetadataManager;