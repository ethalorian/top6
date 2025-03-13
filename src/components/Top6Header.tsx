import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTop6 } from "@/providers/Top6Provider";

export function Top6Header() {
  const { profileConnected, accounts, resetPopovers, connectWallet } = useTop6();
  
  return (
    <div className="h-[10%] max-h-[40px] min-h-[25px] pl-[3%] flex items-center">
      <Button
        variant="link"
        className="text-white p-0 flex items-center gap-[2%] text-[clamp(0.7rem,1.5vw,1rem)] font-light"
        onClick={profileConnected ? resetPopovers : connectWallet}
      >
        <ChevronLeft className="w-[clamp(1.5rem,3vw,3rem)] h-[clamp(1.5rem,3vw,3rem)]" />
        <span>
          {profileConnected && accounts.length > 0
            ? `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`
            : "Click to Connect"
          }
        </span>
      </Button>
    </div>
  );
} 