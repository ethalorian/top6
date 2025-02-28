'use client';

import { useUPProvider } from "@/providers/up-provider";

export default function Home() {
  const { accounts, contextAccounts, profileConnected } = useUPProvider();

  return (
    <div>
      <h1>Top6 App for The Grid</h1>
      <p>Connected: {profileConnected ? 'Yes' : 'No'}</p>
      {accounts[0] && <p>Account: {accounts[0]}</p>}
      {contextAccounts[0] && <p>Context Account: {contextAccounts[0]}</p>}
    </div>
  );
}
