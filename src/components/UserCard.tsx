"use client"

import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface UserCardProps {
  username: string
  avatar: string
  hasData?: boolean
  isSelected?: boolean
  onClick: () => void
  className?: string
}

export function UserCard({
  username,
  avatar,
  hasData = false,
  isSelected = false,
  onClick,
  className = "",
}: UserCardProps) {
  return (
    <Card
      className={`border-none rounded-2xl pl-4 pr-2 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 min-h-[5.5rem] ${
        isSelected ? "bg-white shadow-md" : "bg-[#94a3b8] hover:bg-[#d9d9d9]"
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-full">
          <AvatarImage src={avatar} alt="User avatar" />
          <AvatarFallback>UP</AvatarFallback>
        </Avatar>
        <span className={`text-xl font-medium ${isSelected ? "text-[#0f172a]" : "text-white"}`}>{username}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`${isSelected ? "text-[#0f172a]" : "text-white"} hover:text-[#4a044e] hover:bg-transparent`}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <div
          className={`flex items-center justify-center h-8 w-8 rounded-full border ${isSelected ? "border-[#0f172a]" : "border-white"}`}
        >
          <UserPlus className="h-4 w-4" />
        </div>
        <span className="sr-only">{hasData ? "View profile" : "Add user"}</span>
      </Button>
    </Card>
  )
}

