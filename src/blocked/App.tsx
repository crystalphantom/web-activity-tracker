import { useState, useEffect } from 'react';

const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Time is more valuable than money. You can get more money, but you cannot get more time.", author: "Jim Rohn" },
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Dream bigger. Do bigger.", author: "Unknown" }
];

const breakSuggestions = [
    '🚶 Take a 5-minute walk and stretch',
    '💧 Drink a glass of water and hydrate',
    '🧘 Try 3 minutes of mindful breathing',
    '👀 Look out the window and rest your eyes',
    '🎵 Listen to your favorite song',
    '📱 Call a friend or family member',
    '🥗 Have a healthy snack',
    '📚 Read a few pages of a book',
    '🏃 Do 10 jumping jacks',
    '🌱 Take care of your houseplants'
];

const App = () => {
    const [domain, setDomain] = useState("Loading...");
    const [timeSpent, setTimeSpent] = useState("--");
    const [dailyLimit, setDailyLimit] = useState("--");
    const [usagePercent, setUsagePercent] = useState("--");
    const [countdown, setCountdown] = useState("Calculating...");
    const [quote, setQuote] = useState({ text: "Loading...", author: "Loading..." });
    const [blockReason, setBlockReason] = useState("Loading...");

    useEffect(() => {
        const initializePage = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const domainParam = urlParams.get('domain') || 'this site';
            const timeSpentParam = parseInt(urlParams.get('timeSpent') || '0');
            const limitParam = parseInt(urlParams.get('limit') || '0');

            setDomain(domainParam);
            setBlockReason(`You've reached your daily time limit for ${domainParam}. Time to take a productive break!`);

            if (timeSpentParam >= 0) {
                setTimeSpent(formatShortDuration(timeSpentParam));
            } else {
                setTimeSpent("Error");
            }

            if (limitParam > 0) {
                setDailyLimit(formatShortDuration(limitParam));
                setUsagePercent(calculateUsagePercentage(timeSpentParam, limitParam));
            } else {
                setDailyLimit("Unlimited");
                setUsagePercent("N/A");
            }

            loadRandomQuote();
        };

        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const timeUntilReset = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

            if (timeUntilReset > 0) {
                setCountdown(formatDuration(timeUntilReset));
            } else {
                setCountdown('Resetting soon...');
            }
        };

        initializePage();
        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => clearInterval(countdownInterval);
    }, []);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const formatShortDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return '< 1m';
        }
    };

    const calculateUsagePercentage = (timeSpent: number, limit: number) => {
        if (limit === 0) return '∞';
        const percentage = Math.min((timeSpent / limit) * 100, 999);
        return `${Math.round(percentage)}%`;
    };

    const loadRandomQuote = () => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
    };

    const takeABreak = () => {
        const suggestion = breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
        const originalText = blockReason;
        setBlockReason(`Great choice! ${suggestion}`);
        setTimeout(() => setBlockReason(originalText), 4000);
    };

    const viewDashboard = () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('src/dashboard/index.html')
            });
        } else {
            console.log('Dashboard would open in extension context');
            alert('Dashboard would open in extension context');
        }
    };

    return (
        <div className="font-sans bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute w-full h-full top-0 left-0 animate-gradient-x"></div>
            <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-3xl max-w-2xl w-full text-center shadow-2xl border border-white border-opacity-30 overflow-hidden z-10">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-8 text-center relative">
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                            <div className="text-4xl">⏰</div>
                        </div>
                        <h1 className="text-white text-4xl font-bold mb-2">Time's Up!</h1>
                        <p className="text-white text-opacity-90">Your digital wellness guardian</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-6 mb-8 relative">
                        <div className="absolute top-4 right-4 text-2xl animate-bounce">⚠️</div>
                        <div className="text-2xl font-semibold text-yellow-800 mb-2">{domain}</div>
                        <div className="text-yellow-700">{blockReason}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard icon="⏱️" label="Time Spent" value={timeSpent} />
                        <StatCard icon="🎯" label="Daily Limit" value={dailyLimit} />
                        <StatCard icon="📊" label="Usage" value={usagePercent} />
                    </div>

                    <div className="bg-red-500 text-white rounded-2xl p-6 mb-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black bg-opacity-10 animate-pulse"></div>
                        <div className="relative z-10">
                            <div className="text-lg opacity-90 mb-2">⏳ Time until daily reset</div>
                            <div className="text-4xl font-bold">{countdown}</div>
                        </div>
                    </div>

                    <div className="bg-purple-100 border-l-4 border-purple-500 rounded-xl p-6 mb-8 text-left relative">
                        <div className="absolute top-2 left-4 text-6xl text-purple-200 font-serif">"</div>
                        <p className="text-purple-800 italic text-lg leading-relaxed mb-4 z-10 relative">{quote.text}</p>
                        <p className="text-purple-600 font-semibold text-right">— {quote.author}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={takeABreak} className="bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            🧘 Take a Break
                        </button>
                        <button onClick={viewDashboard} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            📊 View Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 rounded-2xl p-5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-sm text-gray-600 uppercase font-semibold tracking-wider mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-800">{value}</div>
    </div>
);

export default App;
