// WokGen Content Script — minimal footprint
// Listens for messages from the extension popup/background

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'EXTRACT_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      images: Array.from(document.images)
        .map(img => img.src)
        .filter(src => src && !src.startsWith('data:'))
        .slice(0, 20),
    });
  }
  return true;
});
