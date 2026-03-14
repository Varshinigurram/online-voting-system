// Auto-detect API URL based on environment
let ADMIN_API_URL;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    ADMIN_API_URL = 'http://localhost:5000';
} else {
    ADMIN_API_URL = `${window.location.protocol}//${window.location.hostname}`;
}

console.log('🔗 Admin API URL:', ADMIN_API_URL);

// Make available globally
window.ADMIN_API_URL = ADMIN_API_URL;
