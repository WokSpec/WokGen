const WOKGEN_BASE = 'https://wokgen.wokspec.org';

document.addEventListener('DOMContentLoaded', () => {
  // Analyze button
  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.url) {
          chrome.tabs.create({
            url: `${WOKGEN_BASE}/tools/og-analyzer?url=${encodeURIComponent(tab.url)}`
          });
        }
      });
    });
  }
});
