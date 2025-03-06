import { Button } from "@/components/ui/button"
import Image from 'next/image'

export function ContentPanel() {
  return (
    <div className="space-y-8 w-full">
      <div className="w-80">
        <Image 
          src="/top6-logo.svg" 
          alt="TOP 6" 
          width={320}
          height={120}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-bold">TOP 6</h1>
        <p className="text-3xl font-light">Share. Discover. Follow.</p>

        <p className="text-xl font-light max-w-lg leading-relaxed mt-2">
          Curate your Top 6 Universal Profiles, all in one grid for your followers to discover and connect with new UPs.
        </p>

        <div className="mt-8">
          <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-4 px-8 rounded-xl text-xl h-auto w-56">
            Follow TOP 6
          </Button>
        </div>
      </div>
    </div>
  )
}

