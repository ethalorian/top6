import { useRef } from "react";
import { useTop6 } from "@/providers/Top6Provider";
import { ProfilePanel } from "@/components/ProfilePanel";
import { SearchPanel } from "@/components/SearchPanel";
import { ContentPanel } from "@/components/ContentPanel";
import { Button } from "@/components/ui/button";

export function ContentArea() {
  const { 
    users, 
    isLoading, 
    showSearchPanel, 
    selectedUser, 
    resetPopovers, 
    handleAddressSelected, 
    profileConnected, 
    connectWallet 
  } = useTop6();
  
  const popoverRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="h-full w-1/2 flex py-[3%] px-[1.5%] relative" ref={popoverRef} data-content-area="true">
      <div className="h-full flex flex-col w-full">
        {!profileConnected ? (
          <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
            <h2 className="text-[#0f172a] text-2xl font-medium mb-4">Connect Your Profile</h2>
            <p className="text-[#64748b] text-lg mb-8">Connect your Universal Profile to view and manage your Top 6.</p>
            <Button 
              className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg"
              onClick={connectWallet}
            >
              Connect
            </Button>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
            <p className="text-[#64748b] text-lg">Loading profiles...</p>
          </div>
        ) : selectedUser !== null ? (
          users[selectedUser].hasData ? (
            <ProfilePanel user={users[selectedUser]} />
          ) : (
            <div className="bg-white rounded-sm h-full flex flex-col justify-center items-center w-full p-8 text-center">
              <h2 className="text-[#0f172a] text-2xl font-medium mb-4">Empty Slot</h2>
              <p className="text-[#64748b] text-lg mb-8">You can add a profile to this slot.</p>
              <Button 
                className="bg-[#4a044e] hover:bg-[#3a033e] text-white rounded-sm h-12 px-8 text-lg"
                onClick={() => handleAddressSelected("dummy")} // This will be intercepted by the state change
              >
                Add Profile
              </Button>
            </div>
          )
        ) : showSearchPanel ? (
          <SearchPanel 
            onCancel={resetPopovers} 
            onAddressSelected={handleAddressSelected} 
          />
        ) : (
          <ContentPanel />
        )}
      </div>
    </div>
  );
} 