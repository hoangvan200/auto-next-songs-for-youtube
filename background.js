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

const AUDIO_ONLY_RULE_ID = 1;

function updateAudioOnlyRule(enabled) {
  if (enabled) {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: AUDIO_ONLY_RULE_ID,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: 'mime=video',
          domains: ['googlevideo.com']
        }
      }],
      removeRuleIds: [AUDIO_ONLY_RULE_ID]
    });
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [AUDIO_ONLY_RULE_ID]
    });
  }
}

function setIconState(enabled) {
  chrome.action.setIcon({ path: enabled ? ICONS.enabled : ICONS.disabled });
}

function initializeState() {
  chrome.storage.sync.get({ autoContinueEnabled: true, audioOnlyEnabled: false }, (state) => {
    setIconState(state.autoContinueEnabled);
    updateAudioOnlyRule(state.audioOnlyEnabled);
  });
}

chrome.runtime.onInstalled.addListener(initializeState);
chrome.runtime.onStartup.addListener(initializeState);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setIconState') {
    setIconState(Boolean(request.enabled));
    sendResponse({ success: true });
  } else if (request.action === 'setAudioOnlyState') {
    updateAudioOnlyRule(Boolean(request.enabled));
    sendResponse({ success: true });
  }
});
