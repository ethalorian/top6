import { isValidAddress, normalizeAddress } from '../utils/addressUtils';
import { ethers } from 'ethers';

describe('Address Utilities', () => {
  test('validates correct addresses', () => {
    expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBeTruthy();
  });

  test('rejects invalid addresses', () => {
    expect(isValidAddress('not-an-address')).toBeFalsy();
    expect(isValidAddress('0x123')).toBeFalsy();
  });

  test('normalizes valid addresses', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const normalized = normalizeAddress(address);
    expect(normalized).not.toBeNull();
    expect(normalized).toEqual(ethers.utils.getAddress(address));
  });

  test('returns null for invalid addresses', () => {
    expect(normalizeAddress('invalid')).toBeNull();
  });
});