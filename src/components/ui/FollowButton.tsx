"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
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

// Memoize the entire component to prevent unnecessary re-renders
const FollowButton = memo(function FollowButtonInner({
  address,
  className = "",
  variant = "default",
  size = "default",
  showText = true
}: FollowButtonProps) {
  // Use refs to maintain stable state references
  const addressRef = useRef(address)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // Start with button enabled
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false)
  
  // Create stable references to track component state
  const isMountedRef = useRef(true)
  const checkLockRef = useRef(false)
  
  // Get context values (these will trigger re-renders when they change)
  const { followAddress, unfollowAddress, checkIsFollowing, profileConnected, accounts } = useTop6()
  
  // Store address in ref to maintain stable reference
  useEffect(() => {
    addressRef.current = address
  }, [address])
  
  // Memoize the follow status check to avoid new function references
  const checkFollowStatus = useCallback(async () => {
    // Don't run check if already checking or component not mounted
    if (checkLockRef.current || !isMountedRef.current) return
    if (!profileConnected || !accounts || accounts.length === 0 || !addressRef.current) return
    
    try {
      checkLockRef.current = true
      setIsCheckingStatus(true)
      
      const followStatus = await checkIsFollowing(addressRef.current)
      
      if (isMountedRef.current) {
        setIsFollowing(followStatus)
      }
    } catch (error) {
      console.error("Error in checkFollowStatus:", error)
    } finally {
      if (isMountedRef.current) {
        setIsCheckingStatus(false)
      }
      // Release lock after a slight delay to prevent immediate retries
      setTimeout(() => {
        checkLockRef.current = false
      }, 500)
    }
  }, [profileConnected, accounts, checkIsFollowing])

  // Run status check only once on mount or deps change
  useEffect(() => {
    // Always ensure button is enabled eventually
    const enableTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsCheckingStatus(false)
      }
    }, 1500)
    
    checkFollowStatus()
    
    return () => {
      clearTimeout(enableTimer)
    }
  }, [checkFollowStatus])
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle follow/unfollow action
  const handleFollow = useCallback(async () => {
    if (!profileConnected || !accounts || accounts.length === 0) {
      alert("Please connect your Universal Profile first")
      return
    }

    if (!isMountedRef.current) return
    
    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollowAddress(addressRef.current)
        if (isMountedRef.current) {
          setIsFollowing(false)
        }
      } else {
        await followAddress(addressRef.current)
        if (isMountedRef.current) {
          setIsFollowing(true)
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [profileConnected, accounts, followAddress, unfollowAddress, isFollowing])

  // Don't render button for user's own profile or when not connected
  if (!profileConnected || !accounts || accounts.length === 0 || accounts[0] === addressRef.current) {
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
})

// Export the memoized component
export { FollowButton } 