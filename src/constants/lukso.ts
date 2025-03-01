import { ERC725SchemaConfig } from '../types/lukso';

/**
 * ERC725 schema configuration for Universal Profile top accounts
 */
export const ERC725_CONFIG: ERC725SchemaConfig = {
  TOP_ACCOUNTS_KEY: '0x38a0b0a149d59d46ad9c7fa612f0972948f82cc6f052268ef13a9e7da8a1dc84',
  TOP_ACCOUNTS_SCHEMA: [
    {
      name: 'MyTopAccounts',
      key: '0x38a0b0a149d59d46ad9c7fa612f0972948f82cc6f052268ef13a9e7da8a1dc84',
      keyType: 'Array',
      valueType: 'address',
      valueContent: 'Address'
    }
  ]
};

/**
 * Maximum number of addresses that can be stored in top accounts
 */
export const MAX_TOP_ACCOUNTS = 6;