document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('autoContinueToggle');
    const statusText = document.getElementById('statusText');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = playPauseBtn.querySelector('i');

    // Load the saved state
    chrome.storage.sync.get(['autoContinueEnabled'], function(result) {
        toggle.checked = result.autoContinueEnabled !== false; // Default to true
        updateStatusText();
        updateActionIcon(toggle.checked);
    });

    // Save state when toggle changes
    toggle.addEventListener('change', function() {
        chrome.storage.sync.set({ autoContinueEnabled: toggle.checked });
        updateStatusText();
        updateActionIcon(toggle.checked);
        
        // Notify all tabs about the change
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleAutoContinue',
                    enabled: toggle.checked
                });
            });
        });
    });

    // Control buttons
    prevBtn.addEventListener('click', () => sendControlCommand('prev'));
    nextBtn.addEventListener('click', () => sendControlCommand('next'));
    playPauseBtn.addEventListener('click', () => {
        sendControlCommand('togglePlayPause');
        togglePlayIcon();
    });

    function togglePlayIcon() {
        if (playPauseIcon.classList.contains('bx-pause')) {
            playPauseIcon.classList.remove('bx-pause');
            playPauseIcon.classList.add('bx-play');
        } else {
            playPauseIcon.classList.remove('bx-play');
            playPauseIcon.classList.add('bx-pause');
        }
    }

    function sendControlCommand(command) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const tab = tabs[0];
            if (!tab) return;
            chrome.tabs.sendMessage(tab.id, {
                action: 'control',
                command
            });
        });
    }

    function updateStatusText() {
        statusText.textContent = toggle.checked ? 'Auto Continue: ON' : 'Auto Continue: OFF';
        statusText.style.color = toggle.checked ? '#2196F3' : '#666';
    }

    function updateActionIcon(enabled) {
        chrome.runtime.sendMessage({ action: 'setIconState', enabled });
    }
});