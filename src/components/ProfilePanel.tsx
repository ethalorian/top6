import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink, Link as LinkIcon } from "lucide-react"
import { useEffect } from "react"
import { FollowButton } from "@/components/ui/FollowButton"

interface ProfileLink {
  title: string;
  url: string;
}

interface ProfilePanelProps {
  user: {
    username: string;
    avatar: string;
    headerImage?: string;
    badges?: string[];
    description?: string;
    address: string;
    links?: ProfileLink[];
  }
}

export function ProfilePanel({ user }: ProfilePanelProps) {
  const defaultHeaderImage = "/placeholder-header.svg"
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  // Log image URLs for debugging
  useEffect(() => {
    console.log("ProfilePanel rendering with images:", { 
      avatar: user.avatar, 
      headerImage: user.headerImage 
    });
  }, [user.avatar, user.headerImage]);
  
  return (
    <div className="bg-white rounded-sm h-full flex flex-col overflow-hidden w-full">
      {/* Header Image - using percentage of container height instead of fixed height */}
      <div className="h-[30%] relative">
        <Image 
          src={user.headerImage || defaultHeaderImage} 
          alt="Profile header" 
          fill 
          className="object-cover"
          onError={(e) => {
            console.error("Error loading header image:", user.headerImage);
            (e.currentTarget as HTMLImageElement).src = defaultHeaderImage;
          }}
        />
      </div>

      {/* Profile Content */}
      <div className="p-[3%] flex-1 flex flex-col overflow-auto">
        <div className="flex items-center gap-[3%] mb-[4%]">
          <div className="relative w-[15%] aspect-square">
            <Image
              src={user.avatar || "/placeholder.svg"}
              alt={`${user.username}'s avatar`}
              fill
              className="rounded-full object-cover"
              onError={(e) => {
                console.error("Error loading avatar image:", user.avatar);
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              }}
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
          <p className="text-[#94a3b8] text-[clamp(0.8rem,1.5vw,1.1rem)] mb-4 leading-[1.5]">
            {user.description}
          </p>
        )}
        
        {/* Links Section */}
        {user.links && user.links.length > 0 && (
          <div className="mb-auto">
            <h3 className="text-[#0f172a] font-medium text-[clamp(0.9rem,1.7vw,1.2rem)] mb-2">Links</h3>
            <div className="space-y-2">
              {user.links.map((link, index) => (
                <a 
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[#4a044e] text-[clamp(0.8rem,1.5vw,1.1rem)] hover:underline"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {link.title}
                </a>
              ))}
            </div>
          </div>
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
          <FollowButton 
            address={user.address} 
            className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-auto py-[3%] px-[5%] flex-1 text-[clamp(0.8rem,1.5vw,1.1rem)]"
            variant="default"
            showText={true}
          />
        </div>
      </div>
    </div>
  )
}

