// ============================================================
// Project Constants: Priorities, Statuses, Health (RAG)
// ============================================================

// PRIORITIES — numeric 1-4 (critical to low) + N/A for BAU/Maintenance/Overhead
const PRIORITY_LEVELS = {
    1: { value: 1, label_pl: 'Krytyczny', label_en: 'Critical', color: '#ef4444', cssClass: 'p1' },
    2: { value: 2, label_pl: 'Wysoki', label_en: 'High', color: '#f59e0b', cssClass: 'p2' },
    3: { value: 3, label_pl: 'Średni', label_en: 'Medium', color: '#00BAC7', cssClass: 'p3' },
    4: { value: 4, label_pl: 'Niski', label_en: 'Low', color: '#cbd5e1', cssClass: 'p4' },
    'N/A': { value: null, label_pl: 'Bez priorytetu', label_en: 'N/A', color: '#f1f5f9', cssClass: 'pna', note_pl: 'BAU/Maintenance/Overhead', note_en: 'BAU/Maintenance/Overhead' }
};

// Get priority label by value and language
function getPriorityLabel(priorityValue, lang = 'pl') {
    const priority = PRIORITY_LEVELS[priorityValue];
    if (!priority) return priorityValue;
    return lang === 'pl' ? priority.label_pl : priority.label_en;
}

// STATUSES — 7 defined states with lifecycle
// Planned → In Progress → (Blocked | At Risk | On Hold) → Done → Archived
const STATUSES = {
    'planned': {
        value: 'planned',
        label_pl: 'Zaplanowany',
        label_en: 'Planned',
        color: '#8b5cf6',
        cssClass: 'planned',
        icon: '📋',
        order: 1,
        description_pl: 'Projekt zaplanowany, oczekiwanie na start',
        description_en: 'Project planned, awaiting start'
    },
    'in-progress': {
        value: 'in-progress',
        label_pl: 'W toku',
        label_en: 'In Progress',
        color: '#00BAC7',
        cssClass: 'in-progress',
        icon: '🔄',
        order: 2,
        description_pl: 'Projekt w realizacji',
        description_en: 'Project in execution'
    },
    'blocked': {
        value: 'blocked',
        label_pl: 'Zablokowany',
        label_en: 'Blocked',
        color: '#ef4444',
        cssClass: 'blocked',
        icon: '🚫',
        order: 3,
        description_pl: 'Projekt zablokowany, wymaga interwencji',
        description_en: 'Project blocked, requires intervention'
    },
    'at-risk': {
        value: 'at-risk',
        label_pl: 'Zagrożony',
        label_en: 'At Risk',
        color: '#f59e0b',
        cssClass: 'at-risk',
        icon: '⚠️',
        order: 3,
        description_pl: 'Projekt zagrożony, wymaga eskalacji',
        description_en: 'Project at risk, requires escalation'
    },
    'on-hold': {
        value: 'on-hold',
        label_pl: 'Wstrzymany',
        label_en: 'On Hold',
        color: '#f59e0b',
        cssClass: 'on-hold',
        icon: '⏸️',
        order: 3,
        description_pl: 'Projekt wstrzymany, czeka na decyzję',
        description_en: 'Project on hold, awaiting decision'
    },
    'done': {
        value: 'done',
        label_pl: 'Ukończony',
        label_en: 'Done',
        color: '#10b981',
        cssClass: 'done',
        icon: '✅',
        order: 4,
        description_pl: 'Projekt ukończony — auto-archiwizacja za 7 dni',
        description_en: 'Project complete — auto-archiving in 7 days',
        autoArchiveAfterDays: 7
    },
    'archived': {
        value: 'archived',
        label_pl: 'Zarchiwizowany',
        label_en: 'Archived',
        color: '#94a3b8',
        cssClass: 'archived',
        icon: '📦',
        order: 5,
        description_pl: 'Projekt zarchiwizowany',
        description_en: 'Project archived'
    }
};

// Get status object by value
function getStatus(statusValue) {
    return STATUSES[statusValue] || STATUSES['planned'];
}

// Get status label by value and language
function getStatusLabel(statusValue, lang = 'pl') {
    const status = getStatus(statusValue);
    return lang === 'pl' ? status.label_pl : status.label_en;
}

// Get all status values in order
function getStatusValues(includeArchived = true) {
    const statuses = Object.values(STATUSES)
        .sort((a, b) => a.order - b.order)
        .map(s => s.value);
    return includeArchived ? statuses : statuses.filter(s => s !== 'archived');
}

// HEALTH (RAG) — Red/Amber/Green for steering/reporting
const HEALTH_LEVELS = {
    'green': {
        value: 'green',
        label_pl: 'Zielony',
        label_en: 'Green',
        description_pl: 'Projekt na torze, brak problemów',
        description_en: 'Project on track, no issues',
        color: '#10b981',
        icon: '🟢'
    },
    'amber': {
        value: 'amber',
        label_pl: 'Żółty',
        label_en: 'Amber',
        description_pl: 'Projekt ma wyzwania, wymaga monitorowania',
        description_en: 'Project has challenges, requires monitoring',
        color: '#f59e0b',
        icon: '🟡'
    },
    'red': {
        value: 'red',
        label_pl: 'Czerwony',
        label_en: 'Red',
        description_pl: 'Projekt ma poważne problemy',
        description_en: 'Project has serious issues',
        color: '#ef4444',
        icon: '🔴'
    }
};

// Get health object by value
function getHealth(healthValue) {
    return HEALTH_LEVELS[healthValue] || HEALTH_LEVELS['green'];
}

// Get health label by value and language
function getHealthLabel(healthValue, lang = 'pl') {
    const health = getHealth(healthValue);
    return lang === 'pl' ? health.label_pl : health.label_en;
}

// Get all health values
function getHealthValues() {
    return Object.keys(HEALTH_LEVELS);
}

// ============================================================
// PROJECT CATEGORIES — for capacity allocation
// ============================================================
const PROJECT_CATEGORIES = {
    'project': {
        value: 'project',
        label_pl: 'Projekt',
        label_en: 'Project',
        allowPriority: true,
        defaultPriority: 3
    },
    'bau': {
        value: 'bau',
        label_pl: 'BAU & Maintenance',
        label_en: 'BAU & Maintenance',
        allowPriority: false,
        defaultPriority: 'N/A'
    },
    'overhead': {
        value: 'overhead',
        label_pl: 'Cele IT / Szkolenia',
        label_en: 'IT Goals / Training',
        allowPriority: false,
        defaultPriority: 'N/A'
    },
    'maintenance': {
        value: 'maintenance',
        label_pl: 'Test Automation',
        label_en: 'Test Automation',
        allowPriority: false,
        defaultPriority: 'N/A'
    }
};

function getCategory(categoryValue) {
    return PROJECT_CATEGORIES[categoryValue] || PROJECT_CATEGORIES['project'];
}

function getCategoryLabel(categoryValue, lang = 'pl') {
    const cat = getCategory(categoryValue);
    return lang === 'pl' ? cat.label_pl : cat.label_en;
}

// ============================================================
// VALIDATION & MIGRATION HELPERS
// ============================================================

/**
 * Validate and normalize priority value
 * @param {number|string} value - Priority value (numeric 0-37+ or 'N/A')
 * @param {string} category - Project category (determines allowed priorities)
 * @returns {number|string} Normalized priority value (kept as-is if numeric, or 'N/A')
 */
function normalizePriority(value, category = 'project') {
    // Non-project categories always use N/A
    if (category && category !== 'project') {
        return 'N/A';
    }

    // N/A is valid
    if (value === 'N/A') return 'N/A';

    // If numeric (0-37+), keep as-is
    const numVal = parseInt(value);
    if (!isNaN(numVal) && numVal >= 0) return numVal;

    // Legacy text-based priorities → keep original numeric if available
    const legacyMap = {
        'critical': 1, 'Critical': 1,
        'high': 4, 'High': 4,
        'medium': 11, 'Medium': 11,
        'low': 20, 'Low': 20
    };
    if (legacyMap[value]) return legacyMap[value];

    // Default to N/A if cannot determine
    return 'N/A';
}

/**
 * Validate and normalize status value
 * @param {string} value - Status value
 * @returns {string} Normalized status value
 */
function normalizeStatus(value) {
    // Already valid
    if (STATUSES[value]) return value;

    // Legacy conversion
    const legacyMap = {
        'in_progress': 'in-progress',
        'inprogress': 'in-progress',
        'at_risk': 'at-risk',
        'atrisk': 'at-risk',
        'on_hold': 'on-hold',
        'onhold': 'on-hold',
        'archival': 'archived',
        'archive': 'archived'
    };
    if (legacyMap[value]) return legacyMap[value];

    // Default to planned
    return 'planned';
}

/**
 * Validate and normalize health value
 * @param {string} value - Health value
 * @returns {string} Normalized health value
 */
function normalizeHealth(value) {
    // Already valid
    if (HEALTH_LEVELS[value]) return value;

    // Default to green
    return 'green';
}

/**
 * Validate project object
 * @param {object} project - Project object
 * @returns {object} Same project with normalized fields
 */
function validateProject(project) {
    return {
        ...project,
        priority: normalizePriority(project.priority, project.category),
        status: normalizeStatus(project.status),
        health: normalizeHealth(project.health || 'green')
    };
}

// ============================================================
// RISK & NOTE MANAGEMENT — structured data for risks and notes
// ============================================================

// Risk levels for impact/probability assessment
const RISK_LEVELS = {
    'low': {
        value: 'low',
        label_pl: 'Niski',
        label_en: 'Low',
        color: '#10b981',
        icon: '🟢'
    },
    'medium': {
        value: 'medium',
        label_pl: 'Średni',
        label_en: 'Medium',
        color: '#f59e0b',
        icon: '🟡'
    },
    'high': {
        value: 'high',
        label_pl: 'Wysoki',
        label_en: 'High',
        color: '#ef4444',
        icon: '🔴'
    }
};

// Risk statuses
const RISK_STATUSES = {
    'open': { value: 'open', label_pl: 'Otwarty', label_en: 'Open', icon: '📌' },
    'in-progress': { value: 'in-progress', label_pl: 'W działaniu', label_en: 'In Progress', icon: '🔄' },
    'mitigated': { value: 'mitigated', label_pl: 'Złagodzony', label_en: 'Mitigated', icon: '✅' },
    'closed': { value: 'closed', label_pl: 'Zamknięty', label_en: 'Closed', icon: '🗂️' }
};

// Note types
const NOTE_TYPES = {
    'update': { value: 'update', label_pl: 'Update', label_en: 'Update', icon: '📝', color: '#3b82f6' },
    'blocker': { value: 'blocker', label_pl: 'Blocker', label_en: 'Blocker', icon: '🚫', color: '#ef4444' },
    'dependency': { value: 'dependency', label_pl: 'Zależność', label_en: 'Dependency', icon: '🔗', color: '#f59e0b' },
    'decision': { value: 'decision', label_pl: 'Decyzja', label_en: 'Decision', icon: '⚡', color: '#8b5cf6' },
    'risk': { value: 'risk', label_pl: 'Ryzyko', label_en: 'Risk', icon: '⚠️', color: '#ef4444' }
};

/**
 * Create a new risk object
 */
function createRisk() {
    return {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        owner: '',
        impact: 'medium',
        probability: 'medium',
        mitigation: '',
        dueDate: '',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Create a new note object
 */
function createNote() {
    return {
        id: Math.random().toString(36).substr(2, 9),
        content: '',
        author: getCurrentUser ? getCurrentUser() : 'Anonim',
        type: 'update',
        createdAt: new Date().toISOString()
    };
}

// ============================================================
// PROJECT TEMPLATE (for new projects)
// ============================================================

function createProjectTemplate() {
    return {
        id: null,
        priority: 3,
        status: 'planned',
        health: 'green',
        name: '',
        businessOwner: '',
        lead: '',
        delivery: '',
        teams: [],
        risks: [],  // Changed from string to array of risk objects
        notes: [],  // Array of note objects with author, type, etc.
        allocations: {},
        category: 'project',
        createdAt: new Date().toISOString(),
        doneAt: null
    };
}

// Export constants for use in app.js and other modules
// (in browser environment, these are global)
