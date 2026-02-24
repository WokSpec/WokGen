// WokGen Extension — Background Service Worker

const WOKGEN_BASE = 'https://wokgen.wokspec.org';

// Setup context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'wokgen-bg-remove',
    title: 'Remove Background with WokGen',
    contexts: ['image'],
  });
  chrome.contextMenus.create({
    id: 'wokgen-analyze',
    title: 'Analyze with Eral 7c',
    contexts: ['image', 'selection'],
  });
  chrome.contextMenus.create({
    id: 'wokgen-send-to-tools',
    title: 'Open in WokGen Tools',
    contexts: ['image'],
  });
  chrome.contextMenus.create({
    id: 'wokgen-separator',
    type: 'separator',
    contexts: ['image', 'selection'],
  });
  chrome.contextMenus.create({
    id: 'wokgen-open',
    title: 'Open WokGen',
    contexts: ['page'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const handlers = {
    'wokgen-bg-remove': () => {
      const url = encodeURIComponent(info.srcUrl || '');
      chrome.tabs.create({ url: `${WOKGEN_BASE}/tools/background-remover?url=${url}` });
    },
    'wokgen-analyze': () => {
      const text = encodeURIComponent(info.selectionText || info.srcUrl || '');
      chrome.tabs.create({ url: `${WOKGEN_BASE}?eral=${text}` });
    },
    'wokgen-send-to-tools': () => {
      chrome.tabs.create({ url: `${WOKGEN_BASE}/tools?from=${encodeURIComponent(info.srcUrl || '')}` });
    },
    'wokgen-open': () => {
      chrome.tabs.create({ url: WOKGEN_BASE });
    },
  };
  const handler = handlers[info.menuItemId];
  if (handler) handler();
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_AUTH') {
    chrome.cookies.get({ url: WOKGEN_BASE, name: '__Secure-authjs.session-token' }, (cookie) => {
      sendResponse({ authenticated: !!cookie });
    });
    return true; // keep channel open for async
  }
});
