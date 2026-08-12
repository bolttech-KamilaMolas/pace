/**
 * MOCK DATA FOR SQUAD LEAD
 * Test data dla standalone testing
 */

// ===== PROJECTS (Rzeczywiste projekty z app.js) =====
// Te dane będą skopiowane z app.js → DEFAULT_PROJECTS
const MOCK_PROJECTS = [
    // Sample - będą zastąpione danymi z app.js
    {
        id: 4,
        name: "BoltPay/PayU payments integration",
        status: "in-progress",
        teams: ['ALF', 'MASH'],
        category: 'project',
        allocations: {
            'alf': { 0: 6, 1: 6, 2: 4, 3: 4 },
            'mash': { 0: 4, 1: 4, 2: 2, 3: 2 }
        }
    },
    {
        id: 11,
        name: "iMad Multibrand - PHASE 2",
        status: "in-progress",
        teams: ['ALF', 'MASH', 'MAGENTO'],
        category: 'project',
        allocations: {
            'alf': { 0: 8, 1: 8, 2: 8, 3: 6 },
            'mash': { 0: 4, 1: 4, 2: 4, 3: 4 },
            'magento': { 0: 6, 1: 6, 2: 6, 3: 6 }
        }
    },
    {
        id: 15,
        name: "MM Spain (rental)",
        status: "in-progress",
        teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO'],
        category: 'project',
        allocations: {
            'alf': { 0: 8, 1: 8, 2: 6, 3: 6 },
            'warex': { 0: 6, 1: 6, 2: 4, 3: 4 },
            'optimus': { 0: 6, 1: 6, 2: 4, 3: 4 },
            'mash': { 0: 4, 1: 4, 2: 2, 3: 2 },
            'magento': { 0: 4, 1: 4, 2: 4, 3: 4 }
        }
    },
    {
        id: 100,
        name: "BAU & Maintenance",
        status: "in-progress",
        teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO'],
        category: 'bau',
        allocations: {
            'alf': { 0: 2, 1: 2, 2: 2, 3: 2 },
            'warex': { 0: 2, 1: 2, 2: 2, 3: 2 },
            'optimus': { 0: 2, 1: 2, 2: 2, 3: 2 },
            'mash': { 0: 2, 1: 2, 2: 2, 3: 2 },
            'magento': { 0: 2, 1: 2, 2: 2, 3: 2 }
        }
    },
    {
        id: 104,
        name: "Test Automation",
        status: "in-progress",
        teams: ['QA'],
        category: 'maintenance',
        allocations: {
            'qa': { 0: 4, 1: 4, 2: 4, 3: 4 }
        }
    },
    {
        id: 102,
        name: "Cele IT",
        status: "in-progress",
        teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA', 'IT_DELIVERY'],
        category: 'overhead',
        allocations: {
            'alf': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'warex': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'optimus': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'mash': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'magento': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'qa': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'it_delivery': { 0: 1, 1: 1, 2: 1, 3: 1 }
        }
    },
    {
        id: 103,
        name: "Szkolenia / Development",
        status: "in-progress",
        teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA'],
        category: 'scrum',
        allocations: {
            'alf': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'warex': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'optimus': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'mash': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'magento': { 0: 1, 1: 1, 2: 1, 3: 1 },
            'qa': { 0: 1, 1: 1, 2: 1, 3: 1 }
        }
    }
];

// ===== PEOPLE (Rzeczywisty team z app.js) =====
const MOCK_PEOPLE = [
    // ALF
    { name: 'Kamila Molas', team: 'alf', role: 'Squad Lead', role_display: 'Squad Lead' },
    { name: 'Mikołaj Banaszkiewicz', team: 'alf', role: 'BE Developer', role_display: 'BE Developer' },
    { name: 'Michał Godziszewski', team: 'alf', role: 'FE Developer', role_display: 'FE Developer' },
    { name: 'Marcin Godziszewski', team: 'alf', role: 'BE Developer', role_display: 'BE Developer' },
    
    // WAREX
    { name: 'Marcin Wrzesiński', team: 'warex', role: 'Squad Lead', role_display: 'Squad Lead' },
    
    // OPTIMUS
    { name: 'Tomasz Lupa', team: 'optimus', role: 'Squad Lead', role_display: 'Squad Lead' },
    { name: 'Tomasz Kułakowski', team: 'optimus', role: 'BE Developer', role_display: 'BE Developer' },
    { name: 'Monika Zarzycka', team: 'optimus', role: 'System Analyst', role_display: 'System Analyst' },
    
    // MASH
    { name: 'Paweł Naworol', team: 'mash', role: 'Engineering Manager', role_display: 'Engineering Manager' },
    { name: 'Paweł Szymański', team: 'mash', role: 'BE Developer', role_display: 'BE Developer' },
    
    // MAGENTO
    { name: 'MAGENTO Team', team: 'magento', role: 'BE Developer', role_display: 'BE Developer' },
    
    // QA
    { name: 'QA Team Member 1', team: 'qa', role: 'QA', role_display: 'QA' },
    
    // IT DELIVERY
    { name: 'IT DELIVERY Lead', team: 'it_delivery', role: 'Squad Lead', role_display: 'Squad Lead' }
];

// ===== SPRINT GOALS =====
const MOCK_SPRINT_GOALS = {
    'sprint-1': {
        'alf': [
            { status: 'completed', text: 'KAP - Dynamic Pricing complete' },
            { status: 'in-progress', text: 'MM Spain rental integration' },
            { status: 'blocked', text: 'Waiting on WAREX data sync' }
        ],
        'warex': [
            { status: 'in-progress', text: 'Generic Warranty Product' },
            { status: 'in-progress', text: 'API between Warex i IRIS' },
            { status: 'planned', text: 'Mirror check updates' }
        ],
        'optimus': [
            { status: 'in-progress', text: 'BoltCompare improvements' },
            { status: 'in-progress', text: 'Customer Portal update' },
            { status: 'planned', text: 'Orange Platform Phase 2' }
        ],
        'mash': [
            { status: 'in-progress', text: 'iMad Multibrand - Phase 2' },
            { status: 'in-progress', text: 'BoltPay integration' },
            { status: 'planned', text: 'Performance optimization' }
        ],
        'magento': [
            { status: 'in-progress', text: 'iMad catalog sync' },
            { status: 'in-progress', text: 'Payment modules' },
            { status: 'planned', text: 'API modernization' }
        ],
        'qa': [
            { status: 'in-progress', text: 'Test automation' },
            { status: 'in-progress', text: 'Performance testing suite' },
            { status: 'planned', text: 'Regression test coverage' }
        ],
        'it_delivery': [
            { status: 'in-progress', text: 'Infrastructure optimization' },
            { status: 'planned', text: 'CI/CD improvements' },
            { status: 'planned', text: 'Monitoring setup' }
        ]
    },
    // Next sprint goals (sprint-2)
    'sprint-2': {
        'alf': [
            { status: 'planned', text: 'KAP Phase 3 - Advanced features' },
            { status: 'planned', text: 'LTDC Rental optimization' },
            { status: 'planned', text: 'Decision Cube enhancements' }
        ],
        'warex': [
            { status: 'planned', text: 'IRIS integration Phase 2' },
            { status: 'planned', text: 'Warranty Product refinements' },
            { status: 'planned', text: 'Orange B2B integration' }
        ],
        'optimus': [
            { status: 'planned', text: 'BoltCompare mobile version' },
            { status: 'planned', text: 'Coverwise UAT fixes' },
            { status: 'planned', text: 'Customer Portal v2' }
        ],
        'mash': [
            { status: 'planned', text: 'iMad Phase 2 - Payment processors' },
            { status: 'planned', text: 'Dynamic Pricing v2' },
            { status: 'planned', text: 'MRP integration continuation' }
        ],
        'magento': [
            { status: 'planned', text: 'IMAD GOLIVE preparation' },
            { status: 'planned', text: 'Stock synchronization' },
            { status: 'planned', text: 'Payment gateway migration' }
        ],
        'qa': [
            { status: 'planned', text: 'Full regression suite' },
            { status: 'planned', text: 'Performance baseline' },
            { status: 'planned', text: 'Security testing' }
        ],
        'it_delivery': [
            { status: 'planned', text: 'Deployment pipeline v2' },
            { status: 'planned', text: 'Monitoring improvements' },
            { status: 'planned', text: 'SLA optimization' }
        ]
    }
};

// ===== TIME OFF =====
const MOCK_PERSON_TIME_OFF = {
    'Kamila Molas': {
        '2026-01-20': true
    },
    'Marcin Wrzesiński': {
        '2026-01-13': true,
        '2026-01-14': true
    }
};

// ===== RISKS =====
const MOCK_RISKS = [
    {
        id: 1,
        description: 'MM Spain scope expansion',
        team: 'alf',
        owner: 'Kamila Molas',
        status: 'open',
        priority: 1,
        impact: 'high',
        dueDate: '2026-01-15'
    },
    {
        id: 2,
        description: 'IRIS integration delays',
        team: 'warex',
        owner: 'Marcin Wrzesiński',
        status: 'open',
        priority: 1,
        impact: 'high',
        dueDate: '2026-01-18'
    },
    {
        id: 3,
        description: 'iMad Multibrand resource conflict',
        team: 'mash',
        owner: 'Paweł Naworol',
        status: 'open',
        priority: 2,
        impact: 'medium',
        dueDate: '2026-01-20'
    },
    {
        id: 4,
        description: 'BoltCompare performance bottleneck',
        team: 'optimus',
        owner: 'Tomasz Lupa',
        status: 'open',
        priority: 2,
        impact: 'medium',
        dueDate: '2026-01-22'
    }
];

// ===== CAPACITY PARAMS (Z app.js - match TEAMS) =====
const MOCK_CAPACITY_PARAMS = {
    'alf': { overhead: 5, scrum: 9, maintenance: 9, bau: 21, projects: 56 },
    'warex': { overhead: 5, scrum: 10, maintenance: 16, bau: 6, projects: 63 },
    'optimus': { overhead: 5, scrum: 10, maintenance: 6, bau: 24, projects: 55 },
    'mash': { overhead: 5, scrum: 16, maintenance: 20, bau: 12, projects: 47 },
    'magento': { overhead: 5, scrum: 10, maintenance: 5, bau: 5, projects: 75 },
    'qa': { overhead: 5, scrum: 10, maintenance: 25, bau: 40, projects: 20 },
    'it_delivery': { overhead: 5, scrum: 10, maintenance: 5, bau: 0, projects: 80 }
};

// ===== CURRENT SPRINT =====
const MOCK_CURRENT_SPRINT = {
    id: 'sprint-1',
    dates: '2026-01-06 to 2026-01-17',
    name: 'Sprint 1',
    index: 0  // Week index from BASE_DATE
};

// Export if in module context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOCK_PROJECTS,
        MOCK_PEOPLE,
        MOCK_SPRINT_GOALS,
        MOCK_PERSON_TIME_OFF,
        MOCK_RISKS,
        MOCK_CAPACITY_PARAMS,
        MOCK_CURRENT_SPRINT
    };
}
