/**
 * Utility functions
 */

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Format date and time
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString();
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Format time remaining
 */
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Time\'s up!';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate phone number
 */
function isValidPhone(phone) {
    const regex = /^[\d\s\-\+\(\)]{7,}$/;
    return regex.test(phone);
}

/**
 * Generate voter ID
 */
function generateVoterId(voterId) {
    return `VOTER-${voterId}`;
}

/**
 * Check if election is active
 */
function isElectionActive(status) {
    return status === 'ACTIVE';
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
    switch(status) {
        case 'ACTIVE':
            return 'status-active';
        case 'CLOSED':
            return 'status-closed';
        case 'PENDING':
            return 'status-pending';
        default:
            return 'status-unknown';
    }
}

/**
 * Sort results by votes
 */
function sortByVotes(results) {
    return [...results].sort((a, b) => b.votes - a.votes);
}

/**
 * Calculate percentage
 */
function calculatePercentage(votes, total) {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            func(...args);
            lastCall = now;
        }
    };
}