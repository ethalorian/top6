"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { useTop6 } from "@/providers/Top6Provider"

interface FollowButtonProps {
  address: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function FollowButton({
  address,
  className = "",
  variant = "default",
  size = "default",
  showText = true
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true)
  const { followAddress, unfollowAddress, checkIsFollowing, profileConnected, accounts } = useTop6()

  // Check if user is already following the address
  useEffect(() => {
    async function checkFollowStatus() {
      if (!profileConnected || !accounts || accounts.length === 0 || !address) {
        setIsCheckingStatus(false)
        return
      }

      setIsCheckingStatus(true)
      try {
        const followStatus = await checkIsFollowing(address)
        setIsFollowing(followStatus)
      } catch (error) {
        console.error("Error checking follow status:", error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkFollowStatus()
  }, [profileConnected, accounts, address, checkIsFollowing])

  const handleFollow = async () => {
    if (!profileConnected || !accounts || accounts.length === 0) {
      alert("Please connect your Universal Profile first")
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollowAddress(address)
        setIsFollowing(false)
      } else {
        await followAddress(address)
        setIsFollowing(true)
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profileConnected || !accounts || accounts.length === 0) {
    return null
  }

  // Don't show follow button for user's own address
  if (accounts[0] === address) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading || isCheckingStatus}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserCheck className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {showText && (isFollowing ? "Unfollow" : "Follow")}
    </Button>
  )
} 