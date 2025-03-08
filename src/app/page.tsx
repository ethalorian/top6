"use client"

import { useState, useEffect, useRef } from "react"
import { UserCard } from "@/components/UserCard"
import { SearchPanel } from "@/components/SearchPanel"
import { ContentPanel } from "@/components/ContentPanel"
import { ProfilePanel } from "@/components/ProfilePanel"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type UserWithProfile = {
  username: string;
  avatar: string;
  hasData: boolean;
  headerImage: string;
  badges: string[];
  description: string;
}

export default function Top6Page() {
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  // Sample user data with some having profile data
  const users = [
    {
      username: "@USER#0000",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: true,
      headerImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
      badges: ["badge", "badge", "badge"],
      description:
        "Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur.",
    },
    {
      username: "@USER#0001",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: true,
      headerImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
      badges: ["badge", "badge"],
      description:
        "Habitant praesent facilisi vivamus, consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit.",
    },
    {
      username: "@USER#0002",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: true,
      headerImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TOP_6___Grid_v1-vUeZjoixx1qfYf2Mba1yccHhfcAZWP.png",
      badges: ["badge"],
      description:
        "Consequat eleifend etiam eget curabitur. Lorem ipsum odor amet, consectetuer adipiscing elit. Habitant praesent facilisi vivamus.",
    },
    {
      username: "@USER#0003",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: false,
    },
    {
      username: "@USER#0004",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: false,
    },
    {
      username: "@USER#0005",
      avatar: "/placeholder.svg?height=48&width=48",
      hasData: false,
    },
  ]

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

