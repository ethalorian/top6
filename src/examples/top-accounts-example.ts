import { LuksoTopAccountsManager } from "@/services/top-accounts-manager";

/**
 * Example of using the LuksoTopAccountsManager
 */
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
  
  // To store on blockchain (would need actual private key and RPC URL):
  // const txHash = await manager.storeAddressesOnProfile(
  //   'your-private-key',
  //   'https://rpc.lukso.network'
  // );
  // console.log('Transaction hash:', txHash);
}

// Run example
runTopAccountsExample().catch(console.error);