
import { useUPProvider } from "@/providers/up-provider";

export default function Home() {
  const { accounts, contextAccounts, profileConnected } = useUPProvider();

  return (
    <div>
      <h1>Top6 App for The Grid</h1>
      <p>Connection Status: {profileConnected ? '✅ Connected' : '❌ Not Connected'}</p>
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>Debug Info:</p>
        <p>Accounts Length: {accounts.length}</p>
        <p>Context Accounts Length: {contextAccounts.length}</p>
      </div>
      {profileConnected && accounts[0] && <p>Account: {accounts[0]}</p>}
      {profileConnected && contextAccounts[0] && <p>Context Account: {contextAccounts[0]}</p>}
    </div>

  );
}
