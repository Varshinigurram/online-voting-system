// Auto-detect API URL based on environment
let API_URL;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000/api';
} else if (window.location.hostname === 'yourdomain.com') {
    API_URL = 'https://api.yourdomain.com/api';
} else {
    // Default for production
    API_URL = `${window.location.protocol}//${window.location.hostname}/api`;
}

console.log('🔗 API URL:', API_URL);

// Export for use in other files
window.API_URL = API_URL;