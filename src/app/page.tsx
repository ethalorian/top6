"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { UserCard } from "@/components/UserCard"
import { SearchPanel } from "@/components/SearchPanel"
import { ContentPanel } from "@/components/ContentPanel"
import { ProfilePanel } from "@/components/ProfilePanel"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUPMetadata } from "@/hooks/useUPMetadata"
import { useUPProvider } from "@/providers/up-provider"

type UserWithProfile = {
  username: string;
  avatar: string;
  hasData: boolean;
  headerImage: string;
  badges: string[];
  description: string;
  address: string;
}

const NO_PROFILE_IMAGE = "/top6-logo.svg";
const DEFAULT_HEADER_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png";

// Add a function to handle beforeunload events and prevent certain redirects
function setupNavigationInterception(): (() => void) | undefined {
  if (typeof window !== 'undefined') {
    // Intercept beforeunload events
    const beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
      // Check the URL we're navigating to using document.activeElement
      const activeElement = document.activeElement as HTMLAnchorElement;
      if (activeElement && activeElement.tagName === 'A' && activeElement.href) {
        // If this is a link to universaleverything.io or lukso, prevent navigation
        if (activeElement.href.includes('universaleverything.io') || 
            activeElement.href.includes('lukso')) {
          event.preventDefault();
          console.log('Prevented navigation to external site:', activeElement.href);
          // Cancel the event
          event.returnValue = 'Navigation canceled';
          // Stop propagation
          event.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    
    // Return a cleanup function
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }
  return undefined;
}

// Add a function to handle click events and prevent navigation to external sites
function setupClickInterception(): (() => void) | undefined {
  if (typeof window !== 'undefined') {
    // Intercept all clicks
    const clickHandler = (event: MouseEvent): void => {
      // Check if the clicked element is a link
      const targetElement = event.target as HTMLElement;
      let linkElement: HTMLAnchorElement | null = null;
      
      // Try to find the closest anchor element
      if (targetElement.tagName === 'A') {
        linkElement = targetElement as HTMLAnchorElement;
      } else {
        linkElement = targetElement.closest('a') as HTMLAnchorElement;
      }
      
      // If this is a link to universaleverything.io or lukso, prevent navigation
      if (linkElement && linkElement.href) {
        if (linkElement.href.includes('universaleverything.io') || 
            linkElement.href.includes('lukso')) {
          event.preventDefault();
          console.log('Prevented click navigation to external site:', linkElement.href);
          // Stop propagation
          event.stopPropagation();
        }
      }
    };

    // Add the click event listener
    document.addEventListener('click', clickHandler, true); // Use capture phase
    
    // Return a cleanup function
    return () => {
      document.removeEventListener('click', clickHandler, true);
    };
  }
  return undefined;
}

export default function Top6Page() {
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserWithProfile[]>([])
  //const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
 // const [error, setError] = useState<string | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef<boolean>(false) // Add a ref to track if we've already fetched profiles
  const fetchProfilesRef = useRef<(() => Promise<void>) | null>(null) // Ref to store the fetchProfiles function
  
  // Define the refresh function using useCallback
  const refreshData = useCallback(() => {
    console.log('Manually refreshing data...');
    fetchedRef.current = false; // Reset the fetchedRef to allow a new fetch
    setIsLoading(true);
    if (fetchProfilesRef.current) {
      fetchProfilesRef.current();
    }
  }, []);
  
  // Use the UPMetadata hook
  const { 
    isConnected: profileConnected, 
    profileAddress,
    retrieveMetadataFromProfile,
    retrieveLSP3ProfileData
  } = useUPMetadata()
  
  // Get the connectProfile function from the UPProvider
  const { connectProfile } = useUPProvider();
  
  // Function to handle connect button click
  const handleConnect = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    console.log('Connect button clicked');
    
    if (profileConnected) {
      console.log('Already connected');
      return;
    }
    
    try {
      // Capture the current URL in case we need to restore it
      const currentUrl = window.location.href;
      
      // Set a flag to indicate we're in the middle of connecting
      const isConnecting = true;
      
      // Show loading state while connecting
      setIsLoading(true);
      
      // Add a one-time event listener to prevent any redirects during connection
      const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
        if (isConnecting) {
          event.preventDefault();
          event.returnValue = 'Connection in progress';
          console.log('Prevented navigation during connection');
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      try {
        // Attempt connection
        const success = await connectProfile();
        console.log(`Connection attempt ${success ? 'succeeded' : 'failed'}`);
        
        // Check if we were redirected
        if (window.location.href !== currentUrl) {
          console.log('Page was redirected during connection, returning to app');
          window.history.replaceState(null, '', currentUrl);
        }
      } finally {
        // Always clean up event listener and loading state
        window.removeEventListener('beforeunload', handleBeforeUnload);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error connecting to profile:', error);
      setIsLoading(false);
    }
  };

  // Fetch user profiles when connected
  /* eslint-disable react-hooks/exhaustive-deps */
  // Intentionally excluding retrieveMetadataFromProfile and retrieveLSP3ProfileData to prevent re-renders
  useEffect(() => {
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
          const batchPromises = batch.map(async (address: string): Promise<UserWithProfile> => {
            try {
              console.log(`Processing profile for address: ${address}`);
              // Add custom error handling for the decoding issue
              let profileData = null;
              try {
                // First, try to get LSP3Profile data
                profileData = await retrieveLSP3ProfileData(address, 'LSP3Profile');
                console.log(`LSP3 Profile raw data for ${address}:`, profileData);
                
                // Check if we got valid data
                if (profileData && profileData.value) {
                  // Create a properly structured user profile
                  const profileValue = profileData.value as Record<string, unknown> || {};
                  const hasValidData = profileValue && Object.keys(profileValue).length > 0;
                  
                  console.log(`Profile data extracted for ${address}:`, {
                    name: profileValue.name,
                    avatar: profileValue.profileImage,
                    background: profileValue.backgroundImage,
                    description: profileValue.description,
                    hasData: hasValidData
                  });
                  
                  // Extract profile image from the data structure
                  let avatarUrl = NO_PROFILE_IMAGE;
                  if (profileValue.profileImage) {
                    const profileImages = profileValue.profileImage as Array<{url: string}> || [];
                    if (profileImages.length > 0 && profileImages[0].url) {
                      avatarUrl = profileImages[0].url;
                      console.log(`Found avatar URL for ${address}: ${avatarUrl}`);
                    }
                  }
                  
                  // Extract background image
                  let headerImageUrl = DEFAULT_HEADER_IMAGE;
                  if (profileValue.backgroundImage) {
                    const backgroundImages = profileValue.backgroundImage as Array<{url: string}> || [];
                    if (backgroundImages.length > 0 && backgroundImages[0].url) {
                      headerImageUrl = backgroundImages[0].url;
                      console.log(`Found header image URL for ${address}: ${headerImageUrl}`);
                    }
                  }
                  
                  return {
                    username: (profileValue.name as string) || address.substring(0, 6) + '...' + address.substring(address.length - 4),
                    avatar: avatarUrl,
                    hasData: hasValidData,
                    headerImage: headerImageUrl,
                    badges: ["badge"],
                    description: (profileValue.description as string) || "No description available.",
                    address
                  };
                } else {
                  console.log(`No valid profile data found for ${address}. Using fallback.`);
                  return {
                    username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                    avatar: NO_PROFILE_IMAGE,
                    hasData: false,
                    headerImage: DEFAULT_HEADER_IMAGE,
                    badges: ["badge"],
                    description: "No profile data available for this address.",
                    address
                  };
                }
              } catch (decodingError) {
                console.warn(`Decoding error for ${address}:`, decodingError);
                // Check if it's the specific bytes decoding error we're experiencing
                const errorStr = String(decodingError);
                if (errorStr.includes('invalid codepoint') || 
                    errorStr.includes('missing continuation byte') || 
                    errorStr.includes('Error decoding value with type bytes')) {
                  console.log(`Known bytes decoding issue detected for ${address}, attempting recovery`);
                  // Try a targeted approach to get basic profile info despite decoding error
                  try {
                    // Try to get the name separately which might work
                    const nameData = await retrieveMetadataFromProfile(address, 'LSP3Profile:name');
                    if (nameData && nameData.value) {
                      return {
                        username: nameData.value as string || address.substring(0, 6) + '...' + address.substring(address.length - 4),
                        avatar: NO_PROFILE_IMAGE,
                        hasData: true,
                        headerImage: DEFAULT_HEADER_IMAGE,
                        badges: ["badge"],
                        description: "Profile data partially recovered. Some information may be missing.",
                        address
                      };
                    } else {
                      return {
                        username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                        avatar: NO_PROFILE_IMAGE,
                        hasData: false,
                        headerImage: DEFAULT_HEADER_IMAGE,
                        badges: ["badge"],
                        description: "Could not load profile data due to decoding error.",
                        address
                      };
                    }
                  } catch (recoveryError) {
                    console.error(`Recovery attempt failed for ${address}:`, recoveryError);
                    return {
                      username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                      avatar: NO_PROFILE_IMAGE,
                      hasData: false,
                      headerImage: DEFAULT_HEADER_IMAGE,
                      badges: ["badge"],
                      description: "Recovery failed. Could not load profile data.",
                      address
                    };
                  }
                } else {
                  // For other errors, use default fallback
                  console.log(`Falling back to default profile for ${address} due to decoding error`);
                  return {
                    username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                    avatar: NO_PROFILE_IMAGE,
                    hasData: false,
                    headerImage: DEFAULT_HEADER_IMAGE,
                    badges: ["badge"],
                    description: "Could not load profile data due to an error.",
                    address
                  };
                }
              }
            } catch (error) {
              console.error(`Error fetching profile for ${address}:`, error);
              return {
                username: address.substring(0, 6) + '...' + address.substring(address.length - 4),
                avatar: NO_PROFILE_IMAGE,
                hasData: false,
                headerImage: DEFAULT_HEADER_IMAGE,
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
            await new Promise<void>((resolve) => setTimeout(resolve, delayBetweenBatches));
          }
        } catch (error) {
          console.error(`Error processing batch starting at index ${i}:`, error);
        }
      }
      
      return profiles.length > 0 ? profiles : [{
        username: "Error loading connections",
        avatar: NO_PROFILE_IMAGE,
        hasData: false,
        headerImage: DEFAULT_HEADER_IMAGE,
        badges: ["badge"],
        description: "There was an error loading your top accounts.",
        address: ""
      }];
    };

    const fetchProfiles = async () => {
      // If we've already fetched profiles, don't fetch again
      if (fetchedRef.current) {
        console.log('Profiles already fetched, skipping redundant fetch');
        return;
      }
      
      // Always start with loading state
      setIsLoading(true);
      
      try {
        if (profileConnected) {
          setIsLoading(true);
          
          try {
            // Get the user's top accounts using the schema name from your utils file
            const topAccountsData = await retrieveMetadataFromProfile(
              profileAddress,
              'MyTopAccounts'
            );
            
            // Add debug logs to see the accounts data
            console.log('Top accounts data:', topAccountsData);
            
            // If we have connections, fetch their profile data
            if (topAccountsData && Array.isArray(topAccountsData.value)) {
              const addresses = topAccountsData.value as string[];
              console.log('Found top accounts:', addresses);
              
              if (addresses.length > 0) {
                // Batch process profiles with rate limiting protection
                const profilesData = await fetchProfilesWithRateLimiting(addresses.slice(0, 6));
                setUsers(profilesData);
                fetchedRef.current = true; // Mark as fetched
              } else {
                // No connections found, set a default message
                setUsers([{
                  username: "No connections found",
                  avatar: NO_PROFILE_IMAGE,
                  hasData: false,
                  headerImage: DEFAULT_HEADER_IMAGE,
                  badges: ["badge"],
                  description: "You don't have any connections yet.",
                  address: ""
                }]);
                fetchedRef.current = true; // Mark as fetched
              }
            } else {
              // No connections data at all, set a default message
              setUsers([{
                username: "No Top6 list found",
                avatar: NO_PROFILE_IMAGE,
                hasData: false,
                headerImage: DEFAULT_HEADER_IMAGE,
                badges: ["badge"],
                description: "You need to create a TOP6 list to see connections here.",
                address: ""
              }]);
              fetchedRef.current = true; // Mark as fetched
            }
          } catch (error) {
            console.error('Error fetching top accounts:', error);
            // Use fallback data in case of error
            setUsers([
              {
                username: "Error loading connections",
                avatar: NO_PROFILE_IMAGE,
                hasData: false,
                headerImage: DEFAULT_HEADER_IMAGE,
                badges: ["badge"],
                description: "There was an error loading your top accounts.",
                address: ""
              }
            ]);
            fetchedRef.current = true; // Mark as fetched even on error to avoid infinite retries
          }
        } else {
          // Not connected - use sample data
          setUsers([
            {
              username: "@USER#0000",
              avatar: NO_PROFILE_IMAGE,
              hasData: true,
              headerImage: DEFAULT_HEADER_IMAGE,
              badges: ["badge", "badge", "badge"],
              description: "Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur.",
              address: ""
            },
            {
              username: "@USER#0001",
              avatar: NO_PROFILE_IMAGE,
              hasData: true,
              headerImage: DEFAULT_HEADER_IMAGE,
              badges: ["badge", "badge"],
              description: "Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit.",
              address: ""
            },
            {
              username: "@USER#0002",
              avatar: NO_PROFILE_IMAGE,
              hasData: true,
              headerImage: DEFAULT_HEADER_IMAGE,
              badges: ["badge"],
              description: "Consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus.",
              address: ""
            },
            {
              username: "@USER#0003",
              avatar: NO_PROFILE_IMAGE,
              hasData: false,
              headerImage: DEFAULT_HEADER_IMAGE,
              badges: [],
              description: "No profile data available.",
              address: ""
            },
            {
              username: "@USER#0004",
              avatar: NO_PROFILE_IMAGE,
              hasData: false,
              headerImage: DEFAULT_HEADER_IMAGE,
              badges: [],
              description: "No profile data available.",
              address: ""
            },
            {
              username: "@USER#0005",
              avatar: NO_PROFILE_IMAGE,
              hasData: false,
              headerImage: DEFAULT_HEADER_IMAGE,
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
            avatar: NO_PROFILE_IMAGE,
            hasData: false,
            headerImage: DEFAULT_HEADER_IMAGE,
            badges: ["badge"],
            description: "There was an unexpected error loading data.",
            address: ""
          }
        ]);
        fetchedRef.current = true; // Mark as fetched even on error to avoid infinite retries
      } finally {
        // Always set loading to false when done
        setIsLoading(false);
      }
    };
    
    // Store the fetchProfiles function in the ref
    fetchProfilesRef.current = fetchProfiles;
    
    // Call the fetch function with a small delay to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      console.log('Fetching profiles with profile connection state:', profileConnected);
      console.log('Profile address:', profileAddress);
      fetchProfiles();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [profileConnected, profileAddress]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleCardClick = (cardId: string): void => {
    // Find the user index that matches the clicked card
    const userIndex = users.findIndex(user => user.username === cardId);
    
    // Log the action to debug
    console.log(`Card clicked: ${cardId}, user index: ${userIndex}`);
    
    if (selectedCardId === cardId) {
      // Clicking the same card again - close everything
      console.log('Closing selected card');
      setSelectedCardId(null);
      setSelectedUser(null);
      setShowSearchPanel(false);
    } else {
      // Clicking a different card
      console.log('Opening new card');
      setSelectedCardId(cardId);
      setSelectedUser(userIndex >= 0 ? userIndex : null);
      setShowSearchPanel(false); // Don't show search panel, show profile instead
    }
  }

  const resetPopovers = (): void => {
    setSelectedCardId(null);
    setShowSearchPanel(false);
  }

  // Handle clicks outside of cards and popovers
  /* eslint-disable react-hooks/exhaustive-deps */
  // Excluding resetPopovers to prevent re-attaching the event listener on each render
  useEffect(() => {
    // Use the correct MouseEvent type from DOM API, not React's MouseEvent
    const handleClickOutside = (event: globalThis.MouseEvent): void => {
      // Check if click is outside both the popover and cards container
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        cardsContainerRef.current &&
        !cardsContainerRef.current.contains(event.target as Node)
      ) {
        resetPopovers();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // We're excluding resetPopovers to prevent re-attaching the event listener on each render
  /* eslint-enable react-hooks/exhaustive-deps */

  // Add an effect to prevent navigation away from the app
  useEffect(() => {
    console.log('Setting up navigation interception');
    const cleanupBeforeUnload = setupNavigationInterception();
    const cleanupClick = setupClickInterception();
    
    return () => {
      if (typeof cleanupBeforeUnload === 'function') {
        cleanupBeforeUnload();
      }
      if (typeof cleanupClick === 'function') {
        cleanupClick();
      }
    };
  }, []);

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
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              e.preventDefault();
              console.log('Connection toggled');
              handleConnect(e);
            }}
          >
            <ChevronLeft className="w-[clamp(1.5rem,3vw,3rem)] h-[clamp(1.5rem,3vw,3rem)]" />
            <span>{profileConnected ? "Connected" : "Click to Connect"}</span>
          </Button>
          
          {/* Add a debug/refresh button */}
          <Button
            variant="link"
            className="text-white p-0 ml-4 flex items-center gap-[2%] text-[clamp(0.7rem,1.5vw,1rem)] font-light"
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              e.preventDefault();
              console.log('Refresh triggered');
              refreshData();
            }}
          >
            <span>Refresh Data</span>
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

