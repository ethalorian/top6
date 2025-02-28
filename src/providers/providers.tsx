'use client';

import { UPProvider } from './up-provider';
// Import other providers as needed

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UPProvider>
      {/* Add other providers here if needed */}
      {children}
    </UPProvider>
  );
}