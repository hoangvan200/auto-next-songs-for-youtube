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
          regexFilter: "^https?://[^/]+\\.(googlevideo\\.com|c\\.youtube\\.com)/videoplayback.*[?&](mime=video|itag=(133|134|135|136|137|138|160|212|242|243|244|247|248|264|266|271|272|278|298|299|302|303|308|313|315|330|331|332|333|334|335|336|337|394|395|396|397|398|399))(&|$)",
          resourceTypes: ["xmlhttprequest", "media"]
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
