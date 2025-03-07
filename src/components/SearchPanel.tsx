"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchPanelProps {
  onCancel: () => void
}

export function SearchPanel({ onCancel }: SearchPanelProps) {
  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold">Search Users</h2>
      <Input 
        placeholder="Search by username..." 
        className="border-gray-300"
      />
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button>Search</Button>
      </div>
    </div>
  )
}

