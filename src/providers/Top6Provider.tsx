import { createContext, useState, useContext, useEffect, useRef, useCallback, ReactNode } from "react";
import { fetchTop6Addresses } from "@/utils/FetchProfileData";
import { fetchProfileMetadata, fetchPictureData } from "@/utils/ExtractProfileData";
import { encodeTop6Data } from "@/utils/EncodeERC725Data";
import { useUPProvider } from "@/providers/up-provider";
import { createClientUPProvider } from "@/providers/up-provider";
import { top6Schema } from "@/utils/GetDataKeys";
import { ethers } from "ethers";

// Types
export type ProfileLink = {
  title: string;
  url: string;
}

interface LSP3Link {
  title: string;
  url: string;
}

export type UserWithProfile = {
  username: string;
  avatar: string;
  hasData: boolean;
  headerImage?: string;
  badges?: string[];
  description?: string;
  address: string;
  links?: ProfileLink[];
}

// ABI for the Universal Profile contract
const UP_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "dataKey",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "dataValue",
        "type": "bytes"
      }
    ],
    "name": "setData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Default profile for empty slots
export const DEFAULT_PROFILE = {
  username: "Click to Add Profile",
  avatar: "/placeholder.svg?height=48&width=48",
  hasData: false,
  address: ""
};

// Top6 data key from schema
const TOP6_DATA_KEY = top6Schema[0].key;

// Context type
interface Top6ContextType {
  users: UserWithProfile[];
  isLoading: boolean;
  showSearchPanel: boolean;
  selectedUser: number | null;
  selectedCardId: string | null;
  handleCardClick: (cardId: string, index: number) => void;
  resetPopovers: () => void;
  handleAddressSelected: (address: string) => Promise<void>;
  handleRemoveAddress: (index: number) => Promise<void>;
  connectWallet: () => Promise<void>;
  fetchTop6ProfileData: () => Promise<void>;
  profileConnected: boolean;
  accounts: string[];
}

// Create the context
const Top6Context = createContext<Top6ContextType | undefined>(undefined);

// Provider component
export function Top6Provider({ children }: { children: ReactNode }) {
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const currentAccountRef = useRef<string | null>(null);

  // Get Universal Profile context
  const { accounts, profileConnected, provider } = useUPProvider();

  // Format profile links from LSP3 data
  const formatProfileLinks = (profileLinks: LSP3Link[] | undefined): ProfileLink[] => {
    if (!profileLinks || !Array.isArray(profileLinks)) return [];
    
    return profileLinks.map(link => ({
      title: link.title || 'Link',
      url: link.url || '#'
    }));
  };

  // Fetch Top6 addresses and their profile data
  const fetchTop6ProfileData = useCallback(async () => {
    if (!profileConnected || !accounts || accounts.length === 0) {
      console.log("Cannot fetch profiles: Not connected or no accounts available");
      const emptySlots = Array(6).fill(0).map(() => ({...DEFAULT_PROFILE}));
      setUsers(emptySlots);
      setIsLoading(false);
      return;
    }
    
    const currentAccount = accounts[0];
    setIsLoading(true);
    try {
      // Get the Top6 addresses from the contract
      console.log('Fetching Top6 addresses for account:', currentAccount);
      const addresses = await fetchTop6Addresses(currentAccount);
      
      // Create an array to hold the user data with all 6 slots
      const userData: UserWithProfile[] = Array(6).fill(null).map(() => ({...DEFAULT_PROFILE}));
      
      // If there are addresses, fetch their profile data
      if (addresses.length > 0) {
        console.log(`Found ${addresses.length} Top6 addresses to fetch profiles for`);
        
        // Process each address and put it in its corresponding position
        for (let i = 0; i < addresses.length; i++) {
          const addr = addresses[i];
          // Skip empty slots or zero addresses
          if (!addr || addr.trim() === '' || addr === '0x0000000000000000000000000000000000000000') {
            continue;
          }
          
          try {
            // Fetch profile metadata for each address
            const profileData = await fetchProfileMetadata(addr);
            const pictureData = await fetchPictureData(addr);
            
            // Update the user at the specific index
            userData[i] = {
              username: profileData.name || `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
              avatar: pictureData.fullSizeProfileImg || "/placeholder.svg?height=48&width=48",
              hasData: true,
              headerImage: pictureData.fullSizeBackgroundImg,
              description: profileData.description || "",
              badges: profileData.tags || [],
              links: formatProfileLinks(profileData.links),
              address: addr
            };
          } catch (error) {
            console.error(`Error fetching profile for address ${addr}:`, error);
            // Add user with minimal data if profile fetch fails, but preserve position
            userData[i] = {
              username: `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: true,
              description: "No profile data available",
              address: addr
            };
          }
        }
      } else {
        console.log('No Top6 addresses found, showing empty slots - this is normal for new profiles');
      }
      
      setUsers(userData);
      setDataFetched(true);
    } catch (error) {
      console.error("Error fetching Top6 data:", error);
      // If there's an error, create 6 empty slots
      const emptySlots = Array(6).fill(0).map(() => ({...DEFAULT_PROFILE}));
      setUsers(emptySlots);
      setDataFetched(true);
    } finally {
      setIsLoading(false);
    }
  }, [accounts, profileConnected]);

  // Helper function to wait for transaction receipt
  const waitForTransactionReceipt = async (
    provider: ReturnType<typeof createClientUPProvider>, 
    txHash: string, 
    timeout = 60000
  ) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        
        if (receipt) {
          return receipt;
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error checking transaction receipt:", error);
        throw error;
      }
    }
    
    throw new Error("Transaction confirmation timed out");
  };

  // Fetch profile data when connected
  useEffect(() => {
    // If we're connected and have an account
    if (profileConnected && accounts && accounts.length > 0) {
      const currentAccount = accounts[0];
      
      // Only fetch if we need to:
      // 1. We haven't fetched data yet, OR
      // 2. The account has changed
      if (!dataFetched || currentAccountRef.current !== currentAccount) {
        // Update the account ref
        currentAccountRef.current = currentAccount;
        // Fetch the data
        fetchTop6ProfileData();
      }
    } else if (!profileConnected) {
      // Reset state when disconnected - safely initialize with empty slots
      const emptySlots = Array(6).fill(0).map(() => ({...DEFAULT_PROFILE}));
      setUsers(emptySlots);
      setIsLoading(false);
      setDataFetched(false);
      currentAccountRef.current = null;
    }
  }, [profileConnected, accounts, fetchTop6ProfileData, dataFetched]);

  const handleCardClick = (cardId: string, index: number) => {
    if (selectedCardId === cardId) {
      // Clicking the same card again - close everything
      setSelectedCardId(null);
      setSelectedUser(null);
      setShowSearchPanel(false);
    } else if (!users[index].hasData) {
      // Clicking an empty card - show search panel
      setSelectedCardId(cardId);
      setSelectedUser(null);
      setShowSearchPanel(true);
    } else {
      // Clicking a card with data - show profile
      setSelectedCardId(cardId);
      setSelectedUser(index);
      setShowSearchPanel(false);
    }
  };

  const resetPopovers = () => {
    setSelectedCardId(null);
    setSelectedUser(null);
    setShowSearchPanel(false);
  };

  // Handle address selection from search panel
  const handleAddressSelected = async (address: string) => {
    if (!profileConnected || !accounts || accounts.length === 0 || !selectedCardId) {
      console.error("Cannot add address: Profile not connected or no account selected");
      return;
    }
    
    // Extract index from selected card id
    const index = parseInt(selectedCardId.replace('@', ''), 10);
    
    // Create a copy of the current users array
    const updatedUsers = [...users];
    
    try {
      // Fetch profile data for the selected address
      const profileData = await fetchProfileMetadata(address);
      const pictureData = await fetchPictureData(address);
      
      // Update the user at the specified index
      updatedUsers[index] = {
        username: profileData.name || `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        avatar: pictureData.fullSizeProfileImg || "/placeholder.svg?height=48&width=48",
        hasData: true,
        headerImage: pictureData.fullSizeBackgroundImg,
        description: profileData.description || "",
        badges: profileData.tags || [],
        links: formatProfileLinks(profileData.links),
        address: address
      };
      
      // Extract addresses for encoding, preserving positions
      const addresses: string[] = [];
      // Ensure we have exactly 6 slots
      for (let i = 0; i < 6; i++) {
        if (i < updatedUsers.length && updatedUsers[i].hasData && updatedUsers[i].address && 
            updatedUsers[i].address !== '0x0000000000000000000000000000000000000000') {
          addresses[i] = updatedUsers[i].address;
        } else {
          addresses[i] = '';
        }
      }
      
      // Encode the updated address list to be saved to the contract
      const encodedData = encodeTop6Data(addresses);
      console.log("Encoded data for saving to contract:", encodedData);
      
      // Create ethers interface for encoding function call
      const iface = new ethers.utils.Interface(UP_ABI);
      const calldata = iface.encodeFunctionData("setData", [TOP6_DATA_KEY, encodedData.values[0]]);
      
      console.log("Generated calldata for setData:", calldata);
      
      // Set loading state to indicate transaction in progress
      setIsLoading(true);
      
      try {
        // Send the transaction to update the contract using the provider
        const tx = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: accounts[0], // The Universal Profile contract address
            data: calldata, // Properly encoded function call to setData
          }]
        });
        
        console.log("Transaction sent:", tx);
        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(provider, tx as string);
        console.log("Transaction confirmed:", receipt);
        
        // Update the UI with the new data
        setUsers(updatedUsers);
        // We've successfully updated users, so data is considered fetched
        setDataFetched(true);
        resetPopovers();
        
      } catch (txError) {
        console.error("Transaction error:", txError);
        alert("Failed to save your Top6 profile changes to the blockchain. Please try again.");
      } finally {
        // End loading state
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Error updating address:", error);
      setIsLoading(false);
    }
  };

  // Handle removal of an address at a specific index
  const handleRemoveAddress = async (index: number) => {
    if (!profileConnected || !accounts || accounts.length === 0) {
      console.error("Cannot remove address: Profile not connected or no account selected");
      return;
    }
    
    // Validate that the index is within range
    if (index < 0 || index >= users.length) {
      console.error("Invalid index for address removal:", index);
      return;
    }

    try {
      // Create a copy of the current users array
      const updatedUsers = [...users];
      
      // Replace the user at the specified index with an empty slot
      updatedUsers[index] = {...DEFAULT_PROFILE};
      
      // Extract addresses for encoding, preserving positions
      const addresses: string[] = [];
      // Ensure we have exactly 6 slots
      for (let i = 0; i < 6; i++) {
        if (i < updatedUsers.length && updatedUsers[i].hasData && updatedUsers[i].address && 
            updatedUsers[i].address !== '0x0000000000000000000000000000000000000000') {
          addresses[i] = updatedUsers[i].address;
        } else {
          addresses[i] = '';
        }
      }
      
      // Encode the updated address list to be saved to the contract
      const encodedData = encodeTop6Data(addresses);
      console.log("Encoded data for saving to contract after removal:", encodedData);
      
      // Create ethers interface for encoding function call
      const iface = new ethers.utils.Interface(UP_ABI);
      const calldata = iface.encodeFunctionData("setData", [TOP6_DATA_KEY, encodedData.values[0]]);
      
      console.log("Generated calldata for setData after removal:", calldata);
      
      // Set loading state to indicate transaction in progress
      setIsLoading(true);
      
      try {
        // Send the transaction to update the contract using the provider
        const tx = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: accounts[0], // The Universal Profile contract address
            data: calldata, // Properly encoded function call to setData
          }]
        });
        
        console.log("Remove transaction sent:", tx);
        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(provider, tx as string);
        console.log("Remove transaction confirmed:", receipt);
        
        // Update the UI with the new data
        setUsers(updatedUsers);
        // We've successfully updated users, so data is considered fetched
        setDataFetched(true);
        resetPopovers();
        
      } catch (txError) {
        console.error("Transaction error during removal:", txError);
        alert("Failed to save your Top6 profile changes to the blockchain. Please try again.");
      } finally {
        // End loading state
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Error removing address:", error);
      setIsLoading(false);
    }
  };

  // Connect to the UP wallet
  const connectWallet = async () => {
    try {
      // This will trigger the wallet connection
      await provider.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Context value
  const contextValue: Top6ContextType = {
    users,
    isLoading,
    showSearchPanel,
    selectedUser,
    selectedCardId,
    handleCardClick,
    resetPopovers,
    handleAddressSelected,
    handleRemoveAddress,
    connectWallet,
    fetchTop6ProfileData,
    profileConnected,
    accounts
  };

  return (
    <Top6Context.Provider value={contextValue}>
      {children}
    </Top6Context.Provider>
  );
}

// Custom hook to use the Top6 contex
export function useTop6() {
  const context = useContext(Top6Context);
  if (context === undefined) {
    throw new Error("useTop6 must be used within a Top6Provider");
  }
  return context;
} 