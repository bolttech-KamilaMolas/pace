/**
 * SHARED CONSTANTS
 * Używane przez wszystkie moduły
 */

// ===== BASE CONFIGURATION =====
const BASE_DATE = new Date(2026, 0, 5); // Monday, Jan 5, 2026
const TOTAL_WEEKS = 52;
const FRIDAY_FACTOR = 0.65; // Friday productivity factor

// ===== TEAMS =====
const TEAMS = [
    { id: 'alf', name: 'ALF', color: '#3b82f6', base_capacity: 40 },
    { id: 'warex', name: 'WAREX', color: '#10b981', base_capacity: 40 },
    { id: 'optimus', name: 'OPTIMUS', color: '#f59e0b', base_capacity: 40 },
    { id: 'mash', name: 'MASH', color: '#8b5cf6', base_capacity: 40 },
    { id: 'magento', name: 'MAGENTO', color: '#ec4899', base_capacity: 40 },
    { id: 'qa', name: 'QA', color: '#14b8a6', base_capacity: 40 },
    { id: 'it_delivery', name: 'IT DELIVERY', color: '#64748b', base_capacity: 40 }
];

// ===== ROLES =====
const ROLES = [
    { id: 'lead', name: 'Lead' },
    { id: 'senior', name: 'Senior' },
    { id: 'mid', name: 'Mid' },
    { id: 'junior', name: 'Junior' },
    { id: 'intern', name: 'Intern' }
];

const ROLE_SORT_ORDER = ['lead', 'senior', 'mid', 'junior', 'intern'];

// ===== PRIORITIES =====
const PRIORITY_LEVELS = {
    0: { name: 'Critical', color: '#ef4444', range: '0-3' },
    1: { name: 'High', color: '#f59e0b', range: '4-10' },
    2: { name: 'Medium', color: '#00BAC7', range: '11-20' },
    3: { name: 'High-Medium', color: '#8b5cf6', range: '21-30' },
    4: { name: 'Lower', color: '#10b981', range: '31+' }
};

function getPriorityClass(priority) {
    if (priority <= 3) return 'p0';
    if (priority <= 10) return 'p1';
    if (priority <= 20) return 'p2';
    if (priority <= 30) return 'p3';
    return 'p4';
}

// ===== PROJECT CATEGORIES =====
const PROJECT_CATEGORIES = {
    'project': 'Project',
    'bau': 'BAU (Business as Usual)',
    'maintenance': 'Maintenance',
    'overhead': 'Overhead',
    'scrum': 'Scrum Activities',
    'other': 'Other'
};

// ===== STATUS CHIPS =====
const STATUS_OPTIONS = ['not_started', 'in-progress', 'blocked', 'done', 'on-hold', 'at-risk'];
const HEALTH_OPTIONS = ['green', 'amber', 'red'];

// ===== DATE UTILITIES =====
function formatDate(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}`;
}

function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekStart(weekIdx) {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + weekIdx * 7);
    return d;
}

function getWeekRange(weekIdx) {
    const start = getWeekStart(weekIdx);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
}

function parseSprintDates(dateStr) {
    // Format: "2026-01-06 to 2026-01-17"
    const [startStr, endStr] = dateStr.split(' to ').map(s => s.trim());
    const start = new Date(startStr);
    const end = new Date(endStr);
    return { start, end };
}

// ===== PUBLIC HOLIDAYS 2026 =====
const PUBLIC_HOLIDAYS = {
    '2026': [
        { date: '2026-01-01', name: 'New Year' },
        { date: '2026-04-19', name: 'Easter' },
        { date: '2026-05-01', name: 'Labour Day' },
        { date: '2026-05-19', name: 'Pentecost' },
        { date: '2026-08-15', name: 'Assumption' },
        { date: '2026-11-01', name: 'All Saints' },
        { date: '2026-11-11', name: 'Independence Day' },
        { date: '2026-12-25', name: 'Christmas' }
    ]
};

// ===== COLOR PALETTE (Bolttech Brand) =====
const COLORS = {
    navy: '#170F4F',
    cyan: '#00BAC7',
    white: '#ffffff',
    grey50: '#f8f9fc',
    grey100: '#f1f3f8',
    grey200: '#e2e5ef',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6'
};

// Export if in module context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BASE_DATE, TOTAL_WEEKS, FRIDAY_FACTOR,
        TEAMS, ROLES, ROLE_SORT_ORDER,
        PRIORITY_LEVELS, getPriorityClass,
        PROJECT_CATEGORIES, STATUS_OPTIONS, HEALTH_OPTIONS,
        formatDate, formatDateKey, getWeekStart, getWeekRange, parseSprintDates,
        PUBLIC_HOLIDAYS, COLORS
    };
}
