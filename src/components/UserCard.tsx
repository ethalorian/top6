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
      className={`w-full border-none rounded-tl-[1px] rounded-bl-[1px] rounded-tr-[6px] rounded-br-[6px] pl-[3%] pr-[2%] py-[3.5%] flex items-center justify-between cursor-pointer transition-all duration-300 min-h-[18%] ${
        isSelected ? "bg-white shadow-md" : "bg-[#94a3b8] hover:bg-[#d9d9d9]"
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-[4%]">
        <div className="relative w-[clamp(2rem,5vw,3.5rem)] aspect-square mr-[3%]">
          <Avatar className="h-full w-full rounded-md">
            <AvatarImage src={avatar} alt="User avatar" />
            <AvatarFallback>UP</AvatarFallback>
          </Avatar>
        </div>
        <span className={`text-[clamp(0.8rem,1.5vw,1.1rem)] font-medium ${isSelected ? "text-[#0f172a]" : "text-white"}`}>{username}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`flex items-center justify-center h-[clamp(2rem,4vw,3.5rem)] w-[clamp(2rem,4vw,3.5rem)] p-0 
        ${isSelected ? "text-[#0f172a]" : "text-white"} hover:text-[#4a044e] hover:bg-transparent`}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <div
          className={`flex items-center justify-center h-full w-full rounded-none border ${isSelected ? "border-[#0f172a]" : "border-white"}`}
        >
          <UserPlus className="h-[50%] w-[50%]" />
        </div>
        <span className="sr-only">{hasData ? "View profile" : "Add user"}</span>
      </Button>
    </Card>
  )
}

