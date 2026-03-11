/**
 * Statistics Export - COMPLETE FIX
 */

const ADMIN_API_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadAdminInfo();
    loadStatistics();
});

/**
 * Load Statistics
 */
async function loadStatistics() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        const response = await fetch(`${ADMIN_API_URL}/api/admin/statistics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.candidates) {
            displayStatistics(data);
        }

    } catch (error) {
        console.error('❌ Load error:', error);
    }
}

/**
 * Display Statistics
 */
function displayStatistics(data) {
    const tbody = document.getElementById('statisticsTableBody');
    if (!tbody) return;

    const total = data.candidates.reduce((sum, c) => sum + c.votes, 0);

    tbody.innerHTML = data.candidates.map((c, i) => {
        const percent = total > 0 ? Math.round((c.votes / total) * 100) : 0;
        return `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.partySymbol} ${c.party}</td>
                <td><strong>${c.votes}</strong></td>
                <td><strong>${percent}%</strong></td>
                <td><div style="width: 100px; height: 6px; background: #ddd; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);"></div>
                </div></td>
            </tr>
        `;
    }).join('');
}

/**
 * Export as CSV
 */
async function exportAsCSV() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        console.log("📊 Exporting CSV...");
        showAdminToast('📥 Downloading CSV...', 'info');

        const response = await fetch(`${ADMIN_API_URL}/api/admin/statistics/export/csv`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        downloadBlob(blob, 'statistics.csv');

        console.log("✅ CSV downloaded");
        showAdminToast('✅ CSV downloaded', 'success');

    } catch (error) {
        console.error('❌ Export error:', error);
        showAdminToast(`❌ ${error.message}`, 'error');
    }
}

/**
 * Export as JSON
 */
async function exportAsJSON() {
    try {
        const token = checkAdminAuth();
        if (!token) return;

        console.log("📊 Exporting JSON...");
        showAdminToast('📥 Downloading JSON...', 'info');

        const response = await fetch(`${ADMIN_API_URL}/api/admin/statistics/export/json`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        downloadBlob(blob, 'statistics.json');

        console.log("✅ JSON downloaded");
        showAdminToast('✅ JSON downloaded', 'success');

    } catch (error) {
        console.error('❌ Export error:', error);
        showAdminToast(`❌ ${error.message}`, 'error');
    }
}

/**
 * Download Blob
 */
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log("✅ File downloaded:", filename);
}

/**
 * Refresh Statistics
 */
function refreshStatistics() {
    showAdminToast('🔄 Refreshing...', 'info');
    loadStatistics();
}