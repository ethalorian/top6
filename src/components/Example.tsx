import React, { useState, useEffect } from 'react';
import { LuksoTopAccountsManager } from '../services/top-accounts-manager';

function TopAccountsManager() {
  const [manager, setManager] = useState<LuksoTopAccountsManager | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('');

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
    if (!manager) return;
    
    try {
      setStatusMessage('Saving to blockchain...');
      const privateKey = 'your-private-key'; // In a real app, get this securely
      const rpcUrl = 'https://rpc.lukso.network';
      
      const txHash = await manager.storeAddressesOnProfile(privateKey, rpcUrl);
      setStatusMessage(`Saved to blockchain. Transaction: ${txHash}`);
    } catch (error) {
      setStatusMessage(`Error saving to blockchain: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div>
      <h2>Top Accounts Manager</h2>
      
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
          {Array.from({ length: 10 }).map((_, index) => {
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
      
      <button onClick={handleSaveToBlockchain}>Save to Blockchain</button>
      
      {statusMessage && (
        <div className="status-message">{statusMessage}</div>
      )}
    </div>
  );
}

export default TopAccountsManager;