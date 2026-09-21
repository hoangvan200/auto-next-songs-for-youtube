const ICONS = {
  enabled: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  disabled: {
    16: 'icons/icon-disabled16.png',
    48: 'icons/icon-disabled48.png',
    128: 'icons/icon-disabled128.png'
  }
};

function setIconState(enabled) {
  chrome.action.setIcon({ path: enabled ? ICONS.enabled : ICONS.disabled });
}

function initializeState() {
  chrome.storage.sync.get({ autoContinueEnabled: true }, (state) => {
    setIconState(state.autoContinueEnabled);
  });
}

chrome.runtime.onInstalled.addListener(initializeState);
chrome.runtime.onStartup.addListener(initializeState);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setIconState') {
    setIconState(Boolean(request.enabled));
    sendResponse({ success: true });
  } else if (request.action === 'setAudioOnlyState') {
    // We don't need background logic for audio-only anymore, 
    // it's handled by localStorage and inject.js
    sendResponse({ success: true });
  }
});
