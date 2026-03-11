// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMe = document.getElementById('rememberMe');
const submitButton = loginForm.querySelector('button[type="submit"]');
const loadingState = document.getElementById('loadingState');
const toastContainer = document.getElementById('toastContainer');

// Toggle Password Visibility
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }

    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMe.checked = true;
    }
});

// Form Submission
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!emailInput.value || !passwordInput.value) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    loginForm.style.display = 'none';
    loadingState.style.display = 'block';

    try {
        const credentials = {
            email: emailInput.value,
            password: passwordInput.value
        };

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Remember email if checked
        if (rememberMe.checked) {
            localStorage.setItem('rememberedEmail', emailInput.value);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        showToast(error.message || 'An error occurred during login', 'error');
        loginForm.style.display = 'block';
        loadingState.style.display = 'none';
    }
});

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Logout Function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}