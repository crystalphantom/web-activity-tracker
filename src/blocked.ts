const quotes = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "Time is more valuable than money. You can get more money, but you cannot get more time. - Jim Rohn",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities. - Stephen Covey",
    "Productivity is never an accident. It is always the result of a commitment to excellence. - Paul J. Meyer"
];

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const timeUntilResetElement = document.getElementById('timeUntilReset');
    if (timeUntilResetElement) {
        timeUntilResetElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
}

function formatDuration(seconds: number): string {
    if (typeof seconds !== 'number' || seconds < 0) {
        return '0m';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

async function loadBlockInfo() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_BLOCK_INFO'
        });

        if (response && !response.error) {
            const messageElement = document.getElementById('message');
            const timeSpentElement = document.getElementById('timeSpent');
            const limitElement = document.getElementById('limit');
            const websiteElement = document.getElementById('website');

            if (messageElement) {
                messageElement.textContent = response.message || 
                    "You've reached your daily time limit for this website. Take a break and come back tomorrow!";
            }
            if (timeSpentElement) {
                timeSpentElement.textContent = formatDuration(response.timeSpent || 0);
            }
            if (limitElement) {
                limitElement.textContent = formatDuration(response.limit || 0);
            }
            if (websiteElement) {
                websiteElement.textContent = response.domain || 'Unknown';
            }
        } else {
            // Fallback values if response is invalid
            const timeSpentElement = document.getElementById('timeSpent');
            const limitElement = document.getElementById('limit');
            const websiteElement = document.getElementById('website');

            if (timeSpentElement) timeSpentElement.textContent = 'Unknown';
            if (limitElement) limitElement.textContent = 'Unknown';
            if (websiteElement) websiteElement.textContent = 'Unknown';
            console.error('Invalid response:', response);
        }
    } catch (error) {
        console.error('Error loading block info:', error);
        // Set fallback values on error
        const timeSpentElement = document.getElementById('timeSpent');
        const limitElement = document.getElementById('limit');
        const websiteElement = document.getElementById('website');

        if (timeSpentElement) timeSpentElement.textContent = 'Error';
        if (limitElement) limitElement.textContent = 'Error';
        if (websiteElement) websiteElement.textContent = 'Error';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    const quoteElement = document.getElementById('quote');
    if (quoteElement) {
        quoteElement.textContent = getRandomQuote();
    }

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    loadBlockInfo();
    updateCountdown();
    setInterval(updateCountdown, 1000);
});