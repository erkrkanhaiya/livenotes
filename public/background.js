// Background script for Chrome Extension
console.log('Google Notes Extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Notes Extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'INIT_AUTH') {
    // Initialize authentication
    sendResponse({ success: true });
  }
  
  if (request.type === 'SYNC_NOTES') {
    // Handle note synchronization
    sendResponse({ success: true });
  }
  
  return true;
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes);
});