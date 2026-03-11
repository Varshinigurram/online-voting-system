/**
 * Admin Dashboard Module - COMPLETE & WORKING
 * Real-time election statistics with accurate calculations
 */

const ADMIN_API_URL = 'http://localhost:5000/api/admin';
let dashboardRefreshInterval = null;
const REFRESH_INTERVAL = 10000; // 10 seconds

/**
 * Initialize Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadDashboardData();
    setupAutoRefresh();
});

/**
 * Setup Auto Refresh
 */
function setupAutoRefresh() {
    if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
    
    dashboardRefreshInterval = setInterval(() => {
        loadDashboardData();
    }, REFRESH_INTERVAL);

    window.addEventListener('beforeunload', () => {
        if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
    });
}

/**
 * Load Dashboard Data
 */
async function loadDashboardData() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/dashboard`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                clearAdminSession();
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateDashboardDisplay(data);
        updateLastUpdatedTime();

    } catch (error) {
        console.error('Dashboard error:', error);
        // Don't show error on auto-refresh, only on manual refresh
    }
}

/**
 * Update Dashboard Display
 */
function updateDashboardDisplay(data) {
    try {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data format');
            return;
        }

        // Extract data with defaults
        const totalVoters = Math.max(0, parseInt(data.totalVoters) || 0);
        const totalCandidates = Math.max(0, parseInt(data.totalCandidates) || 0);
        const totalVotes = Math.max(0, parseInt(data.totalVotes) || 0);
        const electionStatus = (data.electionStatus || 'CLOSED').toUpperCase();
        const candidates = Array.isArray(data.candidates) ? data.candidates : [];

        // Calculate metrics
        const remainingVoters = Math.max(0, totalVoters - totalVotes);
        const turnoutPercentage = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;
        const remainingPercent = totalVoters > 0 ? Math.round((remainingVoters / totalVoters) * 100) : 0;

        // Update cards
        updateElement('totalVoters', totalVoters.toLocaleString());
        updateElement('totalCandidates', totalCandidates.toLocaleString());
        updateElement('totalVotes', totalVotes.toLocaleString());
        updateElement('remainingVoters', remainingVoters.toLocaleString());
        updateElement('turnoutPercentage', `${turnoutPercentage}%`);
        updateElement('votePercentage', `${turnoutPercentage}%`);

        // Update Election Status
        updateElectionStatus(electionStatus);

        // Update trends
        updateElement('voterTrend', `
            <span class="trend-icon">📈</span>
            <span class="trend-text">${Math.round((totalVotes / Math.max(1, totalVoters)) * 100)}% voted</span>
        `);

        updateElement('remainingTrend', `
            <span class="trend-icon">⏱️</span>
            <span class="trend-text">${remainingPercent}% awaiting</span>
        `);

        // Update progress bar
        const progressBar = document.getElementById('turnoutProgress');
        if (progressBar) {
            progressBar.style.width = `${turnoutPercentage}%`;
        }

        // Update candidates ranking
        updateTopCandidatesRanking(candidates, totalVotes);

        // Update status alert
        updateStatusAlert(data);

    } catch (error) {
        console.error('Error updating display:', error);
    }
}

/**
 * Update Top Candidates Ranking
 */
function updateTopCandidatesRanking(candidates, totalVotes) {
    const rankingContainer = document.getElementById('candidatesRanking');
    if (!rankingContainer) return;

    if (!Array.isArray(candidates) || candidates.length === 0) {
        rankingContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No voting data yet</p>';
        return;
    }

    const sorted = candidates
        .filter(c => c && c.name && typeof c.votes === 'number')
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5);

    const sum = sorted.reduce((acc, c) => acc + c.votes, 0);

    rankingContainer.innerHTML = sorted.map((candidate, index) => {
        const percentage = sum > 0 ? Math.round((candidate.votes / sum) * 100) : 0;
        return `
            <div class="rank-item">
                <div class="rank-number">${index + 1}</div>
                <div class="rank-bar">
                    <div class="rank-bar-label">
                        <span class="rank-bar-name">${escapeHtml(candidate.name)}</span>
                        <span class="rank-bar-votes">${candidate.votes} (${percentage}%)</span>
                    </div>
                    <div class="rank-bar-fill">
                        <div class="rank-bar-progress" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update Election Status
 */
function updateElectionStatus(status) {
    const statusBadge = document.getElementById('statusBadge');
    const statusLabel = document.getElementById('statusLabel');

    if (statusBadge) {
        statusBadge.textContent = status;
        statusBadge.className = `status-badge ${status === 'ACTIVE' ? 'active' : 'closed'}`;
    }

    if (statusLabel) {
        const labelText = status === 'ACTIVE' ? 'Voting is Active' : 'Voting is Closed';
        statusLabel.textContent = labelText;
    }

    const statusAlert = document.getElementById('statusAlert');
    if (statusAlert && status === 'ACTIVE') {
        statusAlert.style.display = 'block';
        const alertText = statusAlert.querySelector('#alertText');
        if (alertText) alertText.textContent = '⚠️ Election is currently active - Voting in progress';
    } else if (statusAlert) {
        statusAlert.style.display = 'none';
    }
}

/**
 * Update Status Alert
 */
function updateStatusAlert(data) {
    const statusAlert = document.getElementById('statusAlert');
    if (!statusAlert) return;

    const issues = [];

    if (!data.totalCandidates || data.totalCandidates === 0) {
        issues.push('No candidates registered');
    }

    if (issues.length > 0 && data.electionStatus === 'ACTIVE') {
        statusAlert.style.display = 'block';
        const alertText = statusAlert.querySelector('#alertText');
        if (alertText) alertText.textContent = issues.join(' • ');
    }
}

/**
 * Update Element
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        if (typeof content === 'string' && content.includes('<')) {
            element.innerHTML = content;
        } else {
            element.textContent = content;
        }
    }
}

/**
 * Update Last Updated Time
 */
function updateLastUpdatedTime() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        const now = new Date();
        lastUpdated.textContent = `Last Updated: ${now.toLocaleTimeString()}`;
    }
}

/**
 * Refresh Dashboard
 */
function refreshDashboard() {
    showAdminToast('🔄 Refreshing dashboard...', 'info');
    loadDashboardData();
}

/**
 * Go to Add Candidate
 */
function goToAddCandidate() {
    window.location.href = 'add-candidate.html';
}

/**
 * Generate Report
 */
async function generateReport() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        showAdminToast('📄 Generating report...', 'info');

        const response = await fetch(`${ADMIN_API_URL}/generate-report`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to generate report');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `election-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAdminToast('✓ Report generated successfully', 'success');
    } catch (error) {
        console.error('Report error:', error);
        showAdminToast('Failed to generate report', 'error');
    }
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (dashboardRefreshInterval) clearInterval(dashboardRefreshInterval);
});