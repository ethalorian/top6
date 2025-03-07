import Image from "next/image"
import { Button } from "@/components/ui/button"

export function MainContent() {
  return (
    <div className="space-y-[6%] pt-[8%] w-full h-full flex flex-col justify-center">
      <div className="w-[80%] mb-[5%]">
        <div className="relative w-full aspect-[4/2]">
          <Image 
            src="/top-6-logo.svg" 
            alt="TOP 6" 
            fill 
            className="object-contain object-left" 
            priority 
          />
        </div>
      </div>

      <div className="space-y-[4%]">
        <h1 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold mb-[2%]">TOP 6</h1>
        <p className="text-[clamp(1rem,2vw,1.5rem)] mb-[3%]">Share. Discover. Follow.</p>

        <p className="text-[clamp(0.9rem,1.8vw,1.2rem)] max-w-[90%] leading-relaxed mb-[4%]">
          Curate your Top 6 Universal Profiles, all in one grid for your followers to discover and connect with new UPs.
        </p>

        <Button className="bg-[#0f172a] hover:bg-[#243542] text-white py-[3%] px-[6%] rounded-md text-[clamp(0.9rem,1.8vw,1.2rem)] h-auto w-[50%]">
          Follow TOP 6
        </Button>
      </div>
    </div>
  )
}

