/**
 * Admin Voters Management - COMPLETE & WORKING
 */

const ADMIN_API_URL = 'http://localhost:5000/api/admin';
const VOTERS_PER_PAGE = 15;

let allVoters = [];
let filteredVoters = [];
let currentPage = 1;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadVotersList();
});

/**
 * Load Voters List
 */
async function loadVotersList() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        showLoadingState(true);

        const response = await fetch(`${ADMIN_API_URL}/voters`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        allVoters = Array.isArray(data.voters) ? data.voters : [];
        
        filteredVoters = [...allVoters];
        currentPage = 1;

        updateVoterStatistics(data);
        displayVoters();
        showLoadingState(false);

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to load voters', 'error');
        showLoadingState(false);
    }
}

/**
 * Update Voter Statistics
 */
function updateVoterStatistics(data) {
    const totalVoters = parseInt(data.totalVoters) || 0;
    const votedCount = parseInt(data.votedCount) || 0;
    const notVotedCount = Math.max(0, totalVoters - votedCount);
    const participationRate = totalVoters > 0 
        ? Math.round((votedCount / totalVoters) * 100)
        : 0;

    updateElement('totalVoters', totalVoters.toLocaleString());
    updateElement('votedCount', votedCount.toLocaleString());
    updateElement('notVotedCount', notVotedCount.toLocaleString());
    updateElement('participationRate', `${participationRate}%`);
}

/**
 * Display Voters
 */
function displayVoters() {
    const tbody = document.getElementById('votersTableBody');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');

    if (!tbody) return;

    if (filteredVoters.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const totalPages = Math.ceil(filteredVoters.length / VOTERS_PER_PAGE);
    const startIdx = (currentPage - 1) * VOTERS_PER_PAGE;
    const endIdx = startIdx + VOTERS_PER_PAGE;
    const pageData = filteredVoters.slice(startIdx, endIdx);

    tbody.innerHTML = pageData.map(voter => {
        const hasVoted = voter.hasVoted || voter.votedAt;
        const votedAtTime = voter.votedAt 
            ? new Date(voter.votedAt).toLocaleString()
            : 'Not voted';

        return `
            <tr>
                <td>${escapeHtml(voter.fullName || 'N/A')}</td>
                <td>${escapeHtml(voter.email || 'N/A')}</td>
                <td>${escapeHtml(voter.voterId || 'N/A')}</td>
                <td>${escapeHtml(voter.phone || 'N/A')}</td>
                <td>${voter.dateOfBirth ? formatDate(voter.dateOfBirth) : 'N/A'}</td>
                <td><span class="badge ${hasVoted ? 'badge-success' : 'badge-warning'}">${hasVoted ? '✓ Voted' : '⏳ Pending'}</span></td>
                <td>${votedAtTime}</td>
                <td><button onclick="viewVoterDetails('${voter.id}')" class="btn btn-small btn-secondary">👁️</button></td>
            </tr>
        `;
    }).join('');

    if (pagination) {
        pagination.innerHTML = '';
        
        if (totalPages > 1) {
            if (currentPage > 1) {
                const btn = document.createElement('button');
                btn.textContent = '← Prev';
                btn.onclick = () => goToVoterPage(currentPage - 1);
                pagination.appendChild(btn);
            }

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.className = i === currentPage ? 'active' : '';
                btn.onclick = () => goToVoterPage(i);
                pagination.appendChild(btn);
            }

            if (currentPage < totalPages) {
                const btn = document.createElement('button');
                btn.textContent = 'Next →';
                btn.onclick = () => goToVoterPage(currentPage + 1);
                pagination.appendChild(btn);
            }
        }
    }
}

/**
 * Go to Page
 */
function goToVoterPage(page) {
    currentPage = page;
    displayVoters();
    window.scrollTo(0, 0);
}

/**
 * Search Voters
 */
function searchVoters() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    filteredVoters = allVoters.filter(voter => {
        const nameMatch = (voter.fullName || '').toLowerCase().includes(searchTerm);
        const emailMatch = (voter.email || '').toLowerCase().includes(searchTerm);
        const voterIdMatch = (voter.voterId || '').toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch || voterIdMatch;
    });

    currentPage = 1;
    displayVoters();
}

/**
 * Filter Voters
 */
function filterVoters() {
    const statusFilter = document.getElementById('votingStatusFilter');
    if (!statusFilter) return;

    const selectedStatus = statusFilter.value;

    filteredVoters = selectedStatus === 'voted'
        ? allVoters.filter(v => v.hasVoted || v.votedAt)
        : selectedStatus === 'not-voted'
        ? allVoters.filter(v => !v.hasVoted && !v.votedAt)
        : [...allVoters];

    currentPage = 1;
    displayVoters();
}

/**
 * View Voter Details
 */
function viewVoterDetails(voterId) {
    const voter = allVoters.find(v => v.id === voterId);
    if (!voter) {
        showAdminToast('Voter not found', 'error');
        return;
    }

    const modal = document.getElementById('voterModal');
    const details = document.getElementById('voterDetails');

    if (!modal || !details) return;

    const hasVoted = voter.hasVoted || voter.votedAt;
    const votedDate = voter.votedAt ? new Date(voter.votedAt).toLocaleString() : 'N/A';

    details.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            <div>
                <label style="font-weight: 600;">Full Name</label>
                <p>${escapeHtml(voter.fullName || 'N/A')}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Email</label>
                <p>${escapeHtml(voter.email || 'N/A')}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Voter ID</label>
                <p>${escapeHtml(voter.voterId || 'N/A')}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Phone</label>
                <p>${escapeHtml(voter.phone || 'N/A')}</p>
            </div>
            <div>
                <label style="font-weight: 600;">DOB</label>
                <p>${voter.dateOfBirth ? formatDate(voter.dateOfBirth) : 'N/A'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Registered</label>
                <p>${voter.createdAt ? new Date(voter.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Voting Status</label>
                <p><span class="badge ${hasVoted ? 'badge-success' : 'badge-warning'}">${hasVoted ? '✓ Voted' : '⏳ Not Voted'}</span></p>
            </div>
            ${hasVoted ? `<div><label style="font-weight: 600;">Voted At</label><p>${votedDate}</p></div>` : ''}
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * Close Voter Modal
 */
function closeVoterModal() {
    const modal = document.getElementById('voterModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Export Voters
 */
async function exportVoters() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        showAdminToast('Exporting...', 'info');

        const response = await fetch(`${ADMIN_API_URL}/voters/export/csv`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voters-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAdminToast('✓ Exported', 'success');
    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Export failed', 'error');
    }
}

/**
 * Format Date
 */
function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Update Element
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = content;
}

/**
 * Show Loading State
 */
function showLoadingState(show) {
    const tbody = document.getElementById('votersTableBody');
    if (!tbody) return;

    if (show) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
    }
}