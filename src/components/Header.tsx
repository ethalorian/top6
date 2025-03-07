import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="py-[3%]">
      <Button 
        variant="link" 
        className="text-white p-0 flex items-center gap-[2%] text-[clamp(1rem,2vw,1.5rem)] font-light" 
        asChild
      >
        <Link href="#">
          <ChevronLeft className="w-[clamp(1.2rem,2.2vw,1.8rem)] h-[clamp(1.2rem,2.2vw,1.8rem)]" />
          <span>Click to Connect</span>
        </Link>
      </Button>
    </header>
  )
}

