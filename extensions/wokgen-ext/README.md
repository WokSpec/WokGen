# WokGen Browser Extension

Bring WokGen AI tools to any page — right-click any image or selection to use WokGen tools.

## Features
- Right-click images: Remove Background, Analyze with Eral 7c
- Right-click selections: Analyze with Eral 7c
- Popup: Quick access to all WokGen tools
- Page analyzer: Scan current page with Eral 7c

## Installation (Development)

### Chrome / Edge
1. Open Chrome → chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extensions/wokgen-ext/` folder

### Firefox
1. Open Firefox → about:debugging
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `extensions/wokgen-ext/manifest.json`

## Building for Production
npm install && npm run build

## Publishing
- Chrome Web Store: https://chrome.google.com/webstore/devconsole
- Firefox Add-ons: https://addons.mozilla.org/developers
