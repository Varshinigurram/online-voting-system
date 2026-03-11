/**
 * Admin Authentication Module - FIXED
 */

const ADMIN_API_URL = 'http://localhost:5000';

const adminLoginForm = document.getElementById('adminLoginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loadingState = document.getElementById('loadingState');
const toastContainer = document.getElementById('toastContainer');

let sessionTimer = null;
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const adminPages = ['dashboard.html', 'candidates.html', 'add-candidate.html', 'voters.html',
                       'election-control.html', 'statistics.html', 'results.html'];

    if (adminPages.includes(currentPage)) {
        checkAdminAuth();
        loadAdminInfo();
        setupSessionTimeout();
    }
});

/**
 * Toggle Password Visibility
 */
function toggleAdminPassword() {
    const input = document.getElementById('password');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

/**
 * Admin Login - FIXED
 */
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation
        if (!email || !password) {
            showAdminToast('Email and password required', 'error');
            return;
        }

        if (!email.includes('@')) {
            showAdminToast('Invalid email format', 'error');
            return;
        }

        // Show loading
        adminLoginForm.style.display = 'none';
        if (loadingState) loadingState.style.display = 'block';

        try {
            console.log('🔐 Attempting login for:', email);

            const response = await fetch(`${ADMIN_API_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('No token received');
            }

            // Store credentials
            const expiryTime = Date.now() + SESSION_TIMEOUT;
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
            localStorage.setItem('adminTokenExpiry', expiryTime.toString());

            console.log('✅ Login successful');
            showAdminToast('✅ Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('❌ Login error:', error);
            showAdminToast(`❌ ${error.message}`, 'error');
            
            adminLoginForm.style.display = 'block';
            if (loadingState) loadingState.style.display = 'none';
        }
    });
}

/**
 * Check Admin Auth
 */
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const tokenExpiry = localStorage.getItem('adminTokenExpiry');

    if (!token || !tokenExpiry) {
        window.location.href = 'index.html';
        return null;
    }

    if (Date.now() > parseInt(tokenExpiry)) {
        clearAdminSession();
        window.location.href = 'index.html';
        return null;
    }

    return token;
}

/**
 * Get Admin User
 */
function getAdminUser() {
    try {
        const adminJson = localStorage.getItem('adminUser');
        return adminJson ? JSON.parse(adminJson) : null;
    } catch (error) {
        return null;
    }
}

/**
 * Load Admin Info
 */
function loadAdminInfo() {
    const admin = getAdminUser();
    const adminNameElements = document.querySelectorAll('#adminName');

    if (admin && adminNameElements.length > 0) {
        adminNameElements.forEach(el => {
            el.textContent = `${admin.name} (${admin.email})`;
        });
    }

    return admin;
}

/**
 * Get Auth Headers
 */
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Logout
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAdminSession();
        showAdminToast('✅ Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

/**
 * Clear Session
 */
function clearAdminSession() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminTokenExpiry');
    if (sessionTimer) clearTimeout(sessionTimer);
}

/**
 * Setup Session Timeout
 */
function setupSessionTimeout() {
    if (sessionTimer) clearTimeout(sessionTimer);

    sessionTimer = setTimeout(() => {
        clearAdminSession();
        showAdminToast('Session expired. Please login again.', 'warning');
        window.location.href = 'index.html';
    }, SESSION_TIMEOUT);
}

/**
 * Show Toast
 */
function showAdminToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span style="font-weight: bold; margin-right: 10px;">${icons[type]}</span>
        <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
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
 * Toggle Mobile Menu
 */
function toggleMobileMenu() {
    const menu = document.querySelector('.navbar-menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}