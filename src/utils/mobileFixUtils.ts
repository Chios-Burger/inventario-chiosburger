/**
 * Mobile fix utilities for production builds
 * Addresses touch/click issues that only appear in production
 */

export const initializeMobileFixes = () => {
  // Add production class to HTML element
  if (import.meta.env.PROD) {
    document.documentElement.classList.add('production');
  }
  
  // Detect if running on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);
  
  if (isMobile) {
    document.documentElement.classList.add('is-mobile');
    
    // Fix for iOS Safari
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.documentElement.classList.add('ios');
    } else {
      // Android specific class
      document.documentElement.classList.add('android');
    }
  }
  
  // Log environment for debugging
  console.log('Mobile fixes initialized:', {
    production: import.meta.env.PROD,
    mobile: isMobile,
    userAgent: navigator.userAgent
  });
};

// Simplified - no dynamic fixes needed
export const fixDynamicElement = (element: HTMLElement) => {
  // Do nothing - let the browser handle it naturally
};

// Simplified observer
export const startMobileFixObserver = () => {
  // Return null - no observer needed
  return null;
};