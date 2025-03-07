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
      <div className="bg-[#f8fafc] rounded-t-sm p-4 flex items-center justify-center">
        <div className="bg-[#4a044e] rounded-xl w-32 h-32 flex items-center justify-center">
          <Image src="/top6-logo.svg" alt="TOP 6" width={100} height={50} className="w-full" priority />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="w-full bg-white h-12 p-1 border-b">
            <TabsTrigger
              value="search"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-lg font-medium"
            >
              Search
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-lg font-medium text-[#94a3b8]"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        <div className="space-y-6">
          <p className="text-[#64748b] text-lg">Select up to six profiles to add and display on your Top 6.</p>

          <div className="space-y-2">
            <label htmlFor="search" className="text-[#0f172a] font-medium text-lg">
              Search by Address or Username
            </label>
            <Input id="search" placeholder="0×01234..." className="bg-white border-[#e2e8f0] h-12 text-lg" />
          </div>

          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg">Add</Button>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="p-4 pt-0">
        <Button
          variant="ghost"
          className="w-full text-[#64748b] hover:text-[#4a044e] hover:bg-transparent text-lg"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

