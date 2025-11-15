// Detect if running as web app or extension
// This is moved from inline script to comply with CSP

export function detectAndSetMode() {
  const isWebMode = window.location.protocol.startsWith('http');
  const isExtensionMode = typeof chrome !== 'undefined' && chrome.runtime && (chrome.runtime as any).id;
  
  if (isWebMode && !isExtensionMode) {
    document.body.classList.add('web-mode');
    document.title = 'LiveNotes - Web App';
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  } else {
    document.body.classList.add('extension-mode');
    document.title = 'Live Notes Extension';
  }
}

