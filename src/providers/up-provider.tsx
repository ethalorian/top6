'use client'; // Indicates this is a Client Component in Next.js, allowing use of browser APIs and React hooks

// Importing the Universal Profile provider from LUKSO's library
// This will allow our app to connect to LUKSO blockchain and Universal Profiles
import { createClientUPProvider } from '@lukso/up-provider';

// React imports for state management and context creation
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Define the type structure for our context
// This helps with TypeScript type checking and IDE autocomplete
interface UPContextType {
  accounts: Array<`0x${string}`>;        // Array of connected blockchain addresses
  contextAccounts: Array<`0x${string}`>; // Array of accounts with additional context/permissions
  profileConnected: boolean;             // Boolean flag indicating if a profile is connected
  provider: ReturnType<typeof createClientUPProvider>; // The provider instance from LUKSO
}

// Create a React context with the defined type structure
// The initial value is undefined, which will be populated in the provider
const UPContext = createContext<UPContextType | undefined>(undefined);

// The main provider component that will wrap parts of our application
// This makes the Universal Profile connection available to all child components
export function UPProvider({ children }: { children: React.ReactNode }) {
  // State to store the LUKSO provider instance
  const [provider, setProvider] = useState<ReturnType<typeof createClientUPProvider> | null>(null);
  
  // State to store regular blockchain accounts (addresses)
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  
  // State to store context accounts (accounts with additional permissions)
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([]);
  
  // State to track if a profile is successfully connected
  const [profileConnected, setProfileConnected] = useState(false);

  // A memoized callback function that updates the connection status
  // We check if both regular accounts and context accounts are available
  const updateConnected = useCallback(
    (_accounts: Array<`0x${string}`>, _contextAccounts: Array<`0x${string}`>) => {
      setProfileConnected(_accounts.length > 0 && _contextAccounts.length > 0);
    },
    []
  );

  // Effect hook that runs once when the component mounts
  // Sets up the provider and listeners for account changes
  useEffect(() => {
    // Create a new instance of the LUKSO Universal Profile provider
    const provider = createClientUPProvider();
    setProvider(provider);

    // Async function to initialize the connection
    async function init() {
      try {
        // Get existing connected accounts (if any)
        // eth_accounts is a standard Ethereum JSON-RPC method
        const _accounts = await provider.request({ method: 'eth_accounts' }) as Array<`0x${string}`>;
        setAccounts(_accounts);

        // Request permission to access accounts
        // eth_requestAccounts prompts the user to connect their wallet/profile
        const _contextAccounts = await provider.request({ method: 'eth_requestAccounts' }) as Array<`0x${string}`>;
        setContextAccounts(_contextAccounts);
        
        // Update the connection status based on the accounts we received
        updateConnected(_accounts, _contextAccounts);
      } catch (error) {
        // Log any errors during initialization and set connected status to false
        console.error('Failed to initialize provider:', error);
        setProfileConnected(false);
      }
    }

    // Handler function for when regular accounts change
    // This happens when users connect/disconnect their wallets
    const accountsChanged = (_accounts: Array<`0x${string}`>) => {
      setAccounts(_accounts);
      updateConnected(_accounts, contextAccounts);
    };

    // Handler function for when context accounts change
    // These are accounts with specific permissions for the dApp
    const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
      setContextAccounts(_accounts);
      updateConnected(accounts, _accounts);
    };

    // Call the initialization function
    init();

    // Register event listeners for account changes
    provider.on('accountsChanged', accountsChanged);
    provider.on('contextAccountsChanged', contextAccountsChanged);

    // Cleanup function that runs when the component unmounts
    // Removes the event listeners to prevent memory leaks
    return () => {
      provider.removeListener('accountsChanged', accountsChanged);
      provider.removeListener('contextAccountsChanged', contextAccountsChanged);
    };
  }, [updateConnected, accounts, contextAccounts]);

  // If the provider hasn't been initialized yet, render nothing
  // This prevents rendering the app before we have a connection
  if (!provider) {
    return null; // or a loading state
  }

  // Provide the context values to all child components
  // This makes accounts, connection status, and the provider available throughout the app
  return (
    <UPContext.Provider value={{ accounts, contextAccounts, profileConnected, provider }}>
      {children}
    </UPContext.Provider>
  );
}

// Custom hook that allows components to easily access the UP Provider context
// This simplifies using the context in child components
export function useUPProvider() {
  const context = useContext(UPContext);
  
  // Throw an error if this hook is used outside of a UPProvider
  // This helps developers catch misuse of the hook
  if (context === undefined) {
    throw new Error('useUPProvider must be used within a UPProvider');
  }
  
  return context;
}

// Re-export the createClientUPProvider function
// This allows importing it directly from this file
export { createClientUPProvider };