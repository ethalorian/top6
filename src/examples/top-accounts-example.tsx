import React from 'react';
import { LuksoTopAccountsManager } from "@/services/top-accounts-manager";
import { useUPProvider } from "@/providers/up-provider";

/**
 * Example of using the LuksoTopAccountsManager with blockchain integration
 */
const TopAccountsExample: React.FC = () => {
  const { provider, profileConnected, contextAccounts } = useUPProvider();
  
  async function runTopAccountsExample(): Promise<void> {
    // Create manager with some initial addresses
    const manager = new LuksoTopAccountsManager([
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
    
    console.log('Initial addresses:', manager.getAddresses());
    
    // Add more addresses
    manager.addAddress('0xcccccccccccccccccccccccccccccccccccccccc');
    manager.addAddress('0xdddddddddddddddddddddddddddddddddddddddd');
    manager.addAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    manager.addAddress('0xffffffffffffffffffffffffffffffffffffffff');
    
    console.log('After adding 4 more addresses:', manager.getAddresses());
    
    // Try to add more than 6 addresses (should fail)
    const success = manager.addAddress('0x1111111111111111111111111111111111111111');
    console.log('Added 7th address?', success); // Should print false
    
    // Remove an address
    manager.removeAddress('0xcccccccccccccccccccccccccccccccccccccccc');
    console.log('After removing one address:', manager.getAddresses());
    
    // Encode the addresses
    const encoded = manager.encodeAddresses();
    console.log('Encoded data:');
    console.log('Keys:', encoded.keys);
    console.log('Values:', encoded.values);
    
    // Store on blockchain using the connected Universal Profile
    if (profileConnected && contextAccounts.length > 0) {
      try {
        // Use the provider from UPProvider instead of hardcoded values
        const txHash = await manager.storeAddressesOnProfile(provider);
        console.log('Transaction hash:', txHash);
      } catch (error) {
        console.error('Failed to store addresses on blockchain:', error);
      }
    } else {
      console.log('Universal Profile not connected. Please connect your profile first.');
    }
  }

  return (
    <div>
      <h2>Top Accounts Example</h2>
      <button 
        onClick={() => runTopAccountsExample().catch(console.error)}
        disabled={!profileConnected}
      >
        Run Example
      </button>
      {!profileConnected && <p>Please connect your Universal Profile first</p>}
    </div>
  );
}

export default TopAccountsExample;