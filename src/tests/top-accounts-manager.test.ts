import { LuksoTopAccountsManager } from '../services/top-accounts-manager';
import { MAX_TOP_ACCOUNTS } from '../constants/lukso';

describe('LuksoTopAccountsManager', () => {
  // Basic initialization tests
  test('initializes with empty slots', () => {
    const manager = new LuksoTopAccountsManager();
    for (let i = 0; i < MAX_TOP_ACCOUNTS; i++) {
      expect(manager.getAddressAtSlot(i)).toBeNull();
    }
    expect(manager.getAddresses()).toEqual([]);
  });

  test('initializes with provided addresses in slots', () => {
    const addresses = {
      0: '0x1234567890123456789012345678901234567890',
      2: '0x0987654321098765432109876543210987654321'
    };
    const manager = new LuksoTopAccountsManager(addresses);
    
    expect(manager.getAddressAtSlot(0)).toEqual(addresses[0].toLowerCase());
    expect(manager.getAddressAtSlot(1)).toBeNull();
    expect(manager.getAddressAtSlot(2)).toEqual(addresses[2].toLowerCase());
    expect(manager.getAddresses()).toHaveLength(2);
  });

  // Slot management tests
  test('adding address to a specific slot', () => {
    const manager = new LuksoTopAccountsManager();
    const address = '0x1234567890123456789012345678901234567890';
    
    expect(manager.addAddress(address, 3)).toBeTruthy();
    expect(manager.getAddressAtSlot(3)).toEqual(address.toLowerCase());
    expect(manager.getAddresses()).toHaveLength(1);
  });

  test('updating an existing slot', () => {
    const manager = new LuksoTopAccountsManager();
    const address1 = '0x1234567890123456789012345678901234567890';
    const address2 = '0x0987654321098765432109876543210987654321';
    
    manager.addAddress(address1, 2);
    expect(manager.addAddress(address2, 2)).toBeTruthy();
    expect(manager.getAddressAtSlot(2)).toEqual(address2.toLowerCase());
  });

  test('rejecting invalid addresses', () => {
    const manager = new LuksoTopAccountsManager();
    expect(manager.addAddress('not-an-address', 0)).toBeFalsy();
    expect(manager.getAddressAtSlot(0)).toBeNull();
  });

  test('rejecting invalid slot index', () => {
    const manager = new LuksoTopAccountsManager();
    expect(manager.addAddress('0x1234567890123456789012345678901234567890', 6)).toBeFalsy();
    expect(manager.addAddress('0x1234567890123456789012345678901234567890', -1)).toBeFalsy();
  });

  test('removing address by slot index', () => {
    const manager = new LuksoTopAccountsManager();
    manager.addAddress('0x1234567890123456789012345678901234567890', 2);
    
    expect(manager.removeAddressAtSlot(2)).toBeTruthy();
    expect(manager.getAddressAtSlot(2)).toBeNull();
  });

  test('removing address by value', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const manager = new LuksoTopAccountsManager();
    manager.addAddress(address, 1);
    
    expect(manager.removeAddress(address)).toBeTruthy();
    expect(manager.getAddressAtSlot(1)).toBeNull();
  });

  // Encoding tests
  test('encodes addresses with slot-based schema', () => {
    const slots = {
      0: '0x1234567890123456789012345678901234567890',
      3: '0x0987654321098765432109876543210987654321'
    };
    const manager = new LuksoTopAccountsManager(slots);
    
    const encoded = manager.encodeAddresses();
    expect(encoded.keys).toBeDefined();
    expect(encoded.values).toBeDefined();
    expect(encoded.keys.length).toBeGreaterThanOrEqual(2); // At least one key per non-empty slot
  });
});