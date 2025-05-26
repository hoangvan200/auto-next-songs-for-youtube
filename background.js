// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Auto Continue Songs extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'nextSong') {
        // Handle any background tasks if needed
        sendResponse({ success: true });
    }
}); 