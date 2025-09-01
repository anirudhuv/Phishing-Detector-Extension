// Background service worker for the Phishing Link Detector extension

// Log when the extension is installed
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Phishing Link Detector extension installed:', details.reason);
    
    if (details.reason === 'install') {
        console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Log when the extension starts up
chrome.runtime.onStartup.addListener(() => {
    console.log('Phishing Link Detector extension started');
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in background script:', request);
    
    // You can add message handling logic here if needed
    // For example, to coordinate between content scripts and popup
    
    return true; // Keep message channel open for async response
});

// Optional: Handle extension icon click (though we're using popup)
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on tab:', tab.url);
});

console.log('Phishing Link Detector background script loaded');