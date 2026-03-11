/**
 * Common utilities for all voter pages
 * FIXED: Proper authentication checking
 */
/**
 * Common utilities for all voter pages
 */

// ⭐ CORRECT API URL - INCLUDE /api
const API_URL = 
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : `${window.location.protocol}//${window.location.hostname}/api`;
console.log("🔗 API URL:", API_URL);

/**
 * Check authentication
 */
function checkAuth() {
    const token = localStorage.getItem('voterToken');
    console.log('🔐 Checking auth... Token:', !!token);
    
    if (!token) {
        console.log('❌ No token, redirecting to login');
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

/**
 * Get voter data
 */
function getVoterData() {
    try {
        const data = JSON.parse(localStorage.getItem('voterUser') || '{}');
        console.log('👤 Voter data:', data);
        return data;
    } catch (error) {
        console.error('Error parsing voter data:', error);
        return {};
    }
}

/**
 * Get voter data from local storage
 */
function getVoterData() {
    try {
        const data = localStorage.getItem('voterUser');
        if (!data) {
            console.log('❌ No voter data in localStorage');
            return {};
        }
        const parsed = JSON.parse(data);
        console.log('✅ Voter data loaded:', parsed.name, parsed.email);
        return parsed;
    } catch (error) {
        console.error('Error parsing voter data:', error);
        return {};
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Logout voter
 */
function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        showToast('✅ Logged out', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Format date and time to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'N/A';
    }
}
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString();
    } catch {
        return 'N/A';
    }
}

/**
 * Load voter name in navigation - MUST BE PERSONALIZED
 */
function loadVoterNav() {
    const voter = getVoterData();
    const elements = document.querySelectorAll('#voterName, .voter-name');
    elements.forEach(el => {
        el.textContent = voter.name || 'Voter';
    });
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
 * Validate email format
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}