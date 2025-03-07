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

  const handleCardClick = (index: number) => {
    // Automatically switch between panels based on card data
    if (users[index].hasData) {
      setSelectedUser(index)
      setShowSearchPanel(false)
    } else {
      setSelectedUser(null)
      setShowSearchPanel(true)
    }
  }

  const resetPopovers = () => {
    setSelectedUser(null)
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
        <div className="h-[8vh] pl-24 flex items-center">
          <Button
            variant="link"
            className="text-white p-0 flex items-center gap-3 text-xl font-light"
            onClick={() => setIsConnected(!isConnected)}
          >
            <ChevronLeft className="h-6 w-6" />
            <span>{isConnected ? "Connected" : "Click to Connect"}</span>
          </Button>
        </div>
        <div className="flex-1 px-6 overflow-hidden">
          <div className="h-full mx-auto">
            <div className="grid md:grid-cols-2 gap-0 h-full">
              {/* Left side content */}
              <div className="h-full flex items-center w-full" ref={popoverRef}>
                {selectedUser !== null ? (
                  <div className="w-full h-full px-0 overflow-hidden">
                    <ProfilePanel user={users[selectedUser] as UserWithProfile} />
                  </div>
                ) : showSearchPanel ? (
                  <div className="w-full h-full px-0 overflow-hidden">
                    <SearchPanel onCancel={resetPopovers} />
                  </div>
                ) : (
                  <div className="flex items-center w-full pl-24 h-full overflow-hidden">
                    <ContentPanel />
                  </div>
                )}
              </div>

              {/* Right side grid */}
              <div 
                className="flex flex-col h-full px-16 pr-2 py-2 overflow-hidden" 
                ref={cardsContainerRef}
                style={{
                  marginBottom: '40px', /* Increased margin at the bottom of the window */
                }}
              >
                <div className="h-full flex flex-col justify-between space-y-4">
                  {users.map((user, index) => (
                    <div key={index} className="relative">
                      <UserCard
                        username={user.username}
                        avatar={user.avatar}
                        hasData={user.hasData}
                        isSelected={selectedUser === index}
                        onClick={() => handleCardClick(index)}
                        className={`text-sm flex flex-row items-center ${
                          selectedUser === index ? "-ml-14 transition-all duration-300" : "transition-all duration-300"
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

