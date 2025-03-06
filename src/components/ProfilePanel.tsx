import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface ProfilePanelProps {
  user: {
    username: string
    avatar: string
    headerImage: string
    badges: string[]
    description: string
  }
}

export function ProfilePanel({ user }: ProfilePanelProps) {
  return (
    <div className="bg-white rounded-2xl h-full flex flex-col overflow-hidden w-full">
      {/* Header Image */}
      <div className="h-64 relative">
        <Image src={user.headerImage || "/placeholder.svg"} alt="Profile header" fill className="object-cover" />
      </div>

      {/* Profile Content */}
      <div className="p-4 flex-1 flex flex-col">
        {" "}
        {/* Restored p-4 padding */}
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={user.avatar || "/placeholder.svg"}
            alt={`${user.username}'s avatar`}
            width={60}
            height={60}
            className="rounded-full"
          />
          <span className="text-[#0f172a] text-2xl font-medium">{user.username}</span>
        </div>
        {/* Badges */}
        <div className="flex gap-2 mb-6">
          {user.badges.map((badge, index) => (
            <span key={index} className="bg-white border border-[#e2e8f0] rounded-full px-6 py-2 text-[#0f172a]">
              {badge}
            </span>
          ))}
        </div>
        {/* Description */}
        <p className="text-[#94a3b8] text-lg mb-auto">{user.description}</p>
        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-xl h-14 px-6 flex-1 text-lg">
            Explore Profile
          </Button>
          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-xl h-14 px-6 flex-1 text-lg">
            <UserPlus className="mr-2 h-5 w-5" />
            Follow
          </Button>
        </div>
      </div>
    </div>
  )
}

