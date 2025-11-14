// Chrome Extension Background Script
console.log('Google Notes Extension background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Notes Extension installed successfully');
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'KEEP_ALIVE') {
    sendResponse({ success: true });
  }
  return true;
});