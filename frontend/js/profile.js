/**
 * Profile functionality
 */

const API_URL = 'http://localhost:5000';

/**
 * Get voter profile
 */
async function getVoterProfile() {
    try {
        const token = localStorage.getItem('voterToken');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/voters/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to get profile');

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to get profile');

        return data.profile;

    } catch (error) {
        console.error('Error getting profile:', error);
        throw error;
    }
}

/**
 * Download profile as JSON
 */
function downloadProfile(profileData) {
    try {
        const dataStr = JSON.stringify(profileData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VoteHub-Profile-${profileData.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading profile:', error);
        return false;
    }
}

/**
 * Export profile data
 */
function exportProfile(profileData) {
    const exportData = {
        voterId: profileData.voterId,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        hasVoted: profileData.hasVoted,
        votedAt: profileData.votedAt,
        registeredDate: profileData.createdAt,
        exportDate: new Date().toLocaleString()
    };

    return exportData;
}