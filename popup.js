document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('autoContinueToggle');
  const statusText = document.getElementById('statusText');
  const thumbnail = document.getElementById('thumbnail');
  const videoThumbnail = document.getElementById('videoThumbnail');
  const videoTitle = document.getElementById('videoTitle');
  const videoMeta = document.getElementById('videoMeta');
  const themeToggle = document.getElementById('themeToggle');
  const downloadThumbnailBtn = document.getElementById('downloadThumbnailBtn');
  const audioOnlyToggle = document.getElementById('audioOnlyToggle');
  let currentVideoId = '';
  let currentThumbnailUrl = '';

  chrome.storage.sync.get({ autoContinueEnabled: true, theme: 'dark', audioOnlyEnabled: false }, ({ autoContinueEnabled, theme, audioOnlyEnabled }) => {
    if (toggle) toggle.checked = autoContinueEnabled;
    if (audioOnlyToggle) audioOnlyToggle.checked = audioOnlyEnabled;
    if (themeToggle) themeToggle.checked = theme === 'light';
    document.documentElement.classList.toggle('light', theme === 'light');
    renderState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'videoInfoUpdated') {
      renderVideoInfo(request.info);
    }
  });

  toggle?.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ autoContinueEnabled: enabled }, renderState);
    chrome.runtime.sendMessage({ action: 'setIconState', enabled });
    broadcast({ action: 'toggleAutoContinue', enabled });
  });

  audioOnlyToggle?.addEventListener('change', () => {
    const enabled = audioOnlyToggle.checked;
    chrome.storage.sync.set({ audioOnlyEnabled: enabled });
    chrome.runtime.sendMessage({ action: 'setAudioOnlyState', enabled });
    broadcast({ action: 'toggleAudioOnly', enabled });
  });

  themeToggle?.addEventListener('change', () => {
    const isLight = themeToggle.checked;
    const theme = isLight ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', isLight);
    chrome.storage.sync.set({ theme });
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => sendControlCommand('prev'));
  document.getElementById('nextBtn')?.addEventListener('click', () => sendControlCommand('next'));
  document.getElementById('playPauseBtn')?.addEventListener('click', () => sendControlCommand('togglePlayPause'));

  downloadThumbnailBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentThumbnailUrl && !currentVideoId) return;
    
    let url = currentThumbnailUrl;
    let isYtImg = url && url.includes('i.ytimg.com');
    if (isYtImg && currentVideoId) {
      url = `https://i.ytimg.com/vi/${currentVideoId}/maxresdefault.jpg`;
    }
    
    try {
      let res = await fetch(url);
      if (!res.ok && isYtImg && currentVideoId) {
        url = `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`;
        res = await fetch(url);
      }
      
      const blob = await res.blob();
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((pngBlob) => {
           const pngUrl = URL.createObjectURL(pngBlob);
           const a = document.createElement('a');
           a.href = pngUrl;
           a.download = `thumbnail_${currentVideoId}.png`;
           a.click();
           URL.revokeObjectURL(pngUrl);
           URL.revokeObjectURL(objectUrl);
        }, 'image/png');
      };
      img.src = objectUrl;
    } catch (err) {
      console.error('Failed to download thumbnail', err);
    }
  });


  const dataTransferValue = document.getElementById('dataTransferValue');
  const dataTransferSpeed = document.getElementById('dataTransferSpeed');
  const dataTransferPeriodBtn = document.getElementById('dataTransferPeriodBtn');
  
  let currentPeriod = 'today';
  
  function updateDataTransfer() {
    if (!dataTransferValue || !dataTransferPeriodBtn) return;
    
    dataTransferPeriodBtn.textContent = currentPeriod === 'today' ? 'Today' : (currentPeriod === 'week' ? 'This week' : 'This month');
    
    chrome.runtime.sendMessage({ action: 'getNetworkStats' }, (res) => {
      if (chrome.runtime.lastError || !res) return;
      
      if (dataTransferSpeed) {
        dataTransferSpeed.textContent = `${res.speedKbps} Kbps`;
      }
      
      const usage = res.usage || {};
      let totalBytes = res.buffer || 0; // add background un-flushed buffer
      
      const now = new Date();
      const daysToSum = currentPeriod === 'today' ? 1 : (currentPeriod === 'week' ? 7 : 30);
      
      for (let i = 0; i < daysToSum; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (usage[dString]) {
          totalBytes += usage[dString];
        }
      }
      
      if (totalBytes > 1024 * 1024 * 1024) {
        dataTransferValue.textContent = (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      } else {
        dataTransferValue.textContent = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
    });
  }

  dataTransferPeriodBtn?.addEventListener('click', () => {
    currentPeriod = currentPeriod === 'today' ? 'week' : (currentPeriod === 'week' ? 'month' : 'today');
    updateDataTransfer();
  });
  
  updateDataTransfer();
  let statsInterval = setInterval(updateDataTransfer, 1500);

  requestVideoInfo();

  function renderState() {
    if (!statusText || !toggle) return;
    statusText.textContent = toggle.checked ? 'Enabled' : 'Disabled';
    statusText.style.color = toggle.checked ? 'var(--accent)' : 'var(--muted)';
  }

  function renderVideoInfo(info) {
    if (!info) return;
    videoTitle.textContent = info.title || 'Auto next';
    videoTitle.title = info.title || '';
    videoMeta.textContent = info.channel || 'YouTube / YouTube Music';
    currentVideoId = info.videoId || '';
    currentThumbnailUrl = info.thumbnail || '';
    
    const playPauseIcon = document.getElementById('playPauseIcon');
    if (playPauseIcon) {
      playPauseIcon.textContent = info.isPlaying ? '⏸' : '▶';
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
