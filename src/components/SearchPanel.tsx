"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchPanelProps {
  onCancel: () => void
}

export function SearchPanel({ onCancel }: SearchPanelProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="space-y-6">
        {/* Logo */}
        <div className="w-[30%] mx-auto bg-[#4a044e] rounded-lg p-4">
          <div className="relative w-full aspect-square">
            <Image 
              src="/top6-logo.svg" 
              alt="TOP 6" 
              fill
              className="object-contain object-center"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-4 mt-6">
            <p className="text-[#64748b] text-[clamp(0.9rem,1.8vw,1.3rem)]">
              Select up to six profiles to add and display on your Top 6.
            </p>
            
            <h3 className="font-medium text-[clamp(1rem,2vw,1.5rem)] mt-8 mb-2">
              Search by Address or Username
            </h3>
            
            <Input 
              placeholder="0×01234..." 
              className="rounded-lg border-gray-300 text-[clamp(0.9rem,1.8vw,1.2rem)] p-4"
            />
          </TabsContent>
          <TabsContent value="following">
            <p className="text-[#64748b] text-[clamp(0.9rem,1.8vw,1.3rem)]">
              Your followed profiles will appear here.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom buttons */}
      <div className="mt-auto flex gap-4">
        <Button 
          className="bg-[#4a044e] hover:bg-[#3b0040] text-white py-[3%] px-[6%] rounded-lg text-[clamp(0.9rem,1.8vw,1.3rem)] h-auto"
          onClick={() => {}}
        >
          Add
        </Button>
        
        <Button 
          variant="outline"
          className="text-[#4a044e] hover:bg-[#f8f9fa] py-[3%] px-[6%] rounded-lg text-[clamp(0.9rem,1.8vw,1.3rem)] h-auto"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

