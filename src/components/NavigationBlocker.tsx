'use client';

import { useEffect } from 'react';

export function NavigationBlocker(): null {
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    console.log('NavigationBlocker: Setting up interception');
    
    // Save original methods
    const originalOpen = window.open;
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href') || {
      get: () => window.location.toString(),
      set: (v: string) => { window.location.replace(v); }
    };
    
    // Check if a URL should be blocked
    const shouldBlockUrl = (url: string | URL | null | undefined): boolean => {
      if (!url) return false;
      const urlString = url.toString();
      return urlString.includes('universaleverything.io') || 
             urlString.includes('lukso.network') || 
             urlString.includes('deploy-preview') ||
             urlString.includes('web3modal');
    };
    
    // Override window.open
    window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
      if (shouldBlockUrl(url)) {
        console.log('NavigationBlocker: Blocked window.open to', url);
        return null;
      }
      return originalOpen.call(this, url, target, features);
    };
    
    // Override location.assign
    window.location.assign = function(url: string | URL): void {
      if (shouldBlockUrl(url)) {
        console.log('NavigationBlocker: Blocked location.assign to', url);
        return;
      }
      originalAssign.call(window.location, url);
    };
    
    // Override location.replace
    window.location.replace = function(url: string | URL): void {
      if (shouldBlockUrl(url)) {
        console.log('NavigationBlocker: Blocked location.replace to', url);
        return;
      }
      originalReplace.call(window.location, url);
    };
    
    // Override location.href
    Object.defineProperty(window.location, 'href', {
      get: originalHref.get,
      set: function(url: string) {
        if (shouldBlockUrl(url)) {
          console.log('NavigationBlocker: Blocked setting location.href to', url);
          return;
        }
        if (originalHref.set) {
          originalHref.set.call(window.location, url);
        }
      },
      configurable: true
    });
    
    // Handle all link clicks
    const clickHandler = (event: MouseEvent): void => {
      // Check if the clicked element is a link
      const targetElement = event.target as HTMLElement;
      const linkElement = targetElement.tagName === 'A' 
        ? targetElement as HTMLAnchorElement 
        : targetElement.closest('a') as HTMLAnchorElement | null;
      
      if (linkElement && linkElement.href && shouldBlockUrl(linkElement.href)) {
        event.preventDefault();
        event.stopPropagation();
        console.log('NavigationBlocker: Blocked click navigation to', linkElement.href);
      }
    };
    
    // Add global click handler with capture to intercept before any other handlers
    document.addEventListener('click', clickHandler, true);
    
    // Clean up on unmount
    return () => {
      // Restore original methods
      window.open = originalOpen;
      window.location.assign = originalAssign;
      window.location.replace = originalReplace;
      Object.defineProperty(window.location, 'href', originalHref);
      
      // Remove click handler
      document.removeEventListener('click', clickHandler, true);
      
      console.log('NavigationBlocker: Cleaned up interception');
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 