import { useEffect } from "react";
import { Top6Header } from "@/components/Top6Header";
import { ContentArea } from "@/components/ContentArea";
import { Top6Grid } from "@/components/Top6Grid";
import { useTop6 } from "@/providers/Top6Provider";

export function Top6Layout() {
  const { resetPopovers } = useTop6();
  
  // Set up click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both content areas
      const targetElement = event.target as Element;
      const isOutsideClick = 
        !targetElement.closest('[data-content-area="true"]') && 
        !targetElement.closest('[data-cards-area="true"]');
      
      if (isOutsideClick) {
        resetPopovers();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resetPopovers]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#4a044e] text-white">
      <div className="h-full flex flex-col">
        <Top6Header />
        <div className="flex-1 px-[0.67%] overflow-hidden">
          <div className="h-full mx-auto max-w-[1400px] aspect-[395.556/290]">
            <div className="h-full flex">
              <ContentArea />
              <Top6Grid />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 