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
    }
    
    // Ensure inputs are properly initialized
    setTimeout(() => {
      const inputs = document.querySelectorAll('input, button, select, textarea');
      inputs.forEach((element) => {
        // Force reflow to ensure styles are applied
        element.style.display = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.display = '';
        
        // Add explicit touch event listeners if missing
        if (!element.hasAttribute('data-touch-fixed')) {
          element.setAttribute('data-touch-fixed', 'true');
          
          // Ensure touch events work
          element.addEventListener('touchstart', (e) => {
            e.stopPropagation();
          }, { passive: true });
        }
      });
    }, 100);
  }
  
  // Log environment for debugging
  console.log('Mobile fixes initialized:', {
    production: import.meta.env.PROD,
    mobile: isMobile,
    userAgent: navigator.userAgent
  });
};

// Fix for dynamically added elements
export const fixDynamicElement = (element: HTMLElement) => {
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLButtonElement || 
      element instanceof HTMLSelectElement || 
      element instanceof HTMLTextAreaElement) {
    
    // Ensure the element is interactive
    element.style.pointerEvents = 'auto';
    element.style.position = 'relative';
    element.style.zIndex = '999';
    
    // Add touch event listener
    if (!element.hasAttribute('data-touch-fixed')) {
      element.setAttribute('data-touch-fixed', 'true');
      element.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }
  }
};

// Mutation observer to fix dynamically added elements
export const startMobileFixObserver = () => {
  if (typeof MutationObserver === 'undefined') return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Fix the node itself if it's an input
          fixDynamicElement(node);
          
          // Fix any inputs within the node
          const inputs = node.querySelectorAll('input, button, select, textarea');
          inputs.forEach((input) => fixDynamicElement(input as HTMLElement));
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};