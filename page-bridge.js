(() => {
  function sync() {
    try {
      const player = document.getElementById('movie_player');
      if (player && typeof player.getVideoData === 'function') {
        const data = player.getVideoData();
        if (data && data.video_id) {
          document.documentElement.dataset.ytActiveVideoId = data.video_id;
          document.documentElement.dataset.ytActiveTitle = data.title || '';
          document.documentElement.dataset.ytActiveAuthor = data.author || '';
        }
      }
    } catch (e) {}
  }

  setInterval(sync, 400);
  document.addEventListener('yt-navigate-finish', sync, { passive: true });
  document.addEventListener('DOMContentLoaded', sync, { passive: true });
  window.addEventListener('load', sync, { passive: true });
  sync();
})();
