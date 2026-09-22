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

// Data tracking logic
let bytesBuffer = 0;
let saveTimeout = null;

function flushData() {
  if (bytesBuffer === 0) return;
  const bytesToSave = bytesBuffer;
  bytesBuffer = 0;
  
  const date = new Date();
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  chrome.storage.local.get(['dataUsage'], (res) => {
    const usage = res.dataUsage || {};
    usage[localDate] = (usage[localDate] || 0) + bytesToSave;
    
    // Cleanup old data (keep 60 days)
    const keys = Object.keys(usage).sort();
    if (keys.length > 60) {
      delete usage[keys[0]];
    }
    
    chrome.storage.local.set({ dataUsage: usage });
  });
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    let bytes = 800; // Approx request headers
    const cl = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length');
    if (cl && cl.value) {
      bytes += parseInt(cl.value, 10);
    }
    bytesBuffer += bytes;
    
    if (bytesBuffer > 512 * 1024) { // Flush every 512KB
      if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
      flushData();
    } else if (!saveTimeout) {
      saveTimeout = setTimeout(() => {
        flushData();
        saveTimeout = null;
      }, 3000);
    }
  },
  { urls: ["*://*.googlevideo.com/*", "*://*.youtube.com/*", "*://*.ytimg.com/*"] },
  ["responseHeaders"]
);
