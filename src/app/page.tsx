"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { UserCard } from "@/components/UserCard"
import { SearchPanel } from "@/components/SearchPanel"
import { ContentPanel } from "@/components/ContentPanel"
import { ProfilePanel } from "@/components/ProfilePanel"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUPMetadata } from "@/hooks/useUPMetadata"

type UserWithProfile = {
  username: string;
  avatar: string;
  hasData: boolean;
  headerImage: string;
  badges: string[];
  description: string;
  address: string;
}

export default function Top6Page() {
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserWithProfile[]>([])
  //const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
 // const [error, setError] = useState<string | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  
  // Use the UPMetadata hook
  const { 
    isConnected: profileConnected, 
    profileAddress,
    retrieveMetadataFromProfile,
    retrieveLSP3ProfileData
  } = useUPMetadata()

  // Add a ref to track if we've already attempted to fetch
  const hasFetchedRef = useRef(false);
  
  // Fetch user profiles when connected
  useEffect(() => {
    // Skip if we've already fetched once
    if (hasFetchedRef.current) return;
    
    // Move fetchProfilesWithRateLimiting inside useEffect to avoid dependency issues
    const fetchProfilesWithRateLimiting = async (addresses: string[]): Promise<UserWithProfile[]> => {
      const profiles: UserWithProfile[] = [];
      const batchSize = 2; // Process 2 profiles at a time
      const delayBetweenBatches = 1000; // 1 second delay between batches
      
      // Process addresses in batches
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        
        try {
          // Process this batch in parallel
          const batchPromises = batch.map(async (address) => {
            try {
              const profileData = await retrieveLSP3ProfileData(address, 'LSP3Profile');
              // Type assertion to access properties safely
              const profileValue = profileData?.value as Record<string, unknown> || {};
              
              return {
                username: (profileValue.name as string) || address.substring(0, 6) + '...' + address.substring(address.length - 4),
                avatar: ((profileValue.profileImage as Array<{url: string}>)?.[0]?.url) || "/placeholder.svg?height=48&width=48",
                hasData: !!profileValue,
                headerImage: ((profileValue.backgroundImage as Array<{url: string}>)?.[0]?.url) || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
                badges: ["badge"],
                description: (profileValue.description as string) || "No description available.",
                address
              };
            } catch (error) {
              console.error(`Error fetching profile for ${address}:`, error);
              return {
                username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                avatar: "/placeholder.svg?height=48&width=48",
                hasData: false,
                headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
                badges: ["badge"],
                description: "Could not load profile data.",
                address
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          profiles.push(...batchResults);
          
          // Add delay before next batch (but not after the last batch)
          if (i + batchSize < addresses.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        } catch (error) {
          console.error(`Error processing batch starting at index ${i}:`, error);
        }
      }
      
      return profiles.length > 0 ? profiles : [{
        username: "Error loading connections",
        avatar: "/placeholder.svg?height=48&width=48",
        hasData: false,
        headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
        badges: ["badge"],
        description: "There was an error loading your top accounts.",
        address: ""
      }];
    };

    const fetchProfiles = async () => {
      // Always start with loading state
      setIsLoading(true);
      
      try {
        if (profileConnected) {
          setIsConnected(true);
          
          try {
            // Get the user's top accounts using the schema name from your utils file
            const topAccountsData = await retrieveMetadataFromProfile(
              profileAddress,
              'MyTopAccounts'
            );
            
            // If we have connections, fetch their profile data
            if (topAccountsData && Array.isArray(topAccountsData.value)) {
              const addresses = topAccountsData.value as string[];
              console.log('Found top accounts:', addresses);
              
              if (addresses.length > 0) {
                // Batch process profiles with rate limiting protection
                const profilesData = await fetchProfilesWithRateLimiting(addresses.slice(0, 6));
                setUsers(profilesData);
              } else {
                // No addresses found
                setUsers([
                  {
                    username: "No connections found",
                    avatar: "/placeholder.svg?height=48&width=48",
                    hasData: false,
                    headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
                    badges: ["badge"],
                    description: "Add your top accounts to see them here.",
                    address: ""
                  }
                ]);
              }
            } else {
              console.log('No top accounts found or invalid data:', topAccountsData);
              // If no connections found, use placeholder data
              setUsers([
                {
                  username: "No connections found",
                  avatar: "/placeholder.svg?height=48&width=48",
                  hasData: false,
                  headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
                  badges: ["badge"],
                  description: "Add your top accounts to see them here.",
                  address: ""
                }
              ]);
            }
          } catch (error) {
            console.error('Error fetching top accounts:', error);
            // Use fallback data in case of error
            setUsers([
              {
                username: "Error loading connections",
                avatar: "/placeholder.svg?height=48&width=48",
                hasData: false,
                headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
                badges: ["badge"],
                description: "There was an error loading your top accounts.",
                address: ""
              }
            ]);
          }
        } else {
          // Not connected - use sample data
          setUsers([
            {
              username: "@USER#0000",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: true,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: ["badge", "badge", "badge"],
              description: "Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur.",
              address: ""
            },
            {
              username: "@USER#0001",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: true,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: ["badge", "badge"],
              description: "Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit.",
              address: ""
            },
            {
              username: "@USER#0002",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: true,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: ["badge"],
              description: "Consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus.",
              address: ""
            },
            {
              username: "@USER#0003",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: false,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: [],
              description: "No profile data available.",
              address: ""
            },
            {
              username: "@USER#0004",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: false,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: [],
              description: "No profile data available.",
              address: ""
            },
            {
              username: "@USER#0005",
              avatar: "/placeholder.svg?height=48&width=48",
              hasData: false,
              headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
              badges: [],
              description: "No profile data available.",
              address: ""
            },
          ]);
        }
      } catch (error) {
        console.error('Unexpected error in fetchProfiles:', error);
        // Set fallback data for any unexpected errors
        setUsers([
          {
            username: "Error loading data",
            avatar: "/placeholder.svg?height=48&width=48",
            hasData: false,
            headerImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
            badges: ["badge"],
            description: "There was an unexpected error loading data.",
            address: ""
          }
        ]);
      } finally {
        // Mark that we've attempted to fetch
        hasFetchedRef.current = true;
        // Always set loading to false when done
        setIsLoading(false);
      }
    };
    
    // Call the fetch function with a small delay to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      fetchProfiles();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [profileConnected, profileAddress, retrieveMetadataFromProfile, retrieveLSP3ProfileData]);

  const handleCardClick = (cardId: string) => {
    // Find the user index that matches the clicked card
    const userIndex = users.findIndex(user => user.username === cardId);
    
    if (selectedCardId === cardId) {
      // Clicking the same card again - close everything
      setSelectedCardId(null);
      setSelectedUser(null);
      setShowSearchPanel(false);
    } else {
      // Clicking a different card
      setSelectedCardId(cardId);
      setSelectedUser(userIndex >= 0 ? userIndex : null);
      setShowSearchPanel(false); // Don't show search panel, show profile instead
    }
  }

  const resetPopovers = () => {
    setSelectedCardId(null)
    setShowSearchPanel(false)
  }

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#4a044e] bg-opacity-70 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      <div className="h-full flex flex-col">
        <div className="h-[10%] max-h-[40px] min-h-[25px] pl-[3%] flex items-center">
          <Button
            variant="link"
            className="text-white p-0 flex items-center gap-[2%] text-[clamp(0.7rem,1.5vw,1rem)] font-light"
            onClick={() => setIsConnected(!isConnected)}
          >
            <ChevronLeft className="w-[clamp(1.5rem,3vw,3rem)] h-[clamp(1.5rem,3vw,3rem)]" />
            <span>{isConnected ? "Connected" : "Click to Connect"}</span>
          </Button>
        </div>
        <div className="flex-1 px-[0.67%] overflow-hidden">
          <div className="h-full mx-auto max-w-[1400px] aspect-[395.556/290]">
            <div className="h-full flex">
              <div className="h-full w-1/2 flex py-[3%] px-[1.5%] relative" ref={popoverRef}>
                <div className="h-full flex flex-col w-full">
                  {selectedUser !== null ? (
                    users[selectedUser].hasData ? (
                      <ProfilePanel user={users[selectedUser] as UserWithProfile} />
                    ) : (
                      <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
                        <h2 className="text-[#0f172a] text-2xl font-medium mb-4">No Profile Data</h2>
                        <p className="text-[#64748b] text-lg mb-8">This user doesn&apos;t have a profile yet.</p>
                        <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg">
                          Add Profile
                        </Button>
                      </div>
                    )
                  ) : showSearchPanel ? (
                    <SearchPanel onCancel={resetPopovers} />
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
                  {users.map((user, index) => (
                    <div key={index} className="relative flex-grow py-0">
                      <UserCard
                        username={user.username}
                        avatar={user.avatar}
                        hasData={user.hasData}
                        isSelected={selectedCardId === user.username}
                        onClick={() => handleCardClick(user.username)}
                        className={`text-[clamp(0.65rem,1.4vw,0.9rem)] flex flex-row items-center
                          ${selectedCardId === user.username ? 
                            "-ml-[clamp(0.5rem,3vw,3.5rem)] transition-all duration-300" : 
                            "transition-all duration-300"
                          }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

