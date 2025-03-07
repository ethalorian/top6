import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="py-[3%] px-[3%]">
      <Button 
        variant="link" 
        className="text-white p-0 flex items-center gap-[3%] text-[clamp(1rem,2vw,1.5rem)] font-light" 
        asChild
      >
        <Link href="#">
          <ChevronLeft className="w-[clamp(2.4rem,4.4vw,3.6rem)] h-[clamp(2.4rem,4.4vw,3.6rem)]" />
          <span>Click to Connect</span>
        </Link>
      </Button>
    </header>
  )
}

