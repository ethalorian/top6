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
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true)
  
  // Create stable references to track component state
  const isMountedRef = useRef(true)
  const lastFollowStatusRef = useRef<boolean | null>(null)
  
  // Get context values (these will trigger re-renders when they change)
  const { followAddress, unfollowAddress, checkIsFollowing, profileConnected, accounts } = useTop6()
  
  // Store address in ref to maintain stable reference
  useEffect(() => {
    addressRef.current = address
  }, [address])
  
  // Memoize the follow status check to avoid new function references
  const checkFollowStatus = useCallback(async () => {
    if (!profileConnected || !accounts || accounts.length === 0 || !addressRef.current) {
      setIsCheckingStatus(false)
      return
    }

    // Skip redundant checks
    if (!isMountedRef.current) return
    
    try {
      setIsCheckingStatus(true)
      const followStatus = await checkIsFollowing(addressRef.current)
      
      // Only update state if it's different to prevent re-render cycles
      if (isMountedRef.current && lastFollowStatusRef.current !== followStatus) {
        lastFollowStatusRef.current = followStatus
        setIsFollowing(followStatus)
      }
    } catch (error) {
      console.error("Error checking follow status:", error)
    } finally {
      if (isMountedRef.current) {
        setIsCheckingStatus(false)
      }
    }
  }, [profileConnected, accounts, checkIsFollowing])

  // Check status on mount and when dependencies change
  useEffect(() => {
    checkFollowStatus()
    
    // Safety timeout to ensure button becomes active
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsCheckingStatus(false)
      }
    }, 2000)
    
    return () => {
      clearTimeout(timer)
    }
  }, [checkFollowStatus])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Memoize the follow/unfollow handler to avoid recreating on each render
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
          lastFollowStatusRef.current = false
          setIsFollowing(false)
        }
      } else {
        await followAddress(addressRef.current)
        if (isMountedRef.current) {
          lastFollowStatusRef.current = true
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

  if (!profileConnected || !accounts || accounts.length === 0) {
    return null
  }

  // Don't show follow button for user's own address
  if (accounts[0] === addressRef.current) {
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