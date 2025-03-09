'use client';

// Patch the window.open function to prevent external redirects to universaleverything.io
if (typeof window !== 'undefined') {
  const originalOpen = window.open;
  window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
    if (url && (url.toString().includes('universaleverything.io') || url.toString().includes('lukso'))) {
      console.log('Prevented navigation to:', url);
      return null;
    }
    return originalOpen.call(this, url, target, features);
  };
}

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
    
    // Capture the current location - we'll check if we've navigated away
    const currentLocation = typeof window !== 'undefined' ? window.location.href : '';
    
    try {
      console.log('Attempting to connect to Universal Profile...');
      
      // First try to get accounts
      const _accounts = await provider.request({ method: 'eth_accounts' }) as Array<`0x${string}`>;
      setAccounts(_accounts);
      
      if (_accounts.length === 0) {
        console.log('No accounts found, requesting accounts...');
        
        // Patch window.location temporarily to prevent redirects
        if (typeof window !== 'undefined') {
          const originalAssign = window.location.assign;
          const originalReplace = window.location.replace;
          
          window.location.assign = function(url: string | URL): void {
            if (url.toString().includes('universaleverything.io') || url.toString().includes('lukso')) {
              console.log('Prevented navigation to:', url);
              return;
            }
            originalAssign.call(window.location, url);
          };
          
          window.location.replace = function(url: string | URL): void {
            if (url.toString().includes('universaleverything.io') || url.toString().includes('lukso')) {
              console.log('Prevented navigation to:', url);
              return;
            }
            originalReplace.call(window.location, url);
          };
          
          try {
            // Try to request accounts - this might redirect to browser extension
            const _requestedAccounts = await Promise.race([
              provider.request({ method: 'eth_requestAccounts' }) as Promise<Array<`0x${string}`>>,
              // Add a timeout to avoid waiting forever
              new Promise<Array<`0x${string}`>>((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), 3000)
              )
            ]);
            
            // Restore original functions
            window.location.assign = originalAssign;
            window.location.replace = originalReplace;
            
            setContextAccounts(_requestedAccounts);
            setAccounts(_requestedAccounts);
            updateConnected(_requestedAccounts, _requestedAccounts);
            return _requestedAccounts.length > 0;
          } catch (requestError) {
            // Restore original functions
            window.location.assign = originalAssign;
            window.location.replace = originalReplace;
            
            console.error('Failed to request accounts:', requestError);
            
            // Check if we were redirected
            if (typeof window !== 'undefined' && window.location.href !== currentLocation) {
              console.error('Page was redirected during connection attempt');
              // Try to go back to our app
              window.history.back();
            }
            
            return false;
          }
        } else {
          // Server-side or non-window environment
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
      
      // Check if we were redirected
      if (typeof window !== 'undefined' && window.location.href !== currentLocation) {
        console.error('Page was redirected during connection attempt');
        // Try to go back to our app
        window.history.back();
      }
      
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