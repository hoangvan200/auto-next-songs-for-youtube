document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('autoContinueToggle');
    const statusText = document.getElementById('statusText');

    // Load the saved state
    chrome.storage.sync.get(['autoContinueEnabled'], function(result) {
        toggle.checked = result.autoContinueEnabled !== false; // Default to true
        updateStatusText();
    });

    // Save state when toggle changes
    toggle.addEventListener('change', function() {
        chrome.storage.sync.set({ autoContinueEnabled: toggle.checked });
        updateStatusText();
        
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

    function updateStatusText() {
        statusText.textContent = toggle.checked ? 'Auto Continue: ON' : 'Auto Continue: OFF';
        statusText.style.color = toggle.checked ? '#2196F3' : '#666';
    }
}); 