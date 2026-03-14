/**
 * Voting functionality
 */

const API_URL = window.API_URL || 'http://localhost:5000';

/**
 * Load candidates for voting
 */
async function loadCandidates() {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/voters/candidates`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load candidates');

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to load candidates');

        return data.candidates || [];

    } catch (error) {
        console.error('Error loading candidates:', error);
        throw error;
    }
}

/**
 * Submit vote
 */
async function submitVote(candidateId) {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/voters/vote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidateId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to submit vote');
        }

        return {
            success: true,
            message: data.message
        };

    } catch (error) {
        console.error('Error submitting vote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if voter has already voted
 */
function hasAlreadyVoted() {
    try {
        const user = JSON.parse(localStorage.getItem('voterUser') || '{}');
        return user.hasVoted === true;
    } catch {
        return false;
    }
}

/**
 * Get vote count for results
 */
async function getVoteCount() {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/voters/results`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to get results');

        const data = await response.json();

        return {
            success: true,
            results: data.results || [],
            totalVotes: data.totalVotes || 0
        };

    } catch (error) {
        console.error('Error getting vote count:', error);
        return {
            success: false,
            error: error.message
        };
    }
}