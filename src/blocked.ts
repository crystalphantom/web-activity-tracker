const quotes = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "Time is more valuable than money. You can get more money, but you cannot get more time. - Jim Rohn",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities. - Stephen Covey",
    "Productivity is never an accident. It is always the result of a commitment to excellence. - Paul J. Meyer"
];

const limitedAccessReasons = [
    { id: '1', text: "I need to check something important for work", category: 'genuine' as const, emotionalWeight: 2 },
    { id: '2', text: "I'm looking for specific information I need right now", category: 'genuine' as const, emotionalWeight: 3 },
    { id: '3', text: "I need to respond to an urgent message", category: 'genuine' as const, emotionalWeight: 2 },
    { id: '4', text: "I'm just bored and want a quick distraction", category: 'betrayal' as const, emotionalWeight: 8 },
    { id: '5', text: "I can't focus on my work and need a break", category: 'betrayal' as const, emotionalWeight: 7 },
    { id: '6', text: "I'm procrastinating on something important", category: 'betrayal' as const, emotionalWeight: 9 },
    { id: '7', text: "I feel anxious and this helps me calm down", category: 'betrayal' as const, emotionalWeight: 6 },
    { id: '8', text: "I deserve a reward after working hard", category: 'neutral' as const, emotionalWeight: 4 },
    { id: '9', text: "I'm waiting for something and just passing time", category: 'neutral' as const, emotionalWeight: 5 },
    { id: '10', text: "I need to research something for a project", category: 'genuine' as const, emotionalWeight: 1 },
    { id: '11', text: "I'm feeling lonely and need connection", category: 'betrayal' as const, emotionalWeight: 7 },
    { id: '12', text: "I need to unwind after a stressful day", category: 'neutral' as const, emotionalWeight: 3 }
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

function populateReasons() {
    const reasonSelect = document.getElementById('reasonSelect') as HTMLSelectElement;
    if (!reasonSelect) return;

    // Clear existing options except the first one
    while (reasonSelect.children.length > 1) {
        reasonSelect.removeChild(reasonSelect.lastChild!);
    }

    // Group reasons by category
    const betrayalReasons = limitedAccessReasons.filter(r => r.category === 'betrayal');
    const genuineReasons = limitedAccessReasons.filter(r => r.category === 'genuine');
    const neutralReasons = limitedAccessReasons.filter(r => r.category === 'neutral');

    // Add betrayal reasons (most guilt-inducing first)
    if (betrayalReasons.length > 0) {
        const betrayalGroup = document.createElement('optgroup');
        betrayalGroup.label = '😔 Honest Admissions';
        betrayalReasons
            .sort((a, b) => b.emotionalWeight - a.emotionalWeight)
            .forEach(reason => {
                const option = document.createElement('option');
                option.value = reason.id;
                option.textContent = reason.text;
                betrayalGroup.appendChild(option);
            });
        reasonSelect.appendChild(betrayalGroup);
    }

    // Add genuine reasons
    if (genuineReasons.length > 0) {
        const genuineGroup = document.createElement('optgroup');
        genuineGroup.label = '✅ Legitimate Needs';
        genuineReasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason.id;
            option.textContent = reason.text;
            genuineGroup.appendChild(option);
        });
        reasonSelect.appendChild(genuineGroup);
    }

    // Add neutral reasons
    if (neutralReasons.length > 0) {
        const neutralGroup = document.createElement('optgroup');
        neutralGroup.label = '🤔 Neutral Reasons';
        neutralReasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason.id;
            option.textContent = reason.text;
            neutralGroup.appendChild(option);
        });
        reasonSelect.appendChild(neutralGroup);
    }
}

function showReasonSection() {
    const reasonSection = document.getElementById('reasonSection');
    const limitedAccessBtn = document.getElementById('limitedAccessBtn');
    const continueBtn = document.getElementById('continueBtn');
    
    if (reasonSection) reasonSection.style.display = 'block';
    if (limitedAccessBtn) limitedAccessBtn.style.display = 'inline-block';
    if (continueBtn) continueBtn.textContent = 'Go Back';
}

async function requestLimitedAccess() {
    const reasonSelect = document.getElementById('reasonSelect') as HTMLSelectElement;
    const selectedReasonId = reasonSelect.value;
    
    if (!selectedReasonId) {
        alert('Please select a reason for requesting access.');
        return;
    }

    const selectedReason = limitedAccessReasons.find(r => r.id === selectedReasonId);
    if (!selectedReason) return;

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'REQUEST_LIMITED_ACCESS',
            reason: selectedReason
        });

        if (response && response.success) {
            // Redirect to original URL
            const sessionData = await chrome.storage.session.get(['blockedUrl']);
            if (sessionData.blockedUrl) {
                window.location.href = sessionData.blockedUrl;
            }
        } else {
            alert('Failed to request limited access. Please try again.');
        }
    } catch (error) {
        console.error('Error requesting limited access:', error);
        alert('An error occurred. Please try again.');
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

    const limitedAccessBtn = document.getElementById('limitedAccessBtn');
    if (limitedAccessBtn) {
        limitedAccessBtn.addEventListener('click', requestLimitedAccess);
    }

    const reasonSelect = document.getElementById('reasonSelect') as HTMLSelectElement;
    if (reasonSelect) {
        reasonSelect.addEventListener('change', () => {
            const limitedAccessInfo = document.getElementById('limitedAccessInfo');
            if (limitedAccessInfo) {
                limitedAccessInfo.style.display = reasonSelect.value ? 'block' : 'none';
            }
        });
    }

    populateReasons();
    showReasonSection();
    loadBlockInfo();
    updateCountdown();
    setInterval(updateCountdown, 1000);
});