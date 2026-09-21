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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ autoContinueEnabled: true }, ({ autoContinueEnabled }) => {
    setIconState(autoContinueEnabled);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get({ autoContinueEnabled: true }, ({ autoContinueEnabled }) => {
    setIconState(autoContinueEnabled);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setIconState') {
    setIconState(Boolean(request.enabled));
    sendResponse({ success: true });
  }
});
