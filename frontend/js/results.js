/**
 * Results functionality
 */

const API_URL = 'http://localhost:5000';

/**
 * Load election results
 */
async function loadResults() {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/voters/results`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load results');

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to load results');

        return {
            results: data.results || [],
            totalVotes: data.totalVotes || 0
        };

    } catch (error) {
        console.error('Error loading results:', error);
        throw error;
    }
}

/**
 * Get election status
 */
async function getElectionStatus() {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/admin/election-status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to get election status');

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to get election status');

        return {
            status: data.status,
            startTime: data.startTime,
            endTime: data.endTime
        };

    } catch (error) {
        console.error('Error getting election status:', error);
        throw error;
    }
}

/**
 * Calculate time remaining
 */
function calculateTimeRemaining(endTime) {
    if (!endTime) return null;

    const end = new Date(endTime);
    const now = new Date();
    const remaining = end - now;

    if (remaining <= 0) return '00:00:00';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Get winner from results
 */
function getWinner(results) {
    if (!results || results.length === 0) return null;
    return results[0]; // Results are sorted by votes
}