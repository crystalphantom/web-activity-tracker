(() => {
  let isBlocked = false;
  let blockOverlay: HTMLDivElement | null = null;

  const createBlockOverlay = (message: string, timeSpent: string, limit: string) => {
    if (blockOverlay) return;

    blockOverlay = document.createElement('div');
    blockOverlay.id = 'web-activity-tracker-block';
    blockOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: #fee2e2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          ">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 600;">
            Time Limit Reached
          </h2>
          
          <p style="color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.6;">
            ${message}
          </p>
          
          <div style="
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: #6b7280;">Time spent today:</span>
              <span style="font-weight: 600; color: #1f2937;">${timeSpent}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Daily limit:</span>
              <span style="font-weight: 600; color: #1f2937;">${limit}</span>
            </div>
          </div>
          
          <div style="color: #059669; font-size: 0.875rem; margin-bottom: 1.5rem;">
            🕐 Resets at midnight
          </div>
          
          <button id="continue-btn" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            margin-right: 0.5rem;
          ">
            Continue Anyway
          </button>
          
          <button id="settings-btn" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
          ">
            Adjust Limit
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(blockOverlay);

    const continueBtn = blockOverlay.querySelector('#continue-btn');
    const settingsBtn = blockOverlay.querySelector('#settings-btn');

    continueBtn?.addEventListener('click', () => {
      removeBlockOverlay();
    });

    settingsBtn?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  };

  const removeBlockOverlay = () => {
    if (blockOverlay) {
      blockOverlay.remove();
      blockOverlay = null;
      isBlocked = false;
    }
  };

  const checkBlockStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_BLOCK_STATUS',
        url: window.location.href
      });

      if (response?.blocked && !isBlocked) {
        isBlocked = true;
        createBlockOverlay(
          response.message || "You've reached your time limit for this site.",
          response.timeSpent || '0m',
          response.limit || '0m'
        );
      } else if (!response?.blocked && isBlocked) {
        removeBlockOverlay();
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const sendActivitySignal = () => {
    chrome.runtime.sendMessage({
      type: 'PAGE_ACTIVITY',
      url: window.location.href,
      title: document.title,
      visible: !document.hidden
    });
  };

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

  setInterval(() => {
    if (!document.hidden) {
      sendActivitySignal();
    }
  }, 30000);

  setTimeout(checkBlockStatus, 1000);
  sendActivitySignal();
})();