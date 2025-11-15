import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  useEffect(() => {
    // Don't show in extension mode
    if (isExtension) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed === 'true') {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after 15 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 15000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isExtension]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or in extension mode
  if (isExtension || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
      <div className="max-w-md mx-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 flex items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          {isIOS ? (
            <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          ) : (
            <Download className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white mb-1">
            Install LiveNotes
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {isIOS 
              ? 'Add to Home Screen for quick access'
              : 'Install our app for a better experience'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Install
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

