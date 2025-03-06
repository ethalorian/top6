"use client"

import { useState, useEffect, useRef } from "react"
import { UserCard } from "@/components/UserCard"
import { SearchPanel } from "@/components/SearchPanel"
import { ContentPanel } from "@/components/ContentPanel"
import { ProfilePanel } from "@/components/ProfilePanel"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen bg-[#4a044e] text-white">
      <div className="h-screen flex flex-col">
        <div className="h-[10vh] pl-24 flex items-center">
          <Button
            variant="link"
            className="text-white p-0 flex items-center gap-3 text-2xl font-light"
            onClick={() => setIsConnected(!isConnected)}
          >
            <ChevronLeft className="h-7 w-7" />
            <span>{isConnected ? "Connected" : "Click to Connect"}</span>
          </Button>
        </div>
        <div className="flex-1 px-6 pb-8">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid md:grid-cols-2 gap-0 h-full">
              {/* Left side content */}
              <div className="h-full flex items-center w-full" ref={popoverRef}>
                {selectedUser !== null ? (
                  <div className="w-full h-full px-0">
                    <ProfilePanel user={users[selectedUser] as any} />
                  </div>
                ) : showSearchPanel ? (
                  <div className="w-full h-full px-0">
                    <SearchPanel onCancel={resetPopovers} />
                  </div>
                ) : (
                  <div className="flex items-center w-full pl-24 h-full">
                    <ContentPanel />
                  </div>
                )}
              </div>

              {/* Right side grid */}
              <div className="grid grid-cols-1 h-full gap-1 pl-16 pr-2" ref={cardsContainerRef}>
                {users.map((user, index) => (
                  <div key={index} className="relative">
                    <UserCard
                      username={user.username}
                      avatar={user.avatar}
                      hasData={user.hasData}
                      isSelected={selectedUser === index}
                      onClick={() => handleCardClick(index)}
                      className={
                        selectedUser === index ? "-ml-14 transition-all duration-300" : "transition-all duration-300"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

