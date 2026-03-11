/**
 * Party Symbols Configuration
 * Central registry for all political parties with symbols
 */

const PARTY_SYMBOLS = {
    'Independent': {
        symbol: '🔷',
        color: '#6366f1',
        code: 'IND',
        description: 'Independent Candidate'
    },
    'INC': {
        symbol: '🦁',
        color: '#2563eb',
        code: 'INC',
        description: 'Indian National Congress'
    },
    'BJP': {
        symbol: '🔶',
        color: '#f97316',
        code: 'BJP',
        description: 'Bharatiya Janata Party'
    },
    'BRS': {
        symbol: '⭐',
        color: '#dc2626',
        code: 'BRS',
        description: 'Bharat Rashtra Samithi'
    },
    'Green Party': {
        symbol: '🌿',
        color: '#16a34a',
        code: 'GPT',
        description: 'Green Party'
    },
    'Libertarian Party': {
        symbol: '🗽',
        color: '#8b5cf6',
        code: 'LBT',
        description: 'Libertarian Party'
    },
    'AAPL': {
        symbol: '🧡',
        color: '#ea580c',
        code: 'AAPL',
        description: 'Aam Aadmi Party'
    },
    'DMK': {
        symbol: '🟢',
        color: '#059669',
        code: 'DMK',
        description: 'Dravida Munnetra Kazhagam'
    },
    'AIADMK': {
        symbol: '⚫',
        color: '#1f2937',
        code: 'ADMK',
        description: 'All India Anna Dravida Munnetra Kazhagam'
    },
    'SP': {
        symbol: '🔴',
        color: '#ef4444',
        code: 'SP',
        description: 'Samajwadi Party'
    },
    'BSP': {
        symbol: '🟣',
        color: '#7c3aed',
        code: 'BSP',
        description: 'Bahujan Samaj Party'
    },
    'NCP': {
        symbol: '🟡',
        color: '#fbbf24',
        code: 'NCP',
        description: 'Nationalist Congress Party'
    }
};

/**
 * Get Party Symbol
 */
function getPartySymbol(partyName) {
    return PARTY_SYMBOLS[partyName]?.symbol || '🏛️';
}

/**
 * Get Party Color
 */
function getPartyColor(partyName) {
    return PARTY_SYMBOLS[partyName]?.color || '#6b7280';
}

/**
 * Get Party Details
 */
function getPartyDetails(partyName) {
    return PARTY_SYMBOLS[partyName] || {
        symbol: '🏛️',
        color: '#6b7280',
        code: 'OTH',
        description: 'Other Party'
    };
}

/**
 * Get All Parties
 */
function getAllParties() {
    return Object.entries(PARTY_SYMBOLS).map(([name, details]) => ({
        name,
        ...details
    }));
}

/**
 * Create Party Badge HTML
 */
function createPartyBadge(partyName) {
    const party = getPartyDetails(partyName);
    return `
        <span class="party-badge" style="background-color: ${party.color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span style="font-size: 16px;">${party.symbol}</span>
            <span>${partyName}</span>
        </span>
    `;
}