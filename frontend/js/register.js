// API Configuration
const API_URL = window.API_URL || 'http://localhost:5000';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const dobInput = document.getElementById('dob');
const voterIdInput = document.getElementById('voterId');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const submitButton = registerForm.querySelector('button[type="submit"]');
const loadingState = document.getElementById('loadingState');
const toastContainer = document.getElementById('toastContainer');

// Form Validation Rules
const validationRules = {
    fullName: {
        required: true,
        minLength: 3,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'Name must be at least 3 characters and contain only letters'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        required: true,
        pattern: /^[0-9\-\+\s\(\)]{10,}$/,
        message: 'Please enter a valid phone number'
    },
    dob: {
        required: true,
        message: 'Date of birth is required'
    },
    voterId: {
        required: true,
        minLength: 5,
        message: 'Voter ID must be at least 5 characters'
    },
    password: {
        required: true,
        minLength: 8,
        message: 'Password must be at least 8 characters'
    },
    confirmPassword: {
        required: true,
        message: 'Please confirm your password'
    }
};

// Toggle Password Visibility
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    const strengthBar = document.getElementById('strengthBar');
    const passwordHint = document.getElementById('passwordHint');

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    strengthBar.className = 'strength-bar';
    if (strength < 2) {
        strengthBar.classList.add('weak');
        passwordHint.textContent = '❌ Weak password';
        passwordHint.style.color = 'var(--danger-color)';
    } else if (strength < 4) {
        strengthBar.classList.add('medium');
        passwordHint.textContent = '⚠️ Medium password';
        passwordHint.style.color = 'var(--warning-color)';
    } else {
        strengthBar.classList.add('strong');
        passwordHint.textContent = '✓ Strong password';
        passwordHint.style.color = 'var(--success-color)';
    }
}

// Field Validation
function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    if (!rules) return { valid: true };

    if (rules.required && !value.trim()) {
        return { valid: false, message: `${fieldName} is required` };
    }

    if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, message: rules.message };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
        return { valid: false, message: rules.message };
    }

    return { valid: true };
}

// Display Error
function showError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const input = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.textContent = message;
        input?.parentElement.classList.add('error');
    }
}

// Clear Error
function clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const input = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.textContent = '';
        input?.parentElement.classList.remove('error');
    }
}

// Real-time Validation
fullNameInput?.addEventListener('blur', () => {
    const validation = validateField('fullName', fullNameInput.value);
    if (!validation.valid) {
        showError('fullName', validation.message);
    } else {
        clearError('fullName');
    }
});

emailInput?.addEventListener('blur', () => {
    const validation = validateField('email', emailInput.value);
    if (!validation.valid) {
        showError('email', validation.message);
    } else {
        clearError('email');
    }
});

phoneInput?.addEventListener('blur', () => {
    const validation = validateField('phone', phoneInput.value);
    if (!validation.valid) {
        showError('phone', validation.message);
    } else {
        clearError('phone');
    }
});

dobInput?.addEventListener('blur', () => {
    if (!dobInput.value) {
        showError('dob', 'Date of birth is required');
    } else {
        clearError('dob');
    }
});

voterIdInput?.addEventListener('blur', () => {
    const validation = validateField('voterId', voterIdInput.value);
    if (!validation.valid) {
        showError('voterId', validation.message);
    } else {
        clearError('voterId');
    }
});

passwordInput?.addEventListener('input', () => {
    checkPasswordStrength(passwordInput.value);
});

passwordInput?.addEventListener('blur', () => {
    const validation = validateField('password', passwordInput.value);
    if (!validation.valid) {
        showError('password', validation.message);
    } else {
        clearError('password');
    }
});

confirmPasswordInput?.addEventListener('blur', () => {
    if (passwordInput.value !== confirmPasswordInput.value) {
        showError('confirmPassword', 'Passwords do not match');
    } else {
        clearError('confirmPassword');
    }
});

// Form Submission
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let formValid = true;
    const fields = ['fullName', 'email', 'phone', 'dob', 'voterId', 'password', 'confirmPassword'];

    for (const field of fields) {
        const input = document.getElementById(field);
        let value = input.value;

        if (field === 'dob') {
            value = input.value ? 'valid' : '';
        }

        const validation = validateField(field, value);
        if (!validation.valid) {
            showError(field, validation.message);
            formValid = false;
        } else {
            clearError(field);
        }
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
        showError('confirmPassword', 'Passwords do not match');
        formValid = false;
    }

    if (!termsCheckbox.checked) {
        showError('terms', 'You must agree to the terms and conditions');
        formValid = false;
    } else {
        clearError('terms');
    }

    if (!formValid) {
        showToast('Please fix the errors above', 'error');
        return;
    }

    // Show loading state
    registerForm.style.display = 'none';
    loadingState.style.display = 'block';

    try {
        const userData = {
            fullName: fullNameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            dateOfBirth: dobInput.value,
            voterId: voterIdInput.value,
            password: passwordInput.value
        };

        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        showToast(error.message || 'An error occurred during registration', 'error');
        registerForm.style.display = 'block';
        loadingState.style.display = 'none';
    }
});

// Toast Notification Function
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