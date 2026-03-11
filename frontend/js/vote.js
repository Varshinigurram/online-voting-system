const API_URL = 'http://localhost:5000';
let selectedCandidateId = null;
let hasVoted = false;

document.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    loadVoterInfo();
    loadCandidates();
});

function checkAuth() {
    const token = localStorage.getItem('voterToken');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

function loadVoterInfo() {
    const voter = JSON.parse(localStorage.getItem('voterUser') || '{}');
    document.getElementById('voterName').textContent = voter.name || 'Voter';
}

async function loadCandidates() {
    try {
        const token = checkAuth();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/candidates`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load candidates');
        }

        if (data.user && data.user.hasVoted) {
            hasVoted = true;
            document.getElementById('votingGrid').style.display = 'none';
            document.getElementById('submitSection').style.display = 'none';
            document.getElementById('alreadyVoted').style.display = 'block';
        } else {
            displayCandidates(data.candidates);
        }

    } catch (error) {
        console.error(error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

function displayCandidates(candidates) {
    const grid = document.getElementById('votingGrid');
    grid.innerHTML = candidates.map(c => `
        <div class="candidate-card" onclick="selectCandidate('${c.id}', this)">
            <div class="candidate-image">
                <img src="${c.imageUrl}" alt="${c.name}">
            </div>
            <div class="candidate-content">
                <h3 class="candidate-name">${c.name}</h3>
                <p class="candidate-party">
                    <span>${c.partySymbol}</span>
                    ${c.party}
                </p>
                <p class="candidate-bio">${(c.biography || '').substring(0, 80)}...</p>
                <div class="vote-checkbox">
                    <input type="radio" name="candidate" value="${c.id}">
                    <label>Select</label>
                </div>
            </div>
        </div>
    `).join('');
}

function selectCandidate(id, element) {
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedCandidateId = id;
    document.getElementById('submitSection').style.display = 'block';
    showToast(`✅ Selected candidate`, 'success');
}

async function submitVote() {
    if (!selectedCandidateId) {
        showToast('❌ Please select a candidate', 'error');
        return;
    }

    if (!confirm('Submit your vote? This cannot be changed.')) {
        return;
    }

    try {
        const token = checkAuth();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/vote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidateId: selectedCandidateId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to submit vote');
        }

        showToast('✅ Vote submitted successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 1500);

    } catch (error) {
        console.error(error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

function showToast(message, type) {
    const container = document.getElementById('toastContainer');
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

function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        showToast('✅ Logged out', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}