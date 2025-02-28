'use client';

import { createClientUPProvider } from '@lukso/up-provider';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Create context with type definitions
interface UPContextType {
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  profileConnected: boolean;
  provider: ReturnType<typeof createClientUPProvider>;
}

const UPContext = createContext<UPContextType | undefined>(undefined);

export function UPProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ReturnType<typeof createClientUPProvider> | null>(null);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([]);
  const [profileConnected, setProfileConnected] = useState(false);

  const updateConnected = useCallback(
    (_accounts: Array<`0x${string}`>, _contextAccounts: Array<`0x${string}`>) => {
      setProfileConnected(_accounts.length > 0 && _contextAccounts.length > 0);
    },
    []
  );

  // Initialize provider in useEffect
  useEffect(() => {
    const provider = createClientUPProvider();
    setProvider(provider);

    async function init() {
      try {
        const _accounts = provider.accounts as Array<`0x${string}`>;
        setAccounts(_accounts);

        const _contextAccounts = provider.contextAccounts;
        setContextAccounts(_contextAccounts);
        updateConnected(_accounts, _contextAccounts);
      } catch (error) {
        console.error('Failed to initialize provider:', error);
      }
    }

    const accountsChanged = (_accounts: Array<`0x${string}`>) => {
      setAccounts(_accounts);
      updateConnected(_accounts, contextAccounts);
    };

    const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
      setContextAccounts(_accounts);
      updateConnected(accounts, _accounts);
    };

    init();

    provider.on('accountsChanged', accountsChanged);
    provider.on('contextAccountsChanged', contextAccountsChanged);

    return () => {
      provider.removeListener('accountsChanged', accountsChanged);
      provider.removeListener('contextAccountsChanged', contextAccountsChanged);
    };
  }, [accounts, contextAccounts, updateConnected]);

  if (!provider) {
    return null; // or a loading state
  }

  return (
    <UPContext.Provider value={{ accounts, contextAccounts, profileConnected, provider }}>
      {children}
    </UPContext.Provider>
  );
}

// Custom hook to use the UP Provider context
export function useUPProvider() {
  const context = useContext(UPContext);
  if (context === undefined) {
    throw new Error('useUPProvider must be used within a UPProvider');
  }
  return context;
}