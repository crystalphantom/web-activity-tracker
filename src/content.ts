(() => {
  // Content script - handles activity tracking and YouTube Shorts blocking
  // Blocking is handled by background script redirect to blocked.html

  const sendActivitySignal = () => {
    chrome.runtime.sendMessage({
      type: 'PAGE_ACTIVITY',
      url: window.location.href,
      title: document.title,
      visible: !document.hidden
    });
  };

  const checkBlockStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_BLOCK_STATUS',
        url: window.location.href
      });

      // Content script overlay disabled - using redirect approach instead
      // If site is blocked, background will handle redirect
      if (response?.blocked) {
        console.log('Site is blocked, redirect should be handled by background script');
      }
    } catch (error) {
      console.error('Error checking block status:', error);
      setTimeout(checkBlockStatus, 2000);
    }
  };

  // YouTube Shorts Blocking Functionality
  class YouTubeShortsBlocker {
    private isEnabled: boolean = false;
    private observer: MutationObserver | null = null;
    private styleElement: HTMLStyleElement | null = null;

    constructor() {
      this.init();
    }

    private async init() {
      // Check if we're on YouTube and Shorts blocking is enabled
      if (this.isYouTube()) {
        await this.loadSettings();
        if (this.isEnabled) {
          this.startBlocking();
        }
      }
    }

    private isYouTube(): boolean {
      return window.location.hostname.includes('youtube.com');
    }

    private async loadSettings() {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_SETTINGS'
        });
        this.isEnabled = response?.settings?.blockShorts || false;
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    private startBlocking() {
      console.log('Starting YouTube Shorts blocking');
      this.injectCSS();
      this.removeExistingShorts();
      this.observeChanges();
    }

    private stopBlocking() {
      console.log('Stopping YouTube Shorts blocking');
      this.removeCSS();
      this.stopObserving();
    }

    private injectCSS() {
      if (this.styleElement) return;

      this.styleElement = document.createElement('style');
      this.styleElement.textContent = `
        /* Hide Shorts navigation in sidebar */
        a[href*="/shorts"], 
        a[title="Shorts"],
        ytd-guide-entry-renderer:has(a[href*="/shorts"]) {
          display: none !important;
        }

        /* Hide Shorts sections in feed */
        ytd-rich-shelf-renderer:has(span[id="title"][aria-label*="Shorts"]),
        ytd-rich-shelf-renderer:has(h2:contains("Shorts")),
        ytd-item-section-renderer:has(ytd-rich-shelf-renderer:has(a[href*="/shorts"])) {
          display: none !important;
        }

        /* Hide individual Shorts videos */
        a[href*="/shorts/"],
        ytd-video-renderer:has(a[href*="/shorts/"]),
        ytd-compact-video-renderer:has(a[href*="/shorts/"]) {
          display: none !important;
        }

        /* Hide Shorts shelf containers */
        [aria-label*="Shorts"],
        ytd-reel-shelf-renderer,
        ytd-shorts-lockup-view-model-wiz {
          display: none !important;
        }

        /* Hide Shorts in recommendations */
        ytd-compact-video-renderer:has(span:contains("#shorts")),
        ytd-video-renderer:has(span:contains("#shorts")) {
          display: none !important;
        }
      `;
      document.head.appendChild(this.styleElement);
    }

    private removeCSS() {
      if (this.styleElement) {
        this.styleElement.remove();
        this.styleElement = null;
      }
    }

    private removeExistingShorts() {
      // Remove Shorts navigation items
      const shortsLinks = document.querySelectorAll('a[href*="/shorts"], a[title="Shorts"]');
      shortsLinks.forEach(link => {
        const parent = link.closest('ytd-guide-entry-renderer') || link.parentElement;
        if (parent) {
          parent.remove();
        }
      });

      // Remove Shorts sections in feed
      const shortsSections = document.querySelectorAll('ytd-rich-shelf-renderer');
      shortsSections.forEach(section => {
        const title = section.querySelector('span[id="title"], h2');
        if (title && (title.textContent?.includes('Shorts') || title.getAttribute('aria-label')?.includes('Shorts'))) {
          section.remove();
        }
      });

      // Remove individual Shorts videos
      const shortsVideos = document.querySelectorAll('a[href*="/shorts/"]');
      shortsVideos.forEach(link => {
        const videoRenderer = link.closest('ytd-video-renderer, ytd-compact-video-renderer');
        if (videoRenderer) {
          videoRenderer.remove();
        }
      });

      // Remove Shorts shelf containers
      const shortsShelves = document.querySelectorAll('[aria-label*="Shorts"], ytd-reel-shelf-renderer, ytd-shorts-lockup-view-model-wiz');
      shortsShelves.forEach(shelf => shelf.remove());
    }

    private observeChanges() {
      if (this.observer) return;

      this.observer = new MutationObserver((mutations) => {
        let hasRelevantChanges = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if new Shorts-related elements were added
            const addedNodes = Array.from(mutation.addedNodes);
            hasRelevantChanges = addedNodes.some(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                return (
                  element.querySelector?.('a[href*="/shorts"]') ||
                  element.querySelector?.('[aria-label*="Shorts"]') ||
                  element.getAttribute?.('aria-label')?.includes('Shorts') ||
                  element.textContent?.includes('Shorts')
                );
              }
              return false;
            });
          }
        });

        if (hasRelevantChanges) {
          setTimeout(() => this.removeExistingShorts(), 100);
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    private stopObserving() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    public async toggle(enabled: boolean) {
      this.isEnabled = enabled;
      if (enabled) {
        this.startBlocking();
      } else {
        this.stopBlocking();
      }
    }
  }

  // Initialize YouTube Shorts Blocker
  let shortsBlocker: YouTubeShortsBlocker | null = null;

  // Initialize blocker when page loads
  if (window.location.hostname.includes('youtube.com')) {
    shortsBlocker = new YouTubeShortsBlocker();
  }

  // Listen for settings changes
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SHORTS_BLOCKING_TOGGLE' && shortsBlocker) {
      shortsBlocker.toggle(message.enabled);
      sendResponse({ success: true });
    }
    return true;
  });

  // Event listeners for activity tracking
  document.addEventListener('visibilitychange', () => {
    sendActivitySignal();
  });

  window.addEventListener('focus', () => {
    sendActivitySignal();
    checkBlockStatus();
  });

  window.addEventListener('blur', () => {
    sendActivitySignal();
  });

  // Initial check when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkBlockStatus, 1000);
    });
  } else {
    setTimeout(checkBlockStatus, 1000);
  }

  // Send initial activity signal
  sendActivitySignal();
})();