import { Button } from "@/components/ui/button"
import Image from 'next/image'

export function ContentPanel() {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="space-y-[5%]">
        <div className="w-[80%] mb-[2%]">
          <div className="relative w-full aspect-[1/1]">
            <Image 
              src="/top6-logo.svg" 
              alt="TOP 6" 
              fill
              className="object-contain object-left"
            />
          </div>
        </div>

        <div className="space-y-[3%] w-[80%]">
          <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-bold mb-[2%]">TOP 6</h1>
          <p className="text-[clamp(1.2rem,2.5vw,2rem)] font-light mb-[2%]">Share. Discover. Follow.</p>

          <p className="text-[clamp(0.9rem,1.8vw,1.3rem)] font-light leading-relaxed mt-[2%] mb-[4%]">
            Curate your Top 6 Universal Profiles, all in one grid for your followers to discover and connect with new UPs.
          </p>
        </div>
      </div>

      <div className="w-[80%] mt-auto">
        <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-[3%] px-[2%] rounded-sm text-[clamp(0.9rem,1.8vw,1.3rem)] h-auto w-[100%]">
          Follow TOP 6
        </Button>
      </div>
    </div>
  )
}

