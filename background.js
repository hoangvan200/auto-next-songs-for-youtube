const enabledIconPaths = {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
};

const disabledIconPaths = {
    16: 'icons/icon-disabled16.png',
    48: 'icons/icon-disabled48.png',
    128: 'icons/icon-disabled128.png',
};

function setActionIcon(enabled) {
    chrome.action.setIcon({ path: enabled ? enabledIconPaths : disabledIconPaths });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Auto Continue Songs extension installed');
    setActionIcon(true);
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setIconState') {
        setActionIcon(request.enabled);
        sendResponse({ success: true });
        return;
    }

    if (request.action === 'nextSong') {
        sendResponse({ success: true });
    }
});