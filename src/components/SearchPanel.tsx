"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchPanelProps {
  onCancel: () => void
}

export function SearchPanel({ onCancel }: SearchPanelProps) {
  return (
    <div className="bg-white rounded-sm h-full flex flex-col w-full overflow-hidden">
      {/* Logo Section */}
      <div className="bg-[#f8fafc] rounded-t-sm p-[3%] flex items-center justify-center h-[25%]">
        <div className="bg-[#4a044e] rounded-sm w-[40%] aspect-square flex items-center justify-center">
          <div className="relative w-[90%] h-[90%]">
            <Image 
              src="/top-6-logo.svg" 
              alt="TOP 6" 
              fill
              className="object-contain" 
              priority 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-[3%]">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="w-full bg-white h-[8%] min-h-[2.5rem] p-[1%] border-b">
            <TabsTrigger
              value="search"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-[clamp(0.9rem,1.8vw,1.2rem)] font-medium"
            >
              Search
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-[clamp(0.9rem,1.8vw,1.2rem)] font-medium text-[#94a3b8]"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-[3%] flex-1">
        <div className="space-y-[5%]">
          <p className="text-[#64748b] text-[clamp(0.8rem,1.5vw,1.1rem)] mb-[4%]">
            Select up to six profiles to add and display on your Top 6.
          </p>

          <div className="space-y-[2%] mb-[4%]">
            <label htmlFor="search" className="text-[#0f172a] font-medium text-[clamp(0.8rem,1.5vw,1.1rem)]">
              Search by Address or Username
            </label>
            <Input 
              id="search" 
              placeholder="0×01234..." 
              className="bg-white border-[#e2e8f0] h-[clamp(2.5rem,4vw,3rem)] text-[clamp(0.8rem,1.5vw,1.1rem)]" 
            />
          </div>

          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-[clamp(2.5rem,4vw,3rem)] px-[6%] text-[clamp(0.8rem,1.5vw,1.1rem)]">
            Add
          </Button>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="p-[3%] pt-0">
        <Button
          variant="ghost"
          className="w-full text-[#64748b] hover:text-[#4a044e] hover:bg-transparent text-[clamp(0.8rem,1.5vw,1.1rem)]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

