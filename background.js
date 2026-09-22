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


// Data tracking logic
let bytesBuffer = 0;
let saveTimeout = null;
let recentBytes = [];

function flushData() {
  if (bytesBuffer === 0) return;
  const bytesToSave = bytesBuffer;
  bytesBuffer = 0;
  
  const date = new Date();
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  chrome.storage.local.get(['dataUsage'], (res) => {
    const usage = res.dataUsage || {};
    usage[localDate] = (usage[localDate] || 0) + bytesToSave;
    
    const keys = Object.keys(usage).sort();
    if (keys.length > 60) {
      delete usage[keys[0]];
    }
    
    chrome.storage.local.set({ dataUsage: usage });
  });
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    // FIX: Ignore cached requests to prevent wildly inaccurate overestimations
    if (details.fromCache) return;
    
    let bytes = 800; // Approx request/response headers
    const cl = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length');
    if (cl && cl.value) {
      bytes += parseInt(cl.value, 10);
    }
    bytesBuffer += bytes;
    
    const now = Date.now();
    recentBytes.push({ time: now, bytes });
    
    // keep only last 5 seconds for smooth speed calculation
    recentBytes = recentBytes.filter(r => r.time > now - 5000);
    
    if (bytesBuffer > 512 * 1024) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setIconState') {
    setIconState(Boolean(request.enabled));
    sendResponse({ success: true });
  } else if (request.action === 'setAudioOnlyState') {
    sendResponse({ success: true });
  } else if (request.action === 'getNetworkStats') {
    const now = Date.now();
    // Calculate speed over the last 3 seconds
    const windowMs = 3000;
    const recent = recentBytes.filter(r => r.time >= now - windowMs);
    const sumBytes = recent.reduce((sum, r) => sum + r.bytes, 0);
    
    const kbps = Math.round((sumBytes * 8) / 3000); // Kilobits per second
    
    const date = new Date();
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    chrome.storage.local.get(['dataUsage'], (res) => {
      sendResponse({
        usage: res.dataUsage || {},
        buffer: bytesBuffer,
        speedKbps: kbps
      });
    });
    return true; // async response
  }
});
