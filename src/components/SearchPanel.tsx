"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Add props interface with onCancel function
interface SearchPanelProps {
  onCancel?: () => void;
}

export function SearchPanel({ onCancel }: SearchPanelProps) {
  return (
    <div className="bg-white rounded-sm h-full flex flex-col w-full overflow-hidden">
      {/* Logo Section */}
      <div className="p-4 flex justify-end">
        <div className="bg-[#4a044e] rounded-xl w-[120px] h-[120px] flex items-center justify-center">
          <Image src="/top6-logo.svg" alt="TOP 6" width={80} height={80} className="object-contain" priority />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-2">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="w-[60%] bg-[#f1f5f9] h-12 p-1 rounded-full">
            <TabsTrigger
              value="search"
              className="flex-1 rounded-full text-base font-medium"
            >
              Search
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 rounded-full text-base font-medium"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-6 flex-1">
          <p className="text-[#64748b] text-lg">
            Select up to six profiles to add and display on your Top 6.
          </p>

          <div className="space-y-3 mt-8">
            <h3 className="text-[#0f172a] font-medium text-lg">
              Search by Address or Username
            </h3>
            <Input 
              placeholder="0×01234..." 
              className="bg-white border-[#e2e8f0] h-12 text-base rounded-lg" 
            />
          </div>
        </div>
        
        {/* Add Button */}
        <div className="mt-auto flex justify-between">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="rounded-lg h-12 px-6 text-lg"
          >
            Cancel
          </Button>
          <Button className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-lg h-12 px-8 text-lg w-[120px]">
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}

