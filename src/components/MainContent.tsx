import Image from "next/image"
import { Button } from "@/components/ui/button"

export function MainContent() {
  return (
    <div className="space-y-8 pt-12">
      <div className="w-80">
        <Image src="/top-6-logo.svg" alt="TOP 6" width={320} height={160} className="w-full" priority />
      </div>

      <div className="space-y-6">
        <h1 className="text-4xl font-bold">TOP 6</h1>
        <p className="text-2xl">Share. Discover. Follow.</p>

        <p className="text-xl max-w-md leading-relaxed">
          Curate your Top 6 Universal Profiles, all in one grid for your followers to discover and connect with new UPs.
        </p>

        <Button className="bg-[#0f172a] hover:bg-[#243542] text-white py-6 px-8 rounded-md text-xl h-auto w-full md:w-auto">
          Follow TOP 6
        </Button>
      </div>
    </div>
  )
}

