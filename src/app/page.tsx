"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { UserCard } from "@/components/UserCard"
import { SearchPanel } from "@/components/SearchPanel"
import { ContentPanel } from "@/components/ContentPanel"
import { ProfilePanel } from "@/components/ProfilePanel"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchTop6Addresses } from "@/utils/FetchProfileData"
import { fetchProfileMetadata, fetchPictureData } from "@/utils/ExtractProfileData"
import { encodeTop6Data } from "@/utils/EncodeERC725Data"
import { useUPProvider } from "@/providers/up-provider"

type ProfileLink = {
  title: string;
  url: string;
}

interface LSP3Link {
  title: string;
  url: string;
}

type UserWithProfile = {
  username: string;
  avatar: string;
  hasData: boolean;
  headerImage?: string;
  badges?: string[];
  description?: string;
  address: string;
  links?: ProfileLink[];
}

// Default profile data for empty slots
const DEFAULT_PROFILE = {
  username: "Empty Slot",
  avatar: "/placeholder.svg?height=48&width=48",
  hasData: false,
  address: ""
}

export default function Top6Page() {
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get Universal Profile context
  const { accounts, profileConnected, provider } = useUPProvider()
  
  const popoverRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  // Format profile links from LSP3 data
  const formatProfileLinks = (profileLinks: LSP3Link[] | undefined): ProfileLink[] => {
    if (!profileLinks || !Array.isArray(profileLinks)) return [];
    
    return profileLinks.map(link => ({
      title: link.title || 'Link',
      url: link.url || '#'
    }));
  }

  // Fetch Top6 addresses and their profile data
  const fetchTop6ProfileData = useCallback(async () => {
    if (!profileConnected || accounts.length === 0) return;
    
    const currentAccount = accounts[0];
    setIsLoading(true)
    try {
      // Get the Top6 addresses from the contract
      const addresses = await fetchTop6Addresses(currentAccount)
      
      // Create an array to hold the user data
      const userData: UserWithProfile[] = []
      
      // If there are addresses, fetch their profile data
      if (addresses.length > 0) {
        for (const addr of addresses) {
          try {
            // Fetch profile metadata for each address
            const profileData = await fetchProfileMetadata(addr)
            const pictureData = await fetchPictureData(addr)
            
            // Add user with profile data
            userData.push({
              username: profileData.name || `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
              avatar: pictureData.fullSizeProfileImg || "/placeholder.svg?height=48&width=48",
              hasData: true,
              headerImage: pictureData.fullSizeBackgroundImg,
              description: profileData.description || "",
              badges: profileData.tags || [],
              links: formatProfileLinks(profileData.links),
              address: addr
            })
          } catch (error) {
            console.error(`Error fetching profile for address ${addr}:`, error)
            // Add user with minimal data if profile fetch fails
            userData.push({
              username: `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`,
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: true,
              description: "No profile data available",
              address: addr
            })
          }
        }
      }
      
      // Fill remaining slots up to 6
      while (userData.length < 6) {
        userData.push({...DEFAULT_PROFILE})
      }
      
      setUsers(userData)
    } catch (error) {
      console.error("Error fetching Top6 data:", error)
      // If there's an error, create 6 empty slots
      const emptySlots = Array(6).fill(0).map(() => ({...DEFAULT_PROFILE}))
      setUsers(emptySlots)
    } finally {
      setIsLoading(false)
    }
  }, [accounts, profileConnected])

  // Fetch profile data when connected
  useEffect(() => {
    if (profileConnected && accounts.length > 0) {
      fetchTop6ProfileData();
    } else {
      // Reset users array and show loading when disconnected
      setUsers([]);
      setIsLoading(true);
    }
  }, [profileConnected, accounts, fetchTop6ProfileData]);

  const handleCardClick = (cardId: string, index: number) => {
    if (selectedCardId === cardId) {
      // Clicking the same card again - close everything
      setSelectedCardId(null)
      setSelectedUser(null)
      setShowSearchPanel(false)
    } else if (!users[index].hasData) {
      // Clicking an empty card - show search panel
      setSelectedCardId(cardId)
      setSelectedUser(null)
      setShowSearchPanel(true)
    } else {
      // Clicking a card with data - show profile
      setSelectedCardId(cardId)
      setSelectedUser(index)
      setShowSearchPanel(false)
    }
  }

  const resetPopovers = () => {
    setSelectedCardId(null)
    setShowSearchPanel(false)
  }

  // Handle address selection from search panel
  const handleAddressSelected = async (address: string) => {
    if (!profileConnected || accounts.length === 0 || !selectedCardId) return;
    
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
      
      // Extract just the addresses for encoding
      const addresses = updatedUsers
        .filter(user => user.hasData && user.address)
        .map(user => user.address);
      
      // Encode the updated address list to be saved to the contract
      const encodedData = encodeTop6Data(addresses);
      console.log("Encoded data for saving to contract:", encodedData);
      
      // Here you would send the transaction to update the contract using the provider
      // This is a placeholder for the actual transaction code
      // const tx = await provider.request({
      //   method: 'eth_sendTransaction',
      //   params: [{
      //     from: accounts[0],
      //     to: accounts[0], // Contract address would go here
      //     data: encodedData.values[0], // The encoded function call
      //   }]
      // });
      
      // For now, just update the UI
      setUsers(updatedUsers);
      resetPopovers();
      
    } catch (error) {
      console.error("Error updating address:", error);
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

  // Handle clicks outside of cards and popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the popover and cards container
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        cardsContainerRef.current &&
        !cardsContainerRef.current.contains(event.target as Node)
      ) {
        resetPopovers()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#4a044e] text-white">
      <div className="h-full flex flex-col">
        <div className="h-[10%] max-h-[40px] min-h-[25px] pl-[3%] flex items-center">
          <Button
            variant="link"
            className="text-white p-0 flex items-center gap-[2%] text-[clamp(0.7rem,1.5vw,1rem)] font-light"
            onClick={profileConnected ? resetPopovers : connectWallet}
          >
            <ChevronLeft className="w-[clamp(1.5rem,3vw,3rem)] h-[clamp(1.5rem,3vw,3rem)]" />
            <span>
              {profileConnected 
                ? `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`
                : "Click to Connect"
              }
            </span>
          </Button>
        </div>
        <div className="flex-1 px-[0.67%] overflow-hidden">
          <div className="h-full mx-auto max-w-[1400px] aspect-[395.556/290]">
            <div className="h-full flex">
              <div className="h-full w-1/2 flex py-[3%] px-[1.5%] relative" ref={popoverRef}>
                <div className="h-full flex flex-col w-full">
                  {!profileConnected ? (
                    <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
                      <h2 className="text-[#0f172a] text-2xl font-medium mb-4">Connect Your Profile</h2>
                      <p className="text-[#64748b] text-lg mb-8">Connect your Universal Profile to view and manage your Top 6.</p>
                      <Button 
                        className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg"
                        onClick={connectWallet}
                      >
                        Connect
                      </Button>
                    </div>
                  ) : isLoading ? (
                    <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
                      <p className="text-[#64748b] text-lg">Loading profiles...</p>
                    </div>
                  ) : selectedUser !== null ? (
                    users[selectedUser].hasData ? (
                      <ProfilePanel user={users[selectedUser]} />
                    ) : (
                      <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
                        <h2 className="text-[#0f172a] text-2xl font-medium mb-4">Empty Slot</h2>
                        <p className="text-[#64748b] text-lg mb-8">You can add a profile to this slot.</p>
                        <Button 
                          className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg"
                          onClick={() => setShowSearchPanel(true)}
                        >
                          Add Profile
                        </Button>
                      </div>
                    )
                  ) : showSearchPanel ? (
                    <SearchPanel 
                      onCancel={resetPopovers} 
                      onAddressSelected={handleAddressSelected} 
                    />
                  ) : (
                    <ContentPanel />
                  )}
                </div>
              </div>

              <div 
                className="w-1/2 h-full flex flex-col py-[3%] px-[1.5%] overflow-hidden" 
                ref={cardsContainerRef}
              >
                <div className="flex-1 flex flex-col justify-between gap-[2%]">
                  {!profileConnected ? (
                    // Display connect message placeholders
                    Array(6).fill(0).map((_, index) => (
                      <div key={index} className="relative flex-grow py-0">
                        <div className="bg-gray-700 opacity-50 h-16 w-full rounded-sm flex items-center justify-center text-white/70">
                          Connect to view profiles
                        </div>
                      </div>
                    ))
                  ) : isLoading ? (
                    // Display loading placeholders
                    Array(6).fill(0).map((_, index) => (
                      <div key={index} className="relative flex-grow py-0">
                        <div className="bg-gray-700 animate-pulse h-16 w-full rounded-sm"></div>
                      </div>
                    ))
                  ) : (
                    users.map((user, index) => (
                      <div key={index} className="relative flex-grow py-0">
                        <UserCard
                          username={user.username}
                          avatar={user.avatar}
                          hasData={user.hasData}
                          isSelected={selectedCardId === `@${index}`}
                          onClick={() => handleCardClick(`@${index}`, index)}
                          className={`text-[clamp(0.65rem,1.4vw,0.9rem)] flex flex-row items-center
                            ${selectedCardId === `@${index}` ? 
                              "-ml-[clamp(0.5rem,3vw,3.5rem)] transition-all duration-300" : 
                              "transition-all duration-300"
                            }`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

