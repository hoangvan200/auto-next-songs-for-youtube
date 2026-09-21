document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('autoContinueToggle');
  const statusText = document.getElementById('statusText');
  const thumbnail = document.getElementById('thumbnail');
  const videoThumbnail = document.getElementById('videoThumbnail');
  const videoTitle = document.getElementById('videoTitle');
  const videoMeta = document.getElementById('videoMeta');
  const themeToggle = document.getElementById('themeToggle');
  const volumeSlider = document.getElementById('volumeSlider');

  chrome.storage.sync.get({ autoContinueEnabled: true, theme: 'dark' }, ({ autoContinueEnabled, theme }) => {
    toggle.checked = autoContinueEnabled;
    themeToggle.checked = theme === 'light';
    document.documentElement.classList.toggle('light', theme === 'light');
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

  themeToggle.addEventListener('change', () => {
    const isLight = themeToggle.checked;
    const theme = isLight ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', isLight);
    chrome.storage.sync.set({ theme });
  });

  document.getElementById('prevBtn').addEventListener('click', () => sendControlCommand('prev'));
  document.getElementById('nextBtn').addEventListener('click', () => sendControlCommand('next'));
  document.getElementById('playPauseBtn').addEventListener('click', () => sendControlCommand('togglePlayPause'));

  volumeSlider.addEventListener('input', () => {
    sendControlCommand('setVolume', { volume: volumeSlider.value / 100 });
  });

  requestVideoInfo();

  function renderState() {
    statusText.textContent = toggle.checked ? 'Enabled' : 'Disabled';
    statusText.style.color = toggle.checked ? 'var(--accent)' : 'var(--muted)';
  }

  function renderVideoInfo(info) {
    if (!info) return;
    videoTitle.textContent = info.title || 'Auto next';
    videoTitle.title = info.title || '';
    videoMeta.textContent = info.channel || 'YouTube / YouTube Music';
    
    const playPauseIcon = document.getElementById('playPauseIcon');
    if (playPauseIcon) {
      playPauseIcon.textContent = info.isPlaying ? '⏸' : '▶';
    }

    if (info.volume !== undefined) {
      volumeSlider.value = info.volume * 100;
    }

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

  function sendControlCommand(command, extra = {}) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id == null) return;
      chrome.tabs.sendMessage(tab.id, { action: 'control', command, ...extra }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          statusText.textContent = 'Open a YouTube tab to control playback';
          statusText.style.color = 'var(--accent)';
          return;
        }
        // YouTube navigation is asynchronous; the content script also pushes
        // updates, while this delayed query covers fast SPA transitions.
        setTimeout(requestVideoInfo, 450);
      });
    });
  }
});
