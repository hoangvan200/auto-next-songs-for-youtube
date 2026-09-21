(() => {
  let autoContinueEnabled = true;
  let audioOnlyEnabled = false;
  let lastAdvanceAt = 0;
  let lastMedia = null;
  let lastVideoKey = '';
  let recoveryTimer = null;
  let metadataTimer = null;

  chrome.storage.sync.get({ autoContinueEnabled: true, audioOnlyEnabled: false }, (state) => {
    autoContinueEnabled = state.autoContinueEnabled;
    audioOnlyEnabled = state.audioOnlyEnabled;
    updateAudioOnlyUI(audioOnlyEnabled);
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAudioOnly') {
      audioOnlyEnabled = Boolean(request.enabled);
      updateAudioOnlyUI(audioOnlyEnabled);
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'toggleAutoContinue') {
      autoContinueEnabled = Boolean(request.enabled);
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'getVideoInfo') {
      sendResponse({ success: true, info: getVideoInfo() });
      return;
    }

    if (request.action === 'control') {
      const handlers = {
        next: () => clickNextButton({ force: true, source: 'popup' }),
        prev: clickPreviousButton,
        togglePlayPause
      };
      const handler = handlers[request.command];
      sendResponse({ success: Boolean(handler && handler()) });
    }
  });

  function clickNextButton({ force = false, source = 'auto' } = {}) {
    if (!force && !autoContinueEnabled) return false;
    const now = Date.now();
    if (!force && now - lastAdvanceAt < 2500) return false;

    const selectors = [
      'ytmusic-player-bar .next-button',
      'ytmusic-player-bar [aria-label*="Next"]',
      '.ytp-next-button',
      'button[aria-label^="Next"]',
      '[aria-label="Next track"]',
      '[title="Next"]',
      '[title="Next track"]',
      '.next-button'
    ];

    const previousKey = getVideoKey();
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (isUsable(button)) {
        button.click();
        markAdvanced(now, previousKey, source);
        return true;
      }
    }

    // YouTube's playlist sidebar sometimes marks the upcoming item instead of
    // exposing a stable next-button selector.
    const markedVideo = document.querySelector('ytd-compact-video-renderer[style*="border"] a#thumbnail');
    if (isUsable(markedVideo)) {
      markedVideo.click();
      markAdvanced(now, previousKey, source);
      return true;
    }
    return false;
  }

  function markAdvanced(now, previousKey, source) {
    lastAdvanceAt = now;
    notifyVideoInfoWhenReady(previousKey, source);
    if (source === 'auto') schedulePlaybackRecovery();
  }

  function schedulePlaybackRecovery() {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(() => {
      recoveryTimer = null;
      const media = document.querySelector('video, audio');
      if (!media || media.ended || media.paused || !isMediaReady(media)) {
        window.location.reload();
      }
    }, 10000);
  }

  function notifyVideoInfoWhenReady(previousKey, reason) {
    if (metadataTimer) clearInterval(metadataTimer);
    let attempts = 0;
    metadataTimer = setInterval(() => {
      attempts += 1;
      const info = getVideoInfo();
      const changed = info.key && info.key !== previousKey;
      if (changed || attempts >= 28) {
        clearInterval(metadataTimer);
        metadataTimer = null;
        sendVideoInfo(info, reason);
      }
    }, 250);
  }

  function sendVideoInfo(info = getVideoInfo(), reason = 'navigation') {
    if (!info) return;
    updateAudioOnlyUI(audioOnlyEnabled);
    try {
      chrome.runtime.sendMessage({ action: 'videoInfoUpdated', info, reason }, () => {
        const _ = chrome.runtime.lastError;
      });
    } catch (err) {
      if (err.message.includes('Extension context invalidated')) {
        if (metadataTimer) clearInterval(metadataTimer);
      }
    }
  }

  function initAudioOnlyStyles() {
    if (document.getElementById('auto-next-audio-only-style')) return;
    const style = document.createElement('style');
    style.id = 'auto-next-audio-only-style';
    style.textContent = `
      body.auto-next-audio-only video {
        opacity: 0 !important;
      }
      body.auto-next-audio-only .html5-video-player {
        background-color: #000 !important;
        background-image: var(--auto-next-thumb, none) !important;
        background-size: contain !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      }
    `;
    document.head.appendChild(style);
  }
  initAudioOnlyStyles();

  function updateAudioOnlyUI(enabled) {
    if (enabled) {
      document.body.classList.add('auto-next-audio-only');
      const info = getVideoInfo();
      if (info.thumbnail) {
        if (info.thumbnail.includes('googleusercontent.com')) {
          document.body.style.setProperty('--auto-next-thumb', `url('${info.thumbnail}')`);
        } else if (info.videoId) {
          const maxResUrl = `https://i.ytimg.com/vi/${info.videoId}/maxresdefault.jpg`;
          const hqUrl = `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`;
          document.body.style.setProperty('--auto-next-thumb', `url('${maxResUrl}'), url('${hqUrl}')`);
        }
      }
    } else {
      document.body.classList.remove('auto-next-audio-only');
    }
    
    // Cleanup old DOM overlay if it exists from previous version
    const oldOverlay = document.getElementById('auto-next-audio-only-overlay');
    if (oldOverlay) oldOverlay.remove();
  }

  function getVideoInfo() {
    const media = document.querySelector('video, audio');
    const videoId = new URLSearchParams(window.location.search).get('v') || getMusicVideoId();
    const title = firstText([
      'h1.ytd-watch-metadata',
      'h1.title',
      'ytmusic-player-bar .title',
      'ytmusic-player-bar .title a'
    ]) || document.title.replace(/\s*-\s*YouTube(?: Music)?\s*$/i, '').trim();
    const channel = firstText([
      '#owner #channel-name a',
      'ytd-video-owner-renderer a',
      'ytmusic-player-bar .byline'
    ]);
    let thumbnail = '';
    const ytMusicImg = document.querySelector('#song-image img') || document.querySelector('ytmusic-player-bar img');
    if (ytMusicImg && ytMusicImg.src && ytMusicImg.src.startsWith('http')) {
      thumbnail = ytMusicImg.src;
      if (thumbnail.includes('googleusercontent.com')) {
        thumbnail = thumbnail.split('=')[0] + '=w1200-h1200';
      }
    }
    if (!thumbnail && videoId) {
      thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    }

    return {
      key: videoId || window.location.href,
      url: window.location.href,
      videoId: videoId || '',
      title: title || 'YouTube',
      channel: channel || 'YouTube',
      thumbnail,
      isPlaying: Boolean(media && !media.paused && !media.ended),
      hasPlayer: Boolean(media),
      duration: media?.duration && Number.isFinite(media.duration) ? media.duration : 0,
      currentTime: media?.currentTime && Number.isFinite(media.currentTime) ? media.currentTime : 0
    };
  }

  function getMusicVideoId() {
    const match = document.querySelector('ytmusic-player-bar a[href*="watch?v="]')?.href?.match(/[?&]v=([^&]+)/);
    return match ? match[1] : '';
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const value = element?.textContent?.trim();
      if (value) return value;
    }
    return '';
  }

  function getVideoKey() {
    return getVideoInfo().key;
  }

  function clickPreviousButton() {
    const selectors = [
      'ytmusic-player-bar .previous-button',
      'ytmusic-player-bar [aria-label*="Previous"]',
      '.ytp-prev-button',
      'button[aria-label^="Previous"]',
      '[aria-label="Previous track"]',
      '[title="Previous"]',
      '[title="Previous track"]'
    ];
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (isUsable(button)) {
        button.click();
        notifyVideoInfoWhenReady(getVideoKey(), 'popup-previous');
        return true;
      }
    }
    return false;
  }

  function togglePlayPause() {
    const media = document.querySelector('video, audio');
    if (media) {
      if (media.paused) {
        const playResult = media.play();
        if (playResult?.catch) playResult.catch(() => {});
      } else {
        media.pause();
      }
      sendVideoInfo(getVideoInfo(), 'popup-play-pause');
      return true;
    }

    const button = document.querySelector(
      'ytmusic-player-bar .play-pause-button, .ytp-play-button, button[aria-label^="Play"], button[aria-label^="Pause"]'
    );
    if (isUsable(button)) {
      button.click();
      sendVideoInfo(getVideoInfo(), 'popup-play-pause');
      return true;
    }
    return false;
  }

  function isUsable(element) {
    return Boolean(element && !element.disabled && element.getAttribute('aria-disabled') !== 'true');
  }

  function isMediaReady(media) {
    return media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && media.currentSrc;
  }

  let lastInfoKey = '';
  let lastThumbnailUrl = '';

  function checkPlaybackEnd() {
    const media = document.querySelector('video, audio');
    if (media && media !== lastMedia) {
      lastMedia = media;
      media.addEventListener('ended', () => clickNextButton(), { passive: true });
      sendVideoInfo(getVideoInfo(), 'media-ready');
    }

    const info = getVideoInfo();
    if (info.key !== lastInfoKey || info.thumbnail !== lastThumbnailUrl) {
      lastInfoKey = info.key;
      lastThumbnailUrl = info.thumbnail;
      sendVideoInfo(info, 'metadata-changed');
    }

    if (media?.ended) clickNextButton();
  }

  document.addEventListener('ended', (event) => {
    if (event.target instanceof HTMLMediaElement) clickNextButton();
  }, true);
  document.addEventListener('yt-navigate-finish', () => {
    checkPlaybackEnd();
    sendVideoInfo(getVideoInfo(), 'navigation');
  }, { passive: true });
  setInterval(checkPlaybackEnd, 1500);
  checkPlaybackEnd();
  sendVideoInfo(getVideoInfo(), 'initial');
})();
