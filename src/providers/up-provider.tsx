'use client';

import { createClientUPProvider } from '@lukso/up-provider';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Create context with type definitions
interface UPContextType {
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  profileConnected: boolean;
  provider: ReturnType<typeof createClientUPProvider>;
  connectProfile: () => Promise<boolean>;
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

  // Function to manually connect to UP
  const connectProfile = useCallback(async (): Promise<boolean> => {
    if (!provider) return false;
    
    try {
      console.log('Attempting to connect to Universal Profile...');
      
      // First try to get accounts
      const _accounts = await provider.request({ method: 'eth_accounts' }) as Array<`0x${string}`>;
      setAccounts(_accounts);
      
      if (_accounts.length === 0) {
        console.log('No accounts found, requesting accounts...');
        // Try to request accounts - this might redirect to browser extension
        try {
          const _requestedAccounts = await provider.request({ 
            method: 'eth_requestAccounts' 
          }) as Array<`0x${string}`>;
          
          setContextAccounts(_requestedAccounts);
          setAccounts(_requestedAccounts);
          updateConnected(_requestedAccounts, _requestedAccounts);
          return _requestedAccounts.length > 0;
        } catch (requestError) {
          console.error('Failed to request accounts:', requestError);
          return false;
        }
      } else {
        // We already have accounts, just update context
        console.log('Accounts found:', _accounts);
        setContextAccounts(_accounts);
        updateConnected(_accounts, _accounts);
        return true;
      }
    } catch (error) {
      console.error('Error connecting to Universal Profile:', error);
      return false;
    }
  }, [provider, updateConnected]);

  useEffect(() => {
    const provider = createClientUPProvider();
    setProvider(provider);

    async function init() {
      try {
        // First just get existing accounts without prompting
        const _accounts = await provider.request({ method: 'eth_accounts' }) as Array<`0x${string}`>;
        setAccounts(_accounts);
        
        // Don't automatically request accounts as this causes redirect
        // Only request context accounts if we explicitly ask for it
        if (_accounts.length > 0) {
          try {
            const _contextAccounts = await provider.request({ method: 'eth_requestAccounts' }) as Array<`0x${string}`>;
            setContextAccounts(_contextAccounts);
            updateConnected(_accounts, _contextAccounts);
          } catch (error) {
            console.error('Failed to get context accounts:', error);
            // Continue without context accounts
            updateConnected(_accounts, []);
          }
        } else {
          // No accounts, so we're not connected
          setProfileConnected(false);
        }
      } catch (error) {
        console.error('Failed to initialize provider:', error);
        setProfileConnected(false);
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
  }, [updateConnected, accounts, contextAccounts]);

  if (!provider) {
    return null; // or a loading state
  }

  return (
    <UPContext.Provider value={{ 
      accounts, 
      contextAccounts, 
      profileConnected, 
      provider,
      connectProfile 
    }}>
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

// Re-export the function
export { createClientUPProvider };