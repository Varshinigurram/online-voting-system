/**
 * Admin Election Control - COMPLETE & WORKING
 * Full election lifecycle management
 */

const ADMIN_API_URL = (window.ADMIN_API_URL || 'http://localhost:5000') + '/api/admin';
let electionStatus = 'CLOSED';
let electionStartTime = null;
let electionEndTime = null;
let updateInterval = null;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadElectionStatus();
    setupAutoUpdate();
    setupForms();
});

/**
 * Setup Forms
 */
function setupForms() {
    const scheduleForm = document.getElementById('scheduleForm');
    const extendForm = document.getElementById('extendForm');

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', scheduleElection);
    }

    if (extendForm) {
        extendForm.addEventListener('submit', extendElectionTime);
    }
}

/**
 * Setup Auto Update
 */
function setupAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
        updateElectionTimer();
    }, 1000);
}

/**
 * Load Election Status
 */
async function loadElectionStatus() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/election-status`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        
        electionStatus = (data.status || 'CLOSED').toUpperCase();
        electionStartTime = data.startTime ? new Date(data.startTime) : null;
        electionEndTime = data.endTime ? new Date(data.endTime) : null;

        updateElectionUI(data);
        updateElectionTimer();

    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Update Election UI
 */
function updateElectionUI(data) {
    const statusEl = document.getElementById('electionStatus');
    const startTimeEl = document.getElementById('startTime');
    const endTimeEl = document.getElementById('endTime');
    const startBtn = document.getElementById('startBtn');
    const endBtn = document.getElementById('endBtn');
    const extendBtn = document.getElementById('extendBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    const isActive = data.status === 'ACTIVE';

    if (statusEl) statusEl.textContent = data.status || 'CLOSED';
    if (startTimeEl) startTimeEl.textContent = data.startTime ? new Date(data.startTime).toLocaleString() : 'Not Started';
    if (endTimeEl) endTimeEl.textContent = data.endTime ? new Date(data.endTime).toLocaleString() : 'Not Set';

    if (startBtn) startBtn.disabled = isActive;
    if (endBtn) endBtn.disabled = !isActive;
    if (extendBtn) extendBtn.disabled = !isActive;
    if (pauseBtn) pauseBtn.disabled = !isActive;
}

/**
 * Update Election Timer
 */
function updateElectionTimer() {
    const timeRemainingEl = document.getElementById('timeRemaining');
    if (!timeRemainingEl || !electionEndTime || electionStatus !== 'ACTIVE') {
        return;
    }

    const now = new Date();
    const timeRemaining = electionEndTime - now;

    if (timeRemaining <= 0) {
        timeRemainingEl.textContent = '00:00:00';
        endElectionAuto();
        return;
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    timeRemainingEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (timeRemaining < 5 * 60 * 1000) {
        timeRemainingEl.style.color = 'var(--admin-danger)';
    } else {
        timeRemainingEl.style.color = 'inherit';
    }
}

/**
 * Start Election
 */
async function startElection() {
    if (!confirm('Start election? Voting will be active.')) return;

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/election/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ duration: 3600 })
        });

        if (!response.ok) throw new Error('Failed to start');

        const data = await response.json();
        electionStatus = 'ACTIVE';
        electionEndTime = new Date(data.endTime);

        logAdminActivity('ELECTION_STARTED', {});
        showAdminToast('✓ Election started', 'success');
        loadElectionStatus();
        addActivityLog('Election Started', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to start election', 'error');
    }
}

/**
 * End Election
 */
async function endElection() {
    if (!confirm('End election? No more votes will be accepted.')) return;

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/election/end`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to end');

        electionStatus = 'CLOSED';

        logAdminActivity('ELECTION_ENDED', {});
        showAdminToast('✓ Election ended', 'success');
        loadElectionStatus();
        addActivityLog('Election Ended', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to end election', 'error');
    }
}

/**
 * End Election Auto
 */
async function endElectionAuto() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        await fetch(`${ADMIN_API_URL}/election/end`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        electionStatus = 'CLOSED';
        logAdminActivity('ELECTION_AUTO_ENDED', {});
        addActivityLog('Election Automatically Ended', 'warning');
        loadElectionStatus();

    } catch (error) {
        console.warn('Auto-end error:', error);
    }
}

/**
 * Pause Election
 */
async function pauseElection() {
    if (!confirm('Pause election?')) return;

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/election/pause`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to pause');

        electionStatus = 'PAUSED';
        logAdminActivity('ELECTION_PAUSED', {});
        showAdminToast('✓ Election paused', 'success');
        loadElectionStatus();
        addActivityLog('Election Paused', 'info');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to pause', 'error');
    }
}

/**
 * Open Extend Modal
 */
function openExtendModal() {
    const modal = document.getElementById('extendModal');
    if (modal) modal.style.display = 'flex';
}

/**
 * Close Extend Modal
 */
function closeExtendModal() {
    const modal = document.getElementById('extendModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Extend Election Time
 */
async function extendElectionTime(e) {
    e.preventDefault();

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const hours = parseInt(document.getElementById('extendHours').value) || 0;
        const minutes = parseInt(document.getElementById('extendMinutes').value) || 0;

        if (hours === 0 && minutes === 0) {
            showAdminToast('Enter a time duration', 'error');
            return;
        }

        const response = await fetch(`${ADMIN_API_URL}/election/extend`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ additionalMinutes: hours * 60 + minutes })
        });

        if (!response.ok) throw new Error('Failed to extend');

        const data = await response.json();
        electionEndTime = new Date(data.newEndTime);

        logAdminActivity('ELECTION_EXTENDED', { hours, minutes });
        showAdminToast(`✓ Extended by ${hours}h ${minutes}m`, 'success');
        closeExtendModal();
        loadElectionStatus();
        addActivityLog(`Election Extended by ${hours}h ${minutes}m`, 'info');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to extend', 'error');
    }
}

/**
 * Schedule Election
 */
async function scheduleElection(e) {
    e.preventDefault();

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            showAdminToast('Fill all fields', 'error');
            return;
        }

        const startTime = new Date(startDate);
        const endTime = new Date(endDate);

        if (startTime >= endTime) {
            showAdminToast('End time must be after start', 'error');
            return;
        }

        const response = await fetch(`${ADMIN_API_URL}/election/schedule`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            })
        });

        if (!response.ok) throw new Error('Failed to schedule');

        logAdminActivity('ELECTION_SCHEDULED', {});
        showAdminToast('✓ Election scheduled', 'success');
        loadElectionStatus();
        addActivityLog('Election Scheduled', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to schedule', 'error');
    }
}

/**
 * Save Settings
 */
async function saveSettings() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        const settings = {
            allowMultipleVotes: document.getElementById('allowMultipleVotes')?.checked || false,
            enablePublicResults: document.getElementById('enablePublicResults')?.checked || false,
            enableAnonymousVoting: document.getElementById('enableAnonymousVoting')?.checked || false
        };

        const response = await fetch(`${ADMIN_API_URL}/election/settings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });

        if (!response.ok) throw new Error('Failed to save');

        logAdminActivity('ELECTION_SETTINGS_UPDATED', settings);
        showAdminToast('✓ Settings saved', 'success');
        addActivityLog('Settings Updated', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('Failed to save', 'error');
    }
}

/**
 * Add Activity Log Entry
 */
function addActivityLog(message, type = 'info') {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <div class="log-entry-time">${new Date().toLocaleTimeString()}</div>
        <div class="log-entry-message">${escapeHtml(message)}</div>
    `;

    activityLog.insertBefore(logEntry, activityLog.firstChild);

    while (activityLog.children.length > 20) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (updateInterval) clearInterval(updateInterval);
});