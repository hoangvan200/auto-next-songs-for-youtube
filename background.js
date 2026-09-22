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

// ---- Data Transfer Tracking ----
// Source of truth: PerformanceObserver from content.js reports accurate
// transferSize (real wire bytes). webRequest is kept only as a speed signal
// since transferSize is not available there — but we NO LONGER count it
// towards the total to avoid double-counting.

let recentBytes = [];   // for speed calculation only
let bytesBuffer = 0;    // accumulates from content script reports before flush
let saveTimeout = null;

function getLocalDate() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function flushData() {
  if (bytesBuffer === 0) return;
  const bytesToSave = bytesBuffer;
  bytesBuffer = 0;
  const localDate = getLocalDate();

  chrome.storage.local.get(['dataUsage'], (res) => {
    const usage = res.dataUsage || {};
    usage[localDate] = (usage[localDate] || 0) + bytesToSave;
    // Keep at most 60 days
    const keys = Object.keys(usage).sort();
    if (keys.length > 60) delete usage[keys[0]];
    chrome.storage.local.set({ dataUsage: usage });
  });
}

// webRequest: used ONLY for download-speed measurement, NOT total bytes
// because transferSize from PerformanceObserver is the accurate source.
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.fromCache) return;
    const cl = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-length');
    if (!cl || !cl.value) return;
    const bytes = parseInt(cl.value, 10);
    if (!bytes || bytes <= 0) return;

    const now = Date.now();
    recentBytes.push({ time: now, bytes });
    // Keep only last 5 s window
    recentBytes = recentBytes.filter(r => r.time > now - 5000);
  },
  { urls: ['*://*.googlevideo.com/*'] },
  ['responseHeaders']
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setIconState') {
    setIconState(Boolean(request.enabled));
    sendResponse({ success: true });
    return;
  }

  if (request.action === 'setAudioOnlyState') {
    sendResponse({ success: true });
    return;
  }

  // PerformanceObserver in content.js reports real transferSize here
  if (request.action === 'reportBytes') {
    const bytes = request.bytes;
    if (bytes > 0) {
      bytesBuffer += bytes;

      // Also push into recentBytes so speed reflects PO data when webRequest
      // content-length is missing (e.g., service workers, HTTP/2 push)
      const now = Date.now();
      recentBytes.push({ time: now, bytes });
      recentBytes = recentBytes.filter(r => r.time > now - 5000);

      if (bytesBuffer > 256 * 1024) {
        if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
        flushData();
      } else if (!saveTimeout) {
        saveTimeout = setTimeout(() => { flushData(); saveTimeout = null; }, 2000);
      }
    }
    sendResponse({ success: true });
    return;
  }

  if (request.action === 'getNetworkStats') {
    const now = Date.now();
    const recent = recentBytes.filter(r => r.time >= now - 3000);
    const sumBytes = recent.reduce((s, r) => s + r.bytes, 0);
    // kbps: bits in 3 s window / 3 s
    const kbps = Math.round((sumBytes * 8) / 3000);

    chrome.storage.local.get(['dataUsage'], (res) => {
      sendResponse({
        usage: res.dataUsage || {},
        buffer: bytesBuffer,
        speedKbps: kbps
      });
    });
    return true; // async
  }
});
