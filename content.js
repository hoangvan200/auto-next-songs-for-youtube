let isAutoContinueEnabled = true;

// Load initial state from storage
chrome.storage.sync.get(['autoContinueEnabled'], function(result) {
    isAutoContinueEnabled = result.autoContinueEnabled !== false;
});

// Listen for toggle changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAutoContinue') {
        isAutoContinueEnabled = request.enabled;
        console.log('Auto-continue:', isAutoContinueEnabled ? 'enabled' : 'disabled');
        sendResponse?.({ success: true });
        return;
    }

    if (request.action === 'control') {
        let handled = false;
        switch (request.command) {
            case 'next':
                handled = clickNextButton(true);
                break;
            case 'prev':
                handled = clickPrevButton();
                break;
            case 'togglePlayPause':
                handled = togglePlayPause();
                break;
            default:
                break;
        }
        sendResponse?.({ success: handled });
    }
});

// Function to find and click the next button
function clickNextButton(force = false) {
    if (!isAutoContinueEnabled && !force) return false;

    // First try to find and click the blue-framed video
    const blueFramedVideo = document.querySelector('ytd-compact-video-renderer[style*="border: 2px solid blue"]');
    if (blueFramedVideo) {
        const videoLink = blueFramedVideo.querySelector('a#thumbnail');
        if (videoLink) {
            videoLink.click();
            console.log('Auto-continue: Blue-framed video clicked');
            return true;
        }
    }

    // If no blue-framed video found, try YouTube specific selectors
    const youtubeSelectors = [
        // YouTube Music
        'ytmusic-player-bar .next-button',
        'ytmusic-player-bar [aria-label="Next song"]',
        // YouTube
        '.ytp-next-button',
        'button[aria-label="Next"]',
        // Common selectors
        '[aria-label="Next"]',
        '[aria-label="Next track"]',
        '.next-button',
        '.skip-forward',
        '.next',
        'button[title="Next"]',
        'button[title="Next track"]'
    ];

    for (const selector of youtubeSelectors) {
        const nextButton = document.querySelector(selector);
        if (nextButton) {
            nextButton.click();
            console.log('Auto-continue: Next button clicked');
            return true;
        }
    }
    return false;
}

// Function to find and click the previous button
function clickPrevButton() {
    // Allow manual prev even if auto-continue is off
    const prevSelectors = [
        // YouTube Music
        'ytmusic-player-bar .previous-button',
        'ytmusic-player-bar [aria-label="Previous song"]',
        // YouTube
        '.ytp-prev-button',
        'button[aria-label="Previous"]',
        // Common selectors
        '[aria-label="Previous"]',
        '.prev-button',
        '.skip-back',
        '.previous'
    ];

    for (const selector of prevSelectors) {
        const prevButton = document.querySelector(selector);
        if (prevButton) {
            prevButton.click();
            console.log('Auto-continue: Previous button clicked');
            return true;
        }
    }
    return false;
}

// Function to toggle play/pause
function togglePlayPause() {
    const media = document.querySelector('video, audio');
    if (media) {
        if (media.paused) {
            media.play();
            console.log('Auto-continue: Media play triggered');
        } else {
            media.pause();
            console.log('Auto-continue: Media pause triggered');
        }
        return true;
    }

    const playPauseSelectors = [
        // YouTube Music
        'ytmusic-player-bar .play-pause-button',
        // YouTube
        '.ytp-play-button',
        'button[aria-label="Play"]',
        'button[aria-label="Pause"]',
        // Common selectors
        '.play-button',
        '.pause-button',
        '[aria-label="Play"]',
        '[aria-label="Pause"]'
    ];

    for (const selector of playPauseSelectors) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.click();
            console.log('Auto-continue: Play/Pause toggled via button');
            return true;
        }
    }

    return false;
}

// Function to check if the current song has ended
function checkSongEnd() {
    if (!isAutoContinueEnabled) return;

    // Check YouTube video player
    const videoPlayer = document.querySelector('video');
    if (videoPlayer && videoPlayer.ended) {
        console.log('Auto-continue: YouTube video ended');
        clickNextButton();
        return;
    }

    // Check for YouTube Music player state
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
        const progressBar = playerBar.querySelector('#progress-bar');
        if (progressBar && progressBar.getAttribute('value') === '100') {
            console.log('Auto-continue: YouTube Music song ended');
            clickNextButton();
            return;
        }
    }
}

// Set up interval to check for song end
setInterval(checkSongEnd, 1000);

// Listen for YouTube specific events
document.addEventListener('yt-navigate-finish', () => {
    console.log('Auto-continue: YouTube page navigation finished');
    // Re-initialize checks after navigation
    checkSongEnd();
});

// Listen for media events
document.addEventListener('ended', () => {
    console.log('Auto-continue: Media ended event detected');
    clickNextButton();
    
    // Refresh the page after a short delay
    setTimeout(() => {
        window.location.reload();
    }, 2000); // Wait 2 seconds before refreshing
});

// Listen for custom events from music players
document.addEventListener('songEnded', () => {
    console.log('Auto-continue: Song ended event detected');
    clickNextButton();
}); 