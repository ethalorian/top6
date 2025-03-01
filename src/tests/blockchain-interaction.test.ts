import { LuksoTopAccountsManager } from '../services/top-accounts-manager';

// Directly mock the storeAddressesOnProfile method
describe('Blockchain Interactions', () => {
  test('storeAddressesOnProfile returns transaction hash', async () => {
    // Create manager with addresses in specific slots
    const manager = new LuksoTopAccountsManager({
      0: '0x1234567890123456789012345678901234567890',
      3: '0x0987654321098765432109876543210987654321'
    });
    
    // Mock the storeAddressesOnProfile method
    const originalMethod = manager.storeAddressesOnProfile;
    manager.storeAddressesOnProfile = jest.fn().mockResolvedValue('mock-tx-hash');
    
    const mockPrivateKey = '0000000000000000000000000000000000000000000000000000000000000001';
    const mockRpcUrl = 'https://mock-rpc-url';
    
    const txHash = await manager.storeAddressesOnProfile(mockPrivateKey, mockRpcUrl);
    
    expect(txHash).toBe('mock-tx-hash');
    expect(manager.storeAddressesOnProfile).toHaveBeenCalledWith(mockPrivateKey, mockRpcUrl);
    
    // Restore original method
    manager.storeAddressesOnProfile = originalMethod;
  });
});