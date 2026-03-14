/**
 * Add Candidate Module - FINAL MERGED VERSION
 * All features working:
 * - File upload
 * - Drag & Drop
 * - URL preview
 * - Form validation
 * - Character counter
 * - Party symbol display
 * - Secure submission
 */

const ADMIN_API_URL = (window.ADMIN_API_URL || 'http://localhost:5000') + '/api/admin';
let selectedImageFile = null;

/**
 * Initialize Page
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    setupForm();
    setupImageUpload();
});

/**
 * Setup Form
 */
function setupForm() {
    const form = document.getElementById('addCandidateForm');

    if (form) {
        form.addEventListener('submit', submitForm);
    }

    // Biography character counter
    const biography = document.getElementById('biography');
    const charCount = document.getElementById('charCount');

    if (biography && charCount) {
        biography.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const max = 500;

            if (count > max) {
                e.target.value = e.target.value.substring(0, max);
            }

            charCount.textContent = `${e.target.value.length}/${max}`;
        });
    }
}

/**
 * Setup Image Upload
 */
function setupImageUpload() {

    const uploadArea = document.getElementById('photoUploadArea');
    const fileInput = document.getElementById('candidatePhoto');

    if (!uploadArea || !fileInput) {
        console.error('Upload elements missing');
        return;
    }

    // Click upload
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag over
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.backgroundColor = 'rgba(59,130,246,0.1)';
    });

    // Drag leave
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--admin-border)';
        uploadArea.style.backgroundColor = 'transparent';
    });

    // Drop file
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();

        uploadArea.style.borderColor = 'var(--admin-border)';
        uploadArea.style.backgroundColor = 'transparent';

        if (e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    // File select
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
}

/**
 * Handle Image Upload
 */
function handleImageUpload(file) {

    console.log("📸 Image selected:", file.name, file.size);

    const allowedTypes = ['image/jpeg','image/png','image/gif','image/webp'];

    if (!allowedTypes.includes(file.type)) {
        showAdminToast('Invalid image type. Use PNG, JPG, GIF, WebP', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showAdminToast('Image must be under 5MB', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {

        const preview = document.getElementById('photoPreview');
        const placeholder = document.getElementById('uploadPlaceholder');

        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (placeholder) {
            placeholder.style.display = 'none';
        }

        selectedImageFile = file;

        console.log("✅ Image ready for upload");
    };

    reader.readAsDataURL(file);
}

/**
 * Preview Image URL
 */
function previewPhotoUrl() {

    const input = document.getElementById('photoUrl');
    const preview = document.getElementById('urlPhotoPreview');

    if (!input || !preview) return;

    const url = input.value.trim();

    if (!url) {
        preview.style.display = 'none';
        return;
    }

    if (!isValidUrl(url)) {
        showAdminToast('Invalid URL format', 'error');
        preview.style.display = 'none';
        return;
    }

    preview.src = url;
    preview.style.display = 'block';

    preview.onerror = () => {
        preview.style.display = 'none';
        showAdminToast('Image failed to load', 'error');
    };
}

/**
 * Validate URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * Update Party Symbol Display
 */
function updatePartySymbolDisplay() {

    const partySelect = document.getElementById('partyName');
    const symbolDisplay = document.getElementById('partySymbolDisplay');

    if (!partySelect || !symbolDisplay) return;

    const symbols = {
        'Independent': '🔷',
        'INC': '🦁',
        'BJP': '👑',
        'BRS': '🪷',
        'Independent': '👑'
    };

    symbolDisplay.textContent = symbols[partySelect.value] || '🏛️';
}

/**
 * Submit Form
 */
async function submitForm(e) {

    e.preventDefault();

    try {

        const token = checkAdminAuth();
        if (!token) return;

        const name = document.getElementById('candidateName').value.trim();
        const party = document.getElementById('partyName').value.trim();
        const email = document.getElementById('candidateEmail').value.trim();
        const phone = document.getElementById('candidatePhone').value.trim();
        const biography = document.getElementById('biography').value.trim();
        const experience = document.getElementById('experience').value.trim();
        const policies = document.getElementById('policies').value.trim();
        const photoUrl = document.getElementById('photoUrl').value.trim();

        // Basic validation
        if (!name || name.length < 3) {
            showAdminToast('Candidate name must be at least 3 characters', 'error');
            return;
        }

        if (!party) {
            showAdminToast('Please select a party', 'error');
            return;
        }

        if (!biography || biography.length < 20) {
            showAdminToast('Biography must be at least 20 characters', 'error');
            return;
        }

        if (!selectedImageFile && !photoUrl) {
            showAdminToast('Upload an image or provide image URL', 'error');
            return;
        }

        showLoadingState(true);

        const formData = new FormData();

        formData.append('name', name);
        formData.append('party', party);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('biography', biography);
        formData.append('experience', experience);
        formData.append('policies', policies);

        if (selectedImageFile) {
            formData.append('image', selectedImageFile);
            console.log("📤 Uploading image:", selectedImageFile.name);
        } 
        else if (photoUrl) {
            formData.append('imageUrl', photoUrl);
        }

        console.log("🚀 Sending candidate to server...");

        const response = await fetch(`${ADMIN_API_URL}/candidates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to add candidate');
        }

        showAdminToast('✅ Candidate added successfully!', 'success');

        setTimeout(() => {
            window.location.href = 'candidates.html';
        }, 1500);

    }
    catch (error) {

        console.error("❌ Error:", error);

        showAdminToast(error.message || 'Server error', 'error');

        showLoadingState(false);
    }
}

/**
 * Loading State
 */
function showLoadingState(show) {

    const form = document.getElementById('addCandidateForm');
    const loading = document.getElementById('loadingState');

    if (show) {
        if (form) form.style.display = 'none';
        if (loading) loading.style.display = 'block';
    } 
    else {
        if (form) form.style.display = 'block';
        if (loading) loading.style.display = 'none';
    }
}