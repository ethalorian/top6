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
      setStatusMessage('Checking permissions...');
      
      // Check if account can update top accounts
      const canUpdate = await manager.canUpdateTopAccounts(
        provider, 
        contextAccounts[0], 
        contextAccounts[0]
      );
      
      if (!canUpdate) {
        setStatusMessage('Your account doesn\'t have permission to update Top Accounts. Please set SETDATA permission in your Universal Profile interface.');
        return;
      }
      
      setStatusMessage('Saving to blockchain... Please approve the transaction in your wallet');
      
      // Use the UPProvider and the connected account
      const txHash = await manager.storeAddressesOnProfile(provider, contextAccounts[0]);
      
      setStatusMessage(`Transaction submitted successfully! 
        Hash: ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`);
    } catch (error) {
      console.error('Error saving to blockchain:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleSetupAndSave = async () => {
    if (!manager || !profileConnected || contextAccounts.length === 0) {
      setStatusMessage('Please connect your Universal Profile first');
      return;
    }
    
    try {
      setStatusMessage('Setting up permissions and saving... Please approve transaction(s) in your wallet');
      
      // Call the new method that handles both setup and saving
      const txHash = await manager.setupAndStoreAddresses(provider, contextAccounts[0]);
      
      setStatusMessage(`Transaction successful! Hash: ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`);
    } catch (error) {
      console.error('Setup and save error:', error);
      
      if (error instanceof Error) {
        setStatusMessage(`Error: ${error.message}`);
      } else {
        setStatusMessage('Unknown error occurred');
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
      
      <button 
        onClick={handleSetupAndSave}
        disabled={!profileConnected || contextAccounts.length === 0}
      >
        Setup & Save Top Accounts
      </button>
      
      {statusMessage && (
        <div className="status-message">{statusMessage}</div>
      )}
    </div>
  );
}

export default TopAccountsManager;