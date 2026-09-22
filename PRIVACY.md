# Privacy Policy for Auto Next Songs for YouTube

Last updated: September 22, 2026

## Overview

**Auto Next Songs for YouTube** ("the Extension") is committed to protecting your privacy. This Privacy Policy explains how the Extension handles user information.

## Data Collection and Transmission

The Extension **does not collect, harvest, store on external servers, or transmit** any personal data, personally identifiable information (PII), web browsing history, or user activities.

- **No Remote Servers:** The Extension operates entirely locally within your browser. There are no external databases, analytics trackers, or third-party telemetries attached to this project.
- **No Third-Party Sharing:** Since no user data is collected, no data is sold, rented, leased, or disclosed to any third parties under any circumstances.

## Permissions and Local Storage Usage

The Extension requests specific browser permissions strictly to perform its core single-purpose functionalities:

1. **Storage (`chrome.storage`):**
   - Stores user preferences (such as enabling/disabling automatic playback advancement, audio-only thumbnail overlay, and theme preference) locally or via browser synchronization (`sync`).
   - Stores aggregated local bandwidth metrics (`local`) strictly on your device to display the popup Data Transfer counter. This data never leaves your computer.

2. **Web Request (`webRequest`):**
   - Used purely in an observational, read-only capacity to detect when YouTube streaming media chunks finish downloading, allowing the Extension to calculate real-time download playback speeds (Kbps) displayed in the popup.
   - It does not read, modify, intercept, or log request contents, headers, or any user credentials.

3. **Host Permissions:**
   - Access to `youtube.com`, `googlevideo.com`, `ytimg.com`, and `googleusercontent.com` is used solely to interact with the YouTube web player, observe media stream timing, and download high-resolution thumbnail artwork upon direct user request.

## Changes to this Policy

Any future updates to this Privacy Policy will be posted directly to this repository.

## Contact

If you have any questions or feedback regarding this Privacy Policy, please open an issue at:
https://github.com/hoangvan200/auto-next-songs-for-youtube/issues
