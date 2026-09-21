# Auto Next Songs for YouTube

Automatically continue to the next video or song on YouTube and YouTube Music, with lightweight playback controls in the extension popup.

## Features

- Automatic next playback when a video or song ends.
- Previous, play/pause, and next controls for the active YouTube tab.
- Enabled and disabled toolbar icon states.
- Dark popup UI with a compact layout inspired by the supplied reference image.
- No third-party CDN or remote code dependency.
- Refresh fallback after an automatic transition when no playing media player is detected for five seconds.
- Current video title, channel, and thumbnail synchronized to the popup after navigation or popup controls.

## Compatibility

The extension uses **Manifest V3**, the supported Chrome extension manifest format. Chrome does not currently support a `manifest_version: 4` value; setting that value would prevent the extension from loading. The extension release is version **4.1.0** for the playback recovery and popup synchronization update.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the repository directory.

## Usage

Open YouTube or YouTube Music, then select the extension icon. Use the switch to enable or disable auto-next. The playback buttons control the active YouTube tab. The icon becomes gray when auto-next is disabled.

## Troubleshooting

The extension only injects into YouTube and YouTube Music pages. If a control does not respond, open a supported tab and refresh it once so the content script can initialize. Browser autoplay restrictions may still require one manual play action.
