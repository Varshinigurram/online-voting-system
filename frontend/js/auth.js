/**
 * Authentication utilities for voter portal
 */

const API_URL = window.API_URL || 'http://localhost:5000';

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate password
 */
function isValidPassword(password) {
    return password && password.length >= 6;
}

/**
 * Check age (18+)
 */
function isValidAge(dateOfBirth) {
    if (!dateOfBirth) return false;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18;
}

/**
 * Register voter
 */
async function registerVoter(fullName, email, password, dateOfBirth, phone) {
    try {
        // Validation
        if (!fullName || fullName.length < 3) {
            throw new Error('Name must be at least 3 characters');
        }

        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (!isValidPassword(password)) {
            throw new Error('Password must be at least 6 characters');
        }

        if (!isValidAge(dateOfBirth)) {
            throw new Error('You must be at least 18 years old to vote');
        }

        // API call
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                dateOfBirth,
                phone
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Registration failed');
        }

        return {
            success: true,
            token: data.token,
            user: data.user
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Login voter
 */
async function loginVoter(email, password) {
    try {
        // Validation
        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        // API call
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }

        return {
            success: true,
            token: data.token,
            user: data.user
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify token is valid
 */
function isTokenValid(token) {
    if (!token) return false;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        const decoded = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        return decoded.exp > now;
    } catch {
        return false;
    }
}

/**
 * Store credentials
 */
function storeCredentials(token, user) {
    localStorage.setItem('voterToken', token);
    localStorage.setItem('voterUser', JSON.stringify(user));
}

/**
 * Clear credentials
 */
function clearCredentials() {
    localStorage.removeItem('voterToken');
    localStorage.removeItem('voterUser');
}

/**
 * Get stored token
 */
function getToken() {
    return localStorage.getItem('voterToken');
}

/**
 * Get stored user
 */
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('voterUser') || '{}');
    } catch {
        return {};
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const token = getToken();
    return isTokenValid(token);
}