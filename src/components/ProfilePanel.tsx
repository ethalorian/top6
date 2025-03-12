import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserPlus, ExternalLink } from "lucide-react"

interface ProfilePanelProps {
  user: {
    username: string
    avatar: string
    headerImage?: string
    badges?: string[]
    description?: string
    address: string
  }
}

export function ProfilePanel({ user }: ProfilePanelProps) {
  const defaultHeaderImage = "/placeholder-header.svg"
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  return (
    <div className="bg-white rounded-sm h-full flex flex-col overflow-hidden w-full">
      {/* Header Image - using percentage of container height instead of fixed height */}
      <div className="h-[30%] relative">
        <Image 
          src={user.headerImage || defaultHeaderImage} 
          alt="Profile header" 
          fill 
          className="object-cover" 
        />
      </div>

      {/* Profile Content */}
      <div className="p-[3%] flex-1 flex flex-col">
        <div className="flex items-center gap-[3%] mb-[4%]">
          <div className="relative w-[15%] aspect-square">
            <Image
              src={user.avatar || "/placeholder.svg"}
              alt={`${user.username}'s avatar`}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[#0f172a] text-[clamp(1rem,2vw,1.5rem)] font-medium">{user.username}</span>
            <span className="text-[#94a3b8] text-[clamp(0.7rem,1.2vw,0.9rem)]">{formatAddress(user.address)}</span>
          </div>
        </div>
        
        {/* Badges */}
        {user.badges && user.badges.length > 0 && (
          <div className="flex gap-[2%] mb-[4%] flex-wrap">
            {user.badges.map((badge, index) => (
              <span key={index} className="bg-white border border-[#e2e8f0] rounded-sm px-[5%] py-[1%] text-[#0f172a] text-[clamp(0.7rem,1.2vw,1rem)]">
                {badge}
              </span>
            ))}
          </div>
        )}
        
        {/* Description - improved text scaling */}
        {user.description && (
          <p className="text-[#94a3b8] text-[clamp(0.8rem,1.5vw,1.1rem)] mb-auto leading-[1.5]">
            {user.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-[3%] mt-[4%]">
          <Button 
            className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-auto py-[3%] px-[5%] flex-1 text-[clamp(0.8rem,1.5vw,1.1rem)]"
            onClick={() => window.open(`https://wallet.universalprofile.cloud/${user.address}`, '_blank')}
          >
            <ExternalLink className="mr-[2%] h-[clamp(1.6rem,3vw,2.2rem)] w-[clamp(1.6rem,3vw,2.2rem)]" />
            View Profile
          </Button>
          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-auto py-[3%] px-[5%] flex-1 text-[clamp(0.8rem,1.5vw,1.1rem)]">
            <UserPlus className="mr-[2%] h-[clamp(1.6rem,3vw,2.2rem)] w-[clamp(1.6rem,3vw,2.2rem)]" />
            Follow
          </Button>
        </div>
      </div>
    </div>
  )
}

