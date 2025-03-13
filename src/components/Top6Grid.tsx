import { useRef } from "react";
import { UserCard } from "@/components/UserCard";
import { useTop6 } from "@/providers/Top6Provider";

export function Top6Grid() {
  const { 
    users, 
    isLoading, 
    selectedCardId, 
    handleCardClick, 
    profileConnected,
    handleRemoveAddress
  } = useTop6();
  
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      className="w-1/2 h-full flex flex-col py-[3%] px-[1.5%] overflow-hidden" 
      ref={cardsContainerRef}
      data-cards-area="true"
    >
      <div className="flex-1 flex flex-col justify-between gap-[2%]">
        {!profileConnected ? (
          // Display connect message placeholders
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="relative flex-grow py-0">
              <div className="bg-gray-700 opacity-50 h-16 w-full rounded-sm flex items-center justify-center text-white/70">
                Connect to view profiles
              </div>
            </div>
          ))
        ) : isLoading ? (
          // Display loading placeholders
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="relative flex-grow py-0">
              <div className="bg-gray-700 animate-pulse h-16 w-full rounded-sm"></div>
            </div>
          ))
        ) : (
          users.map((user, index) => (
            <div key={index} className="relative flex-grow py-0">
              <UserCard
                username={user.username}
                avatar={user.avatar}
                hasData={user.hasData}
                isSelected={selectedCardId === `@${index}`}
                onClick={() => handleCardClick(`@${index}`, index)}
                onRemove={user.hasData ? () => handleRemoveAddress(index) : undefined}
                className={`text-[clamp(0.65rem,1.4vw,0.9rem)] flex flex-row items-center
                  ${selectedCardId === `@${index}` ? 
                    "-ml-[clamp(0.5rem,3vw,3.5rem)] transition-all duration-300" : 
                    "transition-all duration-300"
                  }`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
} 