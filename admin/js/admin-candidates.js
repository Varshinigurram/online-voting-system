/**
 * Candidates Management - COMPLETE FIX
 */

const ADMIN_API_URL = window.ADMIN_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 10;

let allCandidates = [];
let filteredCandidates = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadCandidates();
});

/**
 * Load Candidates from Server
 */
async function loadCandidates() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        console.log("📋 Loading candidates...");

        const response = await fetch(`${ADMIN_API_URL}/api/admin/candidates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Response status:", response.status);

        const data = await response.json();
        console.log("Response data:", data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load candidates');
        }

        allCandidates = data.candidates || [];
        filteredCandidates = [...allCandidates];
        currentPage = 1;

        console.log("✅ Loaded candidates:", allCandidates.length);

        displayCandidates();

    } catch (error) {
        console.error('❌ Load error:', error);
        showAdminToast(`❌ ${error.message}`, 'error');
    }
}

/**
 * Display Candidates
 */
function displayCandidates() {
    const tbody = document.getElementById('candidatesTableBody');
    const emptyState = document.getElementById('emptyState');

    if (!tbody) return;

    if (filteredCandidates.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredCandidates.slice(start, end);

    tbody.innerHTML = pageData.map(c => `
        <tr>
            <td><img src="${c.imageUrl}" alt="${c.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
            <td><strong>${c.name}</strong></td>
            <td><span>${c.partySymbol} ${c.party}</span></td>
            <td>${(c.biography || '').substring(0, 50)}...</td>
            <td><strong>${c.votes}</strong></td>
            <td><span class="badge badge-success">${c.status}</span></td>
            <td>
                <button onclick="editCandidate('${c.id}')" class="btn btn-small">✏️</button>
                <button onclick="deleteCandidate('${c.id}')" class="btn btn-small">🗑️</button>
            </td>
        </tr>
    `).join('');

    // Pagination
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === currentPage ? 'active' : '';
            btn.onclick = () => {
                currentPage = i;
                displayCandidates();
            };
            pagination.appendChild(btn);
        }
    }
}

/**
 * Search Candidates
 */
function searchCandidates() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    filteredCandidates = allCandidates.filter(c =>
        c.name.toLowerCase().includes(search) || c.party.toLowerCase().includes(search)
    );
    currentPage = 1;
    displayCandidates();
}

/**
 * Filter Candidates
 */
function filterCandidates() {
    const party = document.getElementById('partyFilter')?.value;
    filteredCandidates = party 
        ? allCandidates.filter(c => c.party === party)
        : [...allCandidates];
    currentPage = 1;
    displayCandidates();
}

/**
 * Delete Candidate
 */
async function deleteCandidate(id) {
    if (!confirm('Delete this candidate?')) return;

    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/api/admin/candidates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Delete failed');
        }

        showAdminToast('✅ Candidate deleted', 'success');
        loadCandidates();

    } catch (error) {
        console.error('❌ Delete error:', error);
        showAdminToast(`❌ ${error.message}`, 'error');
    }
}

/**
 * Edit Candidate
 */
function editCandidate(id) {
    alert('Edit feature coming soon');
}