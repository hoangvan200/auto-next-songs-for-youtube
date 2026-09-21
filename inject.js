(() => {
  function isAudioOnlyEnabled() {
    return window.localStorage.getItem('autoNextAudioOnlyEnabled') === 'true';
  }

  function modifyStreamingData(data) {
    if (!data || !data.streamingData) return data;
    if (!isAudioOnlyEnabled()) return data;

    // Filter formats (combined audio+video streams) -> clear them to force adaptive fallback
    if (data.streamingData.formats) {
      data.streamingData.formats = data.streamingData.formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
    }
    
    // Filter adaptiveFormats -> keep only audio streams
    if (data.streamingData.adaptiveFormats) {
      data.streamingData.adaptiveFormats = data.streamingData.adaptiveFormats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
    }
    
    return data;
  }

  // Intercept window.fetch for SPA navigations
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : request?.url;
    
    if (url && url.includes('/youtubei/v1/player') && isAudioOnlyEnabled()) {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      try {
        const json = await clonedResponse.json();
        const modifiedJson = modifyStreamingData(json);
        return new Response(JSON.stringify(modifiedJson), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        return response; // fallback on error
      }
    }
    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest as fallback
  const xhrDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText');
  if (xhrDesc) {
    Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
      get() {
        const text = xhrDesc.get.call(this);
        if (this.responseURL && this.responseURL.includes('/youtubei/v1/player') && isAudioOnlyEnabled()) {
          try {
            const json = JSON.parse(text);
            return JSON.stringify(modifyStreamingData(json));
          } catch (e) {}
        }
        return text;
      }
    });
  }

  // Intercept ytInitialPlayerResponse for initial page load
  let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
  Object.defineProperty(window, 'ytInitialPlayerResponse', {
    get() {
      return _ytInitialPlayerResponse;
    },
    set(value) {
      _ytInitialPlayerResponse = modifyStreamingData(value);
    }
  });

  // Also try to intercept early assignment if it happened before this script ran
  if (window.ytInitialPlayerResponse) {
    window.ytInitialPlayerResponse = modifyStreamingData(window.ytInitialPlayerResponse);
  }
})();
