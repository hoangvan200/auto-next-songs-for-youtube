# Auto Next Songs for YouTube

Automatically continue to the next video or song on YouTube and YouTube Music, with a fully featured playback control popup.

[![Latest Release](https://img.shields.io/github/v/release/hoangvan200/auto-next-songs-for-youtube?style=flat-square)](https://github.com/hoangvan200/auto-next-songs-for-youtube/releases/latest)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square)]()

---

## Features

### 🎵 Playback
- **Auto next** — automatically advances to the next video or song when the current one ends.
- **Previous / Play-Pause / Next** popup controls for the active YouTube tab.
- **10-second recovery fallback** — if no playing player is detected after an automatic transition, the extension reloads playback gracefully.

### 🖼️ Popup & UI
- **Live video info** — current title, channel name, and thumbnail are synced to the popup after every navigation.
- **Thumbnail download** — hover over the popup thumbnail and click the download button to save the highest-quality PNG available.
- **Dark / Light theme** toggle.
- No third-party CDN or remote code — fully self-contained.

### 🔇 No Video (Audio Overlay)
- Hides the video stream behind a high-resolution thumbnail overlay, reducing GPU rendering load and screen glare while listening to music.
- Works on both **youtube.com** and **music.youtube.com**.
- Thumbnail overlay stays in sync even when switching songs rapidly on YouTube Music's SPA interface.

### 📊 Data Transfer Monitor
- Displays **real-time download speed** (Kbps) and **cumulative data usage** (MB / GB) consumed by YouTube in the popup.
- Cycle between **Today / This week / This month** with a single button tap — data is anchored so layout never shifts.
- Uses **`PerformanceObserver.transferSize`** — the browser's own wire-byte measurement, the same source as the DevTools Network tab — for accurate figures.
- Data persists across tab switches, browser restarts, and extension reloads via `chrome.storage.local`. Rendering is paused when the popup is closed to conserve resources.

---

## Compatibility

| Browser | Support |
|---------|---------|
| Chrome / Chromium | ✅ Full support (Manifest V3) |
| Edge (Chromium) | ✅ Full support |
| Firefox | ❌ Not supported (uses WebExtension API differences) |

Tested against **youtube.com**, **music.youtube.com**, and **m.youtube.com**.

---

## Installation

### From GitHub Releases (recommended)
1. Go to the [Releases page](https://github.com/hoangvan200/auto-next-songs-for-youtube/releases/latest).
2. Download `auto-next-songs-for-youtube-vX.X.X.zip`.
3. Extract the ZIP file to a folder.
4. Open Chrome and go to `chrome://extensions/`.
5. Enable **Developer mode** (top-right toggle).
6. Click **Load unpacked** and select the extracted folder.

### From Source
```bash
git clone https://github.com/hoangvan200/auto-next-songs-for-youtube.git
```
Then follow steps 4–6 above, selecting the cloned folder.

---

## Usage

1. Open a YouTube or YouTube Music tab.
2. Click the extension icon in the toolbar to open the popup.
3. **Auto next** toggle — enable or disable automatic playback advancement.
4. **No video** toggle — hide the video and display the thumbnail overlay instead.
5. **Data transfer** — see live download speed and total data used; click the period button to cycle between Today / This week / This month.
6. **Theme** toggle — switch between dark and light mode.
7. Use the **‹‹ / ▶ / ››** buttons to control playback in the active YouTube tab.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Controls don't respond | Make sure a YouTube or YouTube Music tab is active and refresh it once so the content script initialises. |
| Autoplay doesn't start | Browser autoplay restrictions may require one manual play action per session. |
| No video overlay shows wrong thumbnail | Refresh the page — this can happen if the extension was just installed while a video was already playing. |
| Data transfer shows 0 MB | The `PerformanceObserver` API requires the page to have loaded at least one resource. Open a YouTube tab and play a video for a few seconds. |

---

## Changelog (recent)

| Version | Highlights |
|---------|-----------|
| **4.5.2** | Accurate data tracking via `PerformanceObserver.transferSize`; fixed UI layout for Data transfer row |
| **4.5.1** | Added real-time download speed (Kbps); fixed cached-request inflation |
| **4.5.0** | Introduced Data Transfer monitor (Today / Week / Month) |
| **4.4.1** | Stabilised No Video feature as a pure visual hider |
| **4.3.4** | Fixed stale thumbnail when switching songs rapidly on YouTube Music |
| **4.3.3** | Added thumbnail download button; fixed Audio-Only mode missing thumbnail for official audio tracks |

---

## License

MIT
