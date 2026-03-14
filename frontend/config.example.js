// Copy this file to config.js and edit with your values if needed.
// The default auto-detection in js/config.js handles most cases.

// Auto-detect API URL based on environment
let API_URL;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000';
} else {
    // Production: assumes API is served at the same domain
    API_URL = `${window.location.protocol}//${window.location.hostname}`;
}

console.log('🔗 API URL:', API_URL);

// Make available globally
window.API_URL = API_URL;
