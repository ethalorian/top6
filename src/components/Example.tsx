import React, { useState, useEffect } from 'react';
import { LuksoTopAccountsManager } from '../services/top-accounts-manager';
import { useUPProvider } from '../providers/up-provider';
import { MAX_TOP_ACCOUNTS } from '../constants/lukso';

function TopAccountsManager() {
  const [manager, setManager] = useState<LuksoTopAccountsManager | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('');
  const { provider, contextAccounts, profileConnected } = useUPProvider();

  // Initialize the manager
  useEffect(() => {
    const topAccountsManager = new LuksoTopAccountsManager();
    setManager(topAccountsManager);
  }, []);

  const handleAddAddress = () => {
    if (!manager) return;
    
    const success = manager.addAddress(newAddress, selectedSlot);
    if (success) {
      setNewAddress('');
      setStatusMessage(`Address added to slot ${selectedSlot}`);
    } else {
      setStatusMessage('Failed to add address. Please check format or slot availability.');
    }
  };

  const handleRemoveAddress = (addressOrSlot: string | number) => {
    if (!manager) return;
    
    const success = manager.removeAddress(addressOrSlot);
    if (success) {
      setStatusMessage('Address removed successfully');
    } else {
      setStatusMessage('Failed to remove address');
    }
  };

  const handleSaveToBlockchain = async () => {
    if (!manager || !profileConnected || contextAccounts.length === 0) {
      setStatusMessage('Please connect your Universal Profile first');
      return;
    }
    
    try {
      setStatusMessage('Saving to blockchain... Please approve the transaction in your wallet');
      
      // Use the UPProvider and the connected account
      const txHash = await manager.storeAddressesOnProfile(provider, contextAccounts[0]);
      
      setStatusMessage(`Transaction submitted successfully! 
        Hash: ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`);
    } catch (error) {
      console.error('Error saving to blockchain:', error);
      
      // Use type assertion with interface instead of 'any'
      const ethError = error as { code?: number; message?: string };
      
      // Check for user rejection (code 4001)
      if (ethError.code === 4001) {
        setStatusMessage('Transaction was rejected in your wallet. Please try again and approve the transaction.');
      } else {
        setStatusMessage(`Error: ${ethError.message || 'Unknown error occurred'}`);
      }
    }
  };

  return (
    <div>
      <h2>Top Accounts Manager</h2>
      
      {!profileConnected && (
        <div className="connect-message">
          Please connect your Universal Profile to use this feature
        </div>
      )}
      
      <div>
        <h3>Add New Address</h3>
        <input 
          type="text" 
          value={newAddress} 
          onChange={(e) => setNewAddress(e.target.value)}
          placeholder="Enter Ethereum address"
        />
        <select 
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(Number(e.target.value))}
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <option key={index} value={index}>Slot {index}</option>
          ))}
        </select>
        <button onClick={handleAddAddress}>Add Address</button>
      </div>
      
      <div>
        <h3>Current Addresses</h3>
        <ul>
          {Array.from({ length: MAX_TOP_ACCOUNTS }).map((_, index) => {
            const address = manager?.getAddressAtSlot(index);
            return (
              <li key={index}>
                Slot {index}: {address || 'Empty'}
                {address && (
                  <button onClick={() => handleRemoveAddress(index)}>Remove</button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      <button 
        onClick={handleSaveToBlockchain}
        disabled={!profileConnected}
      >
        Save to Blockchain
      </button>
      
      {statusMessage && (
        <div className="status-message">{statusMessage}</div>
      )}
    </div>
  );
}

export default TopAccountsManager;