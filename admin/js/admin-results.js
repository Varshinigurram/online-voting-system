/**
 * Admin Results - COMPLETE & WORKING
 */

const ADMIN_API_URL = 'http://localhost:5000/api/admin';
let resultsData = null;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadResults();
});

/**
 * Load Results
 */
async function loadResults() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/results`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load');

        resultsData = await response.json();
        displayResults();

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to load results', 'error');
    }
}

/**
 * Display Results
 */
function displayResults() {
    if (!resultsData) return;

    try {
        displayWinner();
        displayResultsSummary();
        displayDetailedResults();

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Error displaying results', 'error');
    }
}

/**
 * Display Winner
 */
function displayWinner() {
    const candidates = resultsData.candidates || [];
    if (candidates.length === 0) return;

    const winner = candidates.reduce((prev, current) => 
        (prev.votes || 0) > (current.votes || 0) ? prev : current
    );

    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
    const percentage = totalVotes > 0 ? Math.round((winner.votes / totalVotes) * 100) : 0;

    updateElement('winnerName', escapeHtml(winner.name));
    updateElement('winnerParty', escapeHtml(winner.party || 'Independent'));
    updateElement('winnerVoteCount', winner.votes || 0);
    updateElement('winnerPercentage', percentage);

    const winnerImage = document.getElementById('winnerImage');
    if (winnerImage) {
        if (winner.imageUrl) {
            winnerImage.innerHTML = `<img src="${escapeHtml(winner.imageUrl)}" alt="${escapeHtml(winner.name)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            winnerImage.textContent = '👤';
        }
    }
}

/**
 * Display Results Summary
 */
function displayResultsSummary() {
    const candidates = resultsData.candidates || [];
    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
    const totalVoters = resultsData.totalVoters || 0;
    const participation = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;

    updateElement('totalVotesCast', totalVotes.toLocaleString());
    updateElement('totalCandidates', candidates.length.toLocaleString());
    updateElement('voterParticipation', `${participation}%`);

    const status = resultsData.published ? 'Published' : 'Pending';
    updateElement('resultStatus', status);
}

/**
 * Display Detailed Results
 */
function displayDetailedResults() {
    const candidates = (resultsData.candidates || [])
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));

    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

    tbody.innerHTML = candidates.map((candidate, index) => {
        const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;

        return `
            <tr>
                <td style="font-weight: bold;">${index + 1}</td>
                <td>
                    <img src="${escapeHtml(candidate.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23ddd%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E')}" 
                         alt="${escapeHtml(candidate.name)}"
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                </td>
                <td><strong>${escapeHtml(candidate.name)}</strong></td>
                <td>${escapeHtml(candidate.party || 'N/A')}</td>
                <td><strong>${candidate.votes || 0}</strong></td>
                <td><strong>${percentage}%</strong></td>
                <td><div style="width: 200px; height: 8px; background: #ddd; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);"></div>
                </div></td>
            </tr>
        `;
    }).join('');
}

/**
 * Refresh Results
 */
function refreshResults() {
    showAdminToast('🔄 Refreshing...', 'info');
    loadResults();
}

/**
 * Publish Results
 */
async function publishResults() {
    if (!confirm('Publish results? This is irreversible.')) return;

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/results/publish`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed');

        resultsData.published = true;
        logAdminActivity('RESULTS_PUBLISHED', {});
        
        showAdminToast('✓ Results published', 'success');
        displayResults();

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to publish', 'error');
    }
}

/**
 * Export Results
 */
async function exportResults(format) {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        showAdminToast(`Exporting as ${format}...`, 'info');

        const response = await fetch(`${ADMIN_API_URL}/results/export/${format}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `results.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAdminToast(`✓ Exported`, 'success');
    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Export failed', 'error');
    }
}

/**
 * Generate Certificate
 */
async function generateCertificate() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        showAdminToast('Generating...', 'info');

        const response = await fetch(`${ADMIN_API_URL}/results/certificate`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAdminToast('✓ Certificate generated', 'success');
    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Certificate generation failed', 'error');
    }
}

/**
 * Share Results
 */
function shareResults() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'Election Results',
            text: 'View the latest election results',
            url: url
        }).catch(err => console.log('Share error:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showAdminToast('✓ Link copied', 'success');
        }).catch(err => {
            showAdminToast('Failed to copy', 'error');
        });
    }
}

/**
 * Update Element
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        if (typeof content === 'number') {
            element.textContent = content;
        } else {
            element.textContent = content;
        }
    }
}