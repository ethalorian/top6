import { ERC725SchemaConfig } from '../types/lukso';

/**
 * ERC725 schema configuration for Universal Profile top accounts
 */
export const ERC725_CONFIG: ERC725SchemaConfig = {
  TOP_ACCOUNTS_KEY: '0x19465d1fa6b15b330296b08997725c2c11937b3291cd13455901acc35602d8f9',
  TOP_ACCOUNTS_SCHEMA: [
    {
      name: 'MyTopAccounts',
      key: '0x19465d1fa6b15b330296b08997725c2c11937b3291cd13455901acc35602d8f9',
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