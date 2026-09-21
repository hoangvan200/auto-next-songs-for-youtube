document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('autoContinueToggle');
  const statusText = document.getElementById('statusText');
  const thumbnail = document.getElementById('thumbnail');
  const videoThumbnail = document.getElementById('videoThumbnail');
  const videoTitle = document.getElementById('videoTitle');
  const videoMeta = document.getElementById('videoMeta');

  chrome.storage.sync.get({ autoContinueEnabled: true }, ({ autoContinueEnabled }) => {
    toggle.checked = autoContinueEnabled;
    renderState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'videoInfoUpdated') {
      renderVideoInfo(request.info);
    }
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ autoContinueEnabled: enabled }, renderState);
    chrome.runtime.sendMessage({ action: 'setIconState', enabled });
    broadcast({ action: 'toggleAutoContinue', enabled });
  });

  document.getElementById('prevBtn').addEventListener('click', () => sendControlCommand('prev'));
  document.getElementById('nextBtn').addEventListener('click', () => sendControlCommand('next'));
  document.getElementById('playPauseBtn').addEventListener('click', () => sendControlCommand('togglePlayPause'));

  requestVideoInfo();

  function renderState() {
    statusText.textContent = toggle.checked ? 'Enabled' : 'Disabled';
    statusText.style.color = toggle.checked ? '#73a7ff' : '#979ba7';
  }

  function renderVideoInfo(info) {
    if (!info) return;
    videoTitle.textContent = info.title || 'Auto next';
    videoTitle.title = info.title || '';
    videoMeta.textContent = info.channel || 'YouTube / YouTube Music';

    if (info.thumbnail) {
      videoThumbnail.onload = () => {
        thumbnail.classList.add('has-image');
        videoThumbnail.style.display = 'block';
      };
      videoThumbnail.onerror = () => {
        thumbnail.classList.remove('has-image');
        videoThumbnail.style.display = 'none';
      };
      videoThumbnail.src = info.thumbnail;
    } else {
      thumbnail.classList.remove('has-image');
      videoThumbnail.style.display = 'none';
    }
  }

  function requestVideoInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id == null) return;
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, (response) => {
        if (chrome.runtime.lastError || !response?.success) return;
        renderVideoInfo(response.info);
      });
    });
  }

  function broadcast(message) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id == null) continue;
        chrome.tabs.sendMessage(tab.id, message, () => void chrome.runtime.lastError);
      }
    });
  }

  function sendControlCommand(command) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id == null) return;
      chrome.tabs.sendMessage(tab.id, { action: 'control', command }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          statusText.textContent = 'Open a YouTube tab to control playback';
          statusText.style.color = '#f0a6a6';
          return;
        }
        // YouTube navigation is asynchronous; the content script also pushes
        // updates, while this delayed query covers fast SPA transitions.
        setTimeout(requestVideoInfo, 450);
      });
    });
  }
});
