// ============================================================
// IT R&D Capacity Planner - Application Data & Logic
// ============================================================

// --- DATA (based on Excel structure) ---

// Use TEAMS from constants.js if available, otherwise define here
// NOTE: constants.js loads BEFORE app.js, so TEAMS should already exist
if (typeof TEAMS === 'undefined') {
    var TEAMS = [
        { id: 'alf', name: 'ALF', color: '#3b82f6' },
        { id: 'warex', name: 'WAREX', color: '#10b981' },
        { id: 'optimus', name: 'OPTIMUS', color: '#f59e0b' },
        { id: 'mash', name: 'MASH', color: '#8b5cf6' },
        { id: 'magento', name: 'MAGENTO', color: '#ec4899' },
        { id: 'qa', name: 'QA', color: '#14b8a6' },
        { id: 'it_delivery', name: 'IT DELIVERY', color: '#64748b' },
    ];
}

// Available roles for people
const ROLES = [
    'Squad Lead',
    'BE Developer',
    'FE Developer',
    'System Analyst',
    'TSM',
    'QA',
    'QAE',
    'Engineering Manager',
    'Trainee',
];

// Friday availability factor (skrócony piątek)
let FRIDAY_FACTOR = 0.65;

// Capacity allocation parameters per team (% of total capacity)
// OVERHEAD + SCRUM + MAINTENANCE_NET + BAU + PROJECTS = 100%
let CAPACITY_PARAMS = {
    alf:     { overhead: 5, scrum: 9, maintenance: 9, bau: 21, projects: 56 },
    warex:   { overhead: 5, scrum: 10, maintenance: 16, bau: 6, projects: 63 },
    optimus: { overhead: 5, scrum: 10, maintenance: 6, bau: 24, projects: 55 },
    mash:    { overhead: 5, scrum: 16, maintenance: 20, bau: 12, projects: 47 },
    magento: { overhead: 5, scrum: 10, maintenance: 5, bau: 5, projects: 75 },
    qa:      { overhead: 5, scrum: 10, maintenance: 25, bau: 40, projects: 20 },
    it_delivery: { overhead: 5, scrum: 10, maintenance: 5, bau: 0, projects: 80 },
};

// Weekly capacity is now calculated dynamically via getCapacity(teamId, weekIdx)
// Legacy static data kept as reference:
// const CAPACITY_LEGACY = {
//     alf:     [32.21, 22.91, 32.93, 33.33, 31.79, 28.31, 24.98, 26.64, 26.90, 23.52, 31.79, 30.58],
//     warex:   [24.48, 17.41, 25.02, 25.33, 24.16, 21.51, 18.98, 20.24, 20.44, 17.87, 24.16, 23.23],
//     optimus: [18.45, 10.58, 16.71, 17.29, 17.39, 16.59, 18.09, 18.58, 18.34, 11.60, 18.92, 18.89],
//     mash:    [8.14, 6.16, 8.14, 8.14, 7.91, 6.16, 6.16, 8.14, 8.14, 5.60, 8.14, 8.14],
//     magento: [24.41, 19.16, 20.93, 21.41, 24.41, 24.41, 24.41, 24.41, 20.93, 18.00, 23.66, 24.41],
// };

// Current user (for note authorship)
function getCurrentUser() {
    let user = localStorage.getItem('cp_current_user');
    if (!user) {
        user = prompt('Podaj swoje imię i nazwisko (do notatek):') || 'Anonim';
        localStorage.setItem('cp_current_user', user);
    }
    return user;
}

// Default alert configurations (editable)
const DEFAULT_ALERT_CONFIG = {
    overCapacity: {
        label: 'Przekroczenie capacity',
        type: 'Capacity',
        level: 'critical',
        threshold: 100,
        thresholdOp: '>',
        scope: 'all-teams',
        scopeValue: [],
        description: 'Alert pojawia się gdy zespół przekracza 100% dostępności w sprincie',
        enabled: true
    },
    noAllocation: {
        label: 'Brak przypisania zespołu',
        type: 'Projekt',
        level: 'warning',
        threshold: 0,
        thresholdOp: '=',
        scope: 'all-teams',
        scopeValue: [],
        weeks: 4,
        description: 'Alert pojawia się gdy projekt ma zespół, ale bez alokacji w następnych 4 tygodniach',
        enabled: true
    },
    deadlineApproaching: {
        label: 'Zbliżający się termin',
        type: 'Projekt',
        level: 'warning',
        threshold: 14,
        thresholdOp: '<=',
        scope: 'all-projects',
        scopeValue: [],
        description: 'Alert pojawia się gdy termin realizacji jest w ciągu 14 dni od dziś',
        enabled: true
    },
    openRisks: {
        label: 'Otwarte ryzyka',
        type: 'Ryzyko',
        level: 'critical',
        threshold: 3,
        thresholdOp: '>=',
        scope: 'all-projects',
        scopeValue: [],
        description: 'Alert pojawia się gdy projekt ma 3 lub więcej otwartych ryzyk',
        enabled: true
    },
    noKeyRole: {
        label: 'Brak kluczowej roli',
        type: 'Dostępność',
        level: 'critical',
        threshold: 1,
        thresholdOp: '>=',
        scope: 'all-teams',
        scopeValue: [],
        description: 'Alert pojawia się gdy brakuje Developer lub QA w następnym sprincie',
        enabled: true
    }
};

// Load or initialize alert configurations
function getAlertConfig() {
    const saved = localStorage.getItem('cp_alert_config');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) { }
    }
    return JSON.parse(JSON.stringify(DEFAULT_ALERT_CONFIG));
}

function saveAlertConfig(config) {
    localStorage.setItem('cp_alert_config', JSON.stringify(config));
}

// Default projects data — using original priority numbering
const DEFAULT_PROJECTS = [
    { id: 1, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Generic Warranty Product in Warex2', businessOwner: 'Agnieszka Pura', lead: 'Marcin Wrzesiński', delivery: '', teams: ['WAREX'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 2, priority: 'N/A', status: 'in-progress', health: 'green', name: 'API between Warex i IRIS', businessOwner: 'Marta Jankowska', lead: 'Marcin Wrzesiński', delivery: '', teams: ['WAREX'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 3, priority: 1, status: 'in-progress', health: 'green', name: 'BoltCompare', businessOwner: '', lead: 'Tomasz Lupa', delivery: '2026-08-09', teams: ['OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 4, priority: 13, status: 'in-progress', health: 'green', name: 'BoltPay/PayU payments integration', businessOwner: 'Katarzyna Zaremba', lead: 'Paweł Naworol', delivery: '', teams: ['ALF', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 5, priority: 31, status: 'in-progress', health: 'green', name: 'Coverwise Travel Gadget TPA - Phase2 Southdowns', businessOwner: 'Tope Ajiboye', lead: 'Paweł Naworol', delivery: '', teams: ['WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 6, priority: 21, status: 'in-progress', health: 'green', name: 'Customer Portal update (T-Mobile and Play)', businessOwner: '', lead: 'Monika Zarzycka', delivery: '', teams: ['OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 7, priority: 'N/A', status: 'in-progress', health: 'amber', name: 'Dynamic Pricing', businessOwner: 'Łukasz Miksa', lead: 'Paweł Szymański', delivery: '', teams: ['ALF', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 8, priority: 15, status: 'in-progress', health: 'green', name: 'Gwarancje generyczne', businessOwner: '', lead: '', delivery: '2026-06-26', teams: ['WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 9, priority: 11, status: 'in-progress', health: 'green', name: 'HT Insurance', businessOwner: '', lead: '', delivery: '2026-08-11', teams: ['WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 10, priority: 37, status: 'in-progress', health: 'amber', name: 'Huawei', businessOwner: 'Wiktoria Łopian', lead: '', delivery: '', teams: [], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 11, priority: 13, status: 'in-progress', health: 'green', name: 'iMad Multibrand - PHASE 2', businessOwner: 'Łukasz Szafrański', lead: 'Przemysław Ćwikła', delivery: '', teams: ['ALF', 'MASH', 'MAGENTO'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 12, priority: 17, status: 'in-progress', health: 'red', name: 'IRIS-WAREX', businessOwner: '', lead: '', delivery: '2026-04-19', teams: ['WAREX'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 13, priority: 4, status: 'in-progress', health: 'green', name: 'LTDC Rental POC', businessOwner: '', lead: 'Kamila Molas', delivery: '2026-05-15', teams: ['ALF', 'WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 14, priority: 7, status: 'in-progress', health: 'green', name: 'Mirror check', businessOwner: 'Izabela Zdunek', lead: 'Tomasz Kułakowski', delivery: '', teams: ['WAREX', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 15, priority: 7, status: 'in-progress', health: 'amber', name: 'MM Spain (rental)', businessOwner: '', lead: '', delivery: '2026-04-15', teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 16, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Modernization of local Customer Portals', businessOwner: 'Zofia Kasperska', lead: 'Monika Zarzycka', delivery: '', teams: ['OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 17, priority: 7, status: 'in-progress', health: 'green', name: 'Mr Price', businessOwner: '', lead: 'Wojciech Wójcik', delivery: '', teams: ['WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 18, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Operations Excellence in ALF (Phase 3)', businessOwner: 'Natalia Wiśniewska', lead: 'Kamila Molas', delivery: '', teams: ['ALF'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 19, priority: 8, status: 'in-progress', health: 'green', name: 'Orange B2B Enterprise', businessOwner: '', lead: '', delivery: '', teams: ['WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 20, priority: 12, status: 'in-progress', health: 'green', name: 'Orange Insurance Platform - Phase 2', businessOwner: 'Izabela Zdunek', lead: 'Tomasz Lupa', delivery: '', teams: ['OPTIMUS', 'MASH', 'MAGENTO'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 21, priority: 8, status: 'in-progress', health: 'green', name: 'Orange Products refresh & Mirror check', businessOwner: '', lead: 'Tomasz Kułakowski', delivery: '2026-05-25', teams: ['WAREX', 'OPTIMUS', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 22, priority: 16, status: 'in-progress', health: 'green', name: 'Parametrization for Credit Risk Department', businessOwner: 'Karolina Głowacka-Serafin', lead: 'Kamila Molas', delivery: '2026-07-16', teams: ['ALF', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 23, priority: 36, status: 'in-progress', health: 'amber', name: 'Polkomtel online trade-in', businessOwner: 'Monika Komorowska', lead: '', delivery: '', teams: [], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 24, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Rental in LTDC', businessOwner: 'Milena Dzikowska', lead: 'Kamila Molas', delivery: '', teams: ['ALF'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 25, priority: 33, status: 'in-progress', health: 'amber', name: 'RentMe Refurb - Media Markt', businessOwner: 'Olga Kuhalskaya', lead: 'Kamila Molas', delivery: '', teams: ['ALF', 'WAREX', 'OPTIMUS'], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 26, priority: 9, status: 'in-progress', health: 'green', name: 'Spot Trade In Media Expert', businessOwner: 'Mikołaj Przybyła', lead: '', delivery: '', teams: [], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 27, priority: 8, status: 'in-progress', health: 'green', name: 'Sunrise - new project', businessOwner: 'Igor Zdziarski', lead: '', delivery: '', teams: [], risks: '', notes: [], allocations: {}, category: 'project' },
    { id: 28, priority: 1, status: 'in-progress', health: 'green', name: 'T-Mobile North Macedonia', businessOwner: 'Zofia Kasperska', lead: 'Tomasz Kułakowski', delivery: '2026-05-26', teams: ['WAREX', 'OPTIMUS', 'MASH'], risks: '', notes: [], allocations: {}, category: 'project' },
    // --- OTHER (BAU, Maintenance, Cele IT) ---
    { id: 100, priority: 'N/A', status: 'in-progress', health: 'green', name: 'BAU & Maintenance', businessOwner: '', lead: '', delivery: '', teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO'], risks: '', notes: [], allocations: {}, category: 'bau' },
    { id: 102, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Cele IT', businessOwner: '', lead: '', delivery: '', teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA', 'IT DELIVERY'], risks: '', notes: [], allocations: {}, category: 'overhead' },
    { id: 103, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Szkolenia / Development', businessOwner: '', lead: '', delivery: '', teams: ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA'], risks: '', notes: [], allocations: {}, category: 'overhead' },
    { id: 104, priority: 'N/A', status: 'in-progress', health: 'green', name: 'Test Automation', businessOwner: '', lead: '', delivery: '', teams: ['QA'], risks: '', notes: [], allocations: {}, category: 'maintenance' },
];

// Projects array - loaded from localStorage or defaults
let PROJECTS = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
let ARCHIVED_PROJECTS = [];

// Sort order for roles within teams (lower = shown first)
let ROLE_SORT_ORDER = {
    'Engineering Manager': 0,
    'Squad Lead': 1,
    'BE Developer': 2,
    'FE Developer': 3,
    'TSM': 4,
    'System Analyst': 5,
    'QA': 6,
    'QAE': 7,
    'QA coordinator': 8,
    'Trainee': 9,
};

const DEFAULT_PEOPLE = [
    // --- ALF ---
    { name: 'Kamila Molas', role: 'Squad Lead', team: 'ALF', projects: ['KAP', 'Dynamic Pricing', 'Decision Cube'], employmentType: 'full-time', availability: 100, assignedTeams: [] },
    { name: 'Mikołaj Banaszkiewicz', role: 'BE Developer', team: 'ALF', projects: ['KAP', 'Dynamic Pricing fixes'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Michał Godziszewski', role: 'FE Developer', team: 'ALF', projects: ['Orange IE', 'KAP CVM'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Marcin Godziszewski', role: 'BE Developer', team: 'ALF', projects: ['LTDC Rental', 'BAU iMad'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Adam Gruszecki', role: 'BE Developer', team: 'ALF', projects: ['BAU & Maintenance'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Bartosz Listwan', role: 'BE Developer', team: 'ALF', projects: ['KAP - Automated Tests'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Joanna Redes', role: 'BE Developer', team: 'ALF', projects: ['KSeF', 'LTDC-NAV'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Jakub Kulesza', role: 'TSM', team: 'ALF', projects: ['Operation Excellence III'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Adrian Słabicki', role: 'BE Developer', team: 'ALF', projects: ['Operation Excellence III'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Szymon Bartnik', role: 'BE Developer', team: 'ALF', projects: ['Operation Excellence III'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Darya Vasilchyk', role: 'Trainee', team: 'ALF', projects: ['BAU & 1st Line support'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- WAREX ---
    { name: 'Marcin Wrzesiński', role: 'Squad Lead', team: 'WAREX', projects: ['Orange Refresh & MC', 'MKT Macedonia'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Mariola Skrzedziejewska', role: 'System Analyst', team: 'WAREX', projects: ['Orange Refresh - Conf & Dev'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Iga Adamczuk', role: 'System Analyst', team: 'WAREX', projects: ['MKT DP', 'Coverwise'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Łukasz Budzyń', role: 'BE Developer', team: 'WAREX', projects: ['Orange Refresh & MC - Dev'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Iemma', role: 'BE Developer', team: 'WAREX', projects: ['Orange Refresh & MC - Dev'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- OPTIMUS ---
    { name: 'Monika Zarzycka', role: 'Squad Lead', team: 'OPTIMUS', projects: ['Coverwise', 'Rebranding'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Patryk Adamczyk', role: 'System Analyst', team: 'OPTIMUS', projects: ['Coverwise/Southdowns', 'BAU'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Krzysztof Salapa', role: 'System Analyst', team: 'OPTIMUS', projects: ['MiniClaim', 'BAU'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Branicki', role: 'BE Developer', team: 'OPTIMUS', projects: ['Mailbox Integration', 'BAU'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Andrzej Fedorowicz', role: 'BE Developer', team: 'OPTIMUS', projects: ['API Play', 'Goals'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Roger Witkowski', role: 'BE Developer', team: 'OPTIMUS', projects: ['Rebranding', 'Orange Enterprise'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Bartosz Kawalkiewicz', role: 'FE Developer', team: 'OPTIMUS', projects: ['Macedonia CP', 'Orange IE'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Marta Kordas', role: 'FE Developer', team: 'OPTIMUS', projects: ['CP T-Mobile refresh'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- MASH ---
    { name: 'Paweł Szymański', role: 'Squad Lead', team: 'MASH', projects: ['KAP CVM', 'IMAD Phase 2'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Krzysztof Szczerbiak', role: 'System Analyst', team: 'MASH', projects: ['Dynamic Pricing', 'IMAD Phase 2'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Łukasz Nieściur', role: 'BE Developer', team: 'MASH', projects: ['IMAD Phase 2', 'KAP CRD'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Szymon Ryncarz', role: 'BE Developer', team: 'MASH', projects: ['Macedonia', 'Orange MC'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Sabala', role: 'BE Developer', team: 'MASH', projects: ['Orange IE SendMail'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- MAGENTO ---
    { name: 'Przemysław Ćwikła', role: 'Squad Lead', team: 'MAGENTO', projects: ['IMAD Phase 2', 'Rebranding'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- QA ---
    { name: 'Rafał Mianowicz', role: 'Squad Lead', team: 'QA', projects: ['QA Community', 'Test Automation strategy'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Żaneta Fedor-Zalewska', role: 'QA', team: 'QA', projects: ['KAP SIT', 'Automation Learning'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Jarosław Gawroński', role: 'QA', team: 'QA', projects: ['OE III SIT', 'MM Spain'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Radosław Górski', role: 'QA', team: 'QA', projects: ['MAGENTO critical paths', 'MM Spain'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Dominik Jagodziński', role: 'QA', team: 'QA', projects: ['MM Spain', 'KAP'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Aleksandra Błaszczyk', role: 'QA', team: 'QA', projects: ['SIT release 4.6.0', 'DPD'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Hubert Foltyn', role: 'QA', team: 'QA', projects: ['SIT/UAT', 'Automation'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Stanisław Walkosz', role: 'QA', team: 'QA', projects: ['Orange IE', 'SIT'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Kaja Jach', role: 'QA', team: 'QA', projects: ['L4 - niedostępna'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Kamil Łukasik', role: 'QA', team: 'QA', projects: ['Orange SIT/UAT', 'MKT DP'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Anna Ilchenko', role: 'QAE', team: 'QA', projects: ['Orange MC automation', 'PKO'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Wierachowski', role: 'QAE', team: 'QA', projects: ['IMAD Phase 2', 'Automation'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Radosław Litwin', role: 'QA', team: 'QA', projects: ['IMAD Phase 2 SIT', 'Regression'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Konrad Matyjasek', role: 'QA', team: 'QA', projects: ['IMAD Phase 2', 'Automation'], employmentType: 'full-time', availability: 100 , assignedTeams: []},

    // --- IT DELIVERY (TSM) ---
    { name: 'Cezary Domagała', role: 'Engineering Manager', team: 'IT DELIVERY', projects: ['Architecture', 'AI Adoption'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Kułakowski', role: 'TSM', team: 'IT DELIVERY', projects: ['Orange Refresh & MC', 'MKT Macedonia'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Tomasz Lupa', role: 'TSM', team: 'IT DELIVERY', projects: ['Orange IE', 'Mobile Apps'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Wojciech Wójcik', role: 'TSM', team: 'IT DELIVERY', projects: ['MasOrange', 'Mr Price Discovery'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Paweł Naworol', role: 'TSM', team: 'IT DELIVERY', projects: ['Coverwise', 'PayU Integration'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
    { name: 'Kamil Biskup', role: 'TSM', team: 'IT DELIVERY', projects: ['A1 Trade-in', 'KAP'], employmentType: 'full-time', availability: 100 , assignedTeams: []},
];

// Mutable PEOPLE array - loaded from localStorage or defaults
let PEOPLE = JSON.parse(JSON.stringify(DEFAULT_PEOPLE));

function savePeople() {
    localStorage.setItem('cp_people', JSON.stringify(PEOPLE));
}

function loadPeople() {
    const saved = localStorage.getItem('cp_people');
    if (saved) {
        try {
            PEOPLE = JSON.parse(saved);
            // Auto-merge: add any new default people not yet in saved data
            DEFAULT_PEOPLE.forEach(dp => {
                const existing = PEOPLE.find(p => p.name === dp.name);
                if (!existing) {
                    PEOPLE.push(JSON.parse(JSON.stringify(dp)));
                } else {
                    // Sync role and team from defaults (in case they changed)
                    existing.role = dp.role;
                    existing.team = dp.team;
                }
            });
        } catch (e) { /* use defaults */ }
    }
}

function addPerson(person) {
    PEOPLE.push(person);
    savePeople();
}

function removePerson(personName) {
    PEOPLE = PEOPLE.filter(p => p.name !== personName);
    savePeople();
    // Clean up person assignments
    if (personAssignments[personName]) {
        delete personAssignments[personName];
        savePersonAssignments();
    }
}

const SPRINTS = [
    { id: 277, name: 'Sprint 277', dates: '01.12 - 12.12' },
    { id: 276, name: 'Sprint 276', dates: '17.11 - 28.11' },
    { id: 275, name: 'Sprint 275', dates: '03.11 - 14.11' },
    { id: 274, name: 'Sprint 274', dates: '20.10 - 31.10' },
    { id: 273, name: 'Sprint 273', dates: '06.10 - 17.10' },
    { id: 272, name: 'Sprint 272', dates: '22.09 - 03.10' },
    { id: 271, name: 'Sprint 271', dates: '07.09 - 18.09', goals: { alf: 'KAP, Open Contract in Rental, BAU', warex: 'Orange Prod Refresh & MC, Generic Warranty, HT Insurance', optimus: 'Coverwise/Southdowns UAT, HT Insurance DEV', mash: 'MRP Upfront integration, Dynamic Pricing stabilization', magento: 'IMAD Phase 2 - new payment methods DEV' } },
    { id: 270, name: 'Sprint 270', dates: '24.08 - 04.09', goals: { alf: 'Operation Excellence GOLIVE, KAP CVM', warex: 'Orange MC backend UAT, Macedonia API', optimus: 'Coverwise CP GOLIVE, Southdowns', mash: 'IMAD Phase 2 stocks, Dynamic Pricing performance', magento: 'IMAD Phase 2 GOLIVE' } },
    { id: 269, name: 'Sprint 269', dates: '10.08 - 21.08' },
    { id: 268, name: 'Sprint 268', dates: '27.07 - 07.08' },
    { id: 267, name: 'Sprint 267', dates: '13.07 - 24.07' },
];

// Sprint pagination for People tab (show 5 at a time)
// Offset 0 = current sprint is leftmost, going into future (ascending IDs)
let sprintPageOffset = 0;

let activeRoleFilters = new Set(); // Multi-select: set of selected roles
let activeTeamFilters = new Set(); // Multi-select: set of selected teams

// Get sprints sorted ascending from current sprint onward
function getSprintsFromCurrent() {
    // Sort ascending by ID
    const sorted = [...SPRINTS].sort((a, b) => a.id - b.id);
    // Find current sprint (today = 2026-07-31)
    const today = new Date();
    let currentIdx = 0;
    for (let i = 0; i < sorted.length; i++) {
        const dates = parseSprintDatesForSort(sorted[i].dates);
        if (dates && today >= dates.start && today <= dates.end) {
            currentIdx = i;
            break;
        }
        // If today is before this sprint's start, previous was the last past one
        if (dates && today < dates.start) {
            currentIdx = Math.max(0, i - 1);
            break;
        }
        currentIdx = i; // fallback to last
    }
    // Return from current sprint onward (current + future)
    return sorted.slice(currentIdx);
}

function parseSprintDatesForSort(dateStr) {
    try {
        const parts = dateStr.split(' - ');
        const [d1, m1] = parts[0].split('.').map(Number);
        const [d2, m2] = parts[1].split('.').map(Number);
        return {
            start: new Date(2026, m1 - 1, d1),
            end: new Date(2026, m2 - 1, d2)
        };
    } catch(e) { return null; }
}

// --- PERSON-SPRINT ASSIGNMENTS ---
// personAssignments[personName][sprintId] = ['Project A', 'Custom task B']
let personAssignments = {};

function savePersonAssignments() {
    localStorage.setItem('cp_person_assignments', JSON.stringify(personAssignments));
}

function loadPersonAssignments() {
    const saved = localStorage.getItem('cp_person_assignments');
    if (saved) {
        try {
            personAssignments = JSON.parse(saved);
        } catch (e) { /* use empty */ }
    }
    // Do NOT initialize from old projects field - let user add assignments fresh
}

function clearSprintAssignments(sprintId) {
    // Clear all assignments for a specific sprint
    Object.keys(personAssignments).forEach(personName => {
        if (personAssignments[personName] && personAssignments[personName][sprintId]) {
            delete personAssignments[personName][sprintId];
        }
    });
    savePersonAssignments();
    console.log(`✅ Cleared all assignments for sprint ${sprintId}`);
}

function loadCustomSprints() {
    const saved = localStorage.getItem('cp_sprints_custom');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                SPRINTS.length = 0;
                parsed.forEach(s => SPRINTS.push(s));
            }
        } catch (e) { /* use defaults */ }
    }
    // Load saved sprint goals
    const savedGoals = localStorage.getItem('cp_sprint_goals');
    if (savedGoals) {
        try {
            const goals = JSON.parse(savedGoals);
            SPRINTS.forEach(s => {
                if (goals[s.id]) s.goals = goals[s.id];
            });
        } catch (e) { /* ignore */ }
    }
}

const WEEKS = [
    '28.07-03.08', '04.08-10.08', '11.08-17.08', '18.08-24.08',
    '25.08-31.08', '01.09-07.09', '08.09-14.09', '15.09-21.09',
    '22.09-28.09', '29.09-05.10', '06.10-12.10', '13.10-19.10',
    '20.10-26.10', '27.10-02.11', '03.11-09.11', '10.11-16.11',
    '17.11-23.11', '24.11-30.11'
];

// Dynamically generate week metadata from base date (Mon 28.07.2026)
const BASE_DATE = new Date(2026, 6, 27);
let TOTAL_WEEKS = WEEKS.length;

function generateWeeks() {
    return WEEKS.map((w, i) => {
        const mon = new Date(BASE_DATE);
        mon.setDate(BASE_DATE.getDate() + i * 7);
        const month = mon.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        const parts = w.split('-');
        return { label: `${parts[0]} – ${parts[1]}`, month, dataIdx: i };
    });
}

let ALL_WEEKS = generateWeeks();

function extendWeeks(count) {
    // Add more weeks after the last one
    const lastWeekStr = WEEKS[WEEKS.length - 1];
    const lastParts = lastWeekStr.split('-');
    const [lastD, lastM] = lastParts[1].split('.').map(Number);
    let lastEnd = new Date(2026, lastM - 1, lastD);

    for (let i = 0; i < count; i++) {
        const start = new Date(lastEnd);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
        WEEKS.push(`${fmt(start)}-${fmt(end)}`);
        lastEnd = end;
    }

    TOTAL_WEEKS = WEEKS.length;
    ALL_WEEKS = generateWeeks();

    // Auto-create sprints for new weeks if needed
    ensureSprintsCoverWeeks();
}

function ensureSprintsCoverWeeks() {
    // Check if sprints cover the last week
    const lastWeekStart = new Date(BASE_DATE);
    lastWeekStart.setDate(BASE_DATE.getDate() + (WEEKS.length - 1) * 7);

    // Find the latest sprint end date
    let latestSprintEnd = null;
    SPRINTS.forEach(s => {
        const dates = parseSprintDates(s.dates);
        if (dates && (!latestSprintEnd || dates.end > latestSprintEnd)) {
            latestSprintEnd = dates.end;
        }
    });

    if (!latestSprintEnd) return;

    // Generate sprints until they cover the last week
    const latestId = Math.max(...SPRINTS.map(s => s.id));
    let sprintEnd = latestSprintEnd;
    let nextId = latestId + 1;

    while (sprintEnd < lastWeekStart) {
        const sprintStart = new Date(sprintEnd);
        sprintStart.setDate(sprintStart.getDate() + 1);
        // Skip weekends for sprint start
        while (sprintStart.getDay() === 0 || sprintStart.getDay() === 6) {
            sprintStart.setDate(sprintStart.getDate() + 1);
        }
        const newEnd = new Date(sprintStart);
        newEnd.setDate(newEnd.getDate() + 11); // 2 week sprint (Mon-Fri × 2)

        const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
        SPRINTS.unshift({
            id: nextId,
            name: `Sprint ${nextId}`,
            dates: `${fmt(sprintStart)} - ${fmt(newEnd)}`
        });

        sprintEnd = newEnd;
        nextId++;
    }

    // Save generated sprints
    localStorage.setItem('cp_sprints_custom', JSON.stringify(SPRINTS));
}

// --- WORKLOAD VIEW STATE ---
const WEEKS_PER_PAGE = 18; // visible weeks at once (through end of November)
let workloadOffset = 0;   // index of first visible week (steps of WEEKS_PER_PAGE)

// --- RENDER FUNCTIONS ---

function renderCapacityBars() {
    const sprintData = calcCapacityForWeeks(getSprintWeekIndices());
    renderCapacityTable('capacity-sprint', sprintData);
    renderCapacityChart('chart-sprint', sprintData);
    const monthData = calcCapacityForWeeks(getMonthWeekIndices());
    renderCapacityTable('capacity-bars', monthData);
    renderCapacityChart('chart-month', monthData);
}

function getSprintWeekIndices() {
    const today = new Date();
    let currentSprint = null;
    SPRINTS.forEach(s => { const d = parseSprintDates(s.dates); if (d && today >= d.start && today <= d.end) currentSprint = s; });
    if (!currentSprint) return [0];
    const sd = parseSprintDates(currentSprint.dates);
    const indices = [];
    for (let i = 0; i < TOTAL_WEEKS; i++) {
        const ws = new Date(BASE_DATE); ws.setDate(BASE_DATE.getDate() + i * 7);
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        if (we >= sd.start && ws <= sd.end) indices.push(i);
    }
    return indices.length > 0 ? indices : [0];
}

function getMonthWeekIndices() {
    const today = new Date();
    const ms = new Date(today.getFullYear(), today.getMonth(), 1);
    const me = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const indices = [];
    for (let i = 0; i < TOTAL_WEEKS; i++) {
        const ws = new Date(BASE_DATE); ws.setDate(BASE_DATE.getDate() + i * 7);
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        if (we >= ms && ws <= me) indices.push(i);
    }
    return indices.length > 0 ? indices : [0];
}

function calcCapacityForWeeks(weekIndices) {
    const result = { teams: [], totals: {} };
    let sCapRaw=0,sMD=0,sProj=0,sExpProj=0,sBau=0,sExpBau=0,sOH=0,sExpOH=0,sScr=0,sExpScr=0,sMnt=0,sExpMnt=0,sAlloc=0,sFree=0;
    TEAMS.forEach(team => {
        const p = CAPACITY_PARAMS[team.id] || {overhead:5,scrum:10,maintenance:10,bau:10,projects:65};
        const members = PEOPLE.filter(pr => pr.team === team.name);
        let capRaw=0, md=0;
        weekIndices.forEach(wi => {
            const ws = new Date(BASE_DATE); ws.setDate(BASE_DATE.getDate()+wi*7);
            const wd = countWorkDaysInWeek(ws); capRaw += wd*members.length;
            members.forEach(per => { const wk=formatDateKey(ws); const ex=excelAvailability[per.name];
                if(ex&&ex.weeks[wk]!==undefined){md+=ex.weeks[wk]*wd;}else{for(let d=0;d<7;d++){const dy=new Date(ws);dy.setDate(ws.getDate()+d);md+=getDayStatus(per.name,dy).factor;}}});
        });
        const eP=md*p.projects/100,eB=md*p.bau/100,eO=md*p.overhead/100,eS=md*p.scrum/100,eM=md*p.maintenance/100;
        let aP=0,aB=0,aO=0,aS=0,aM=0;
        weekIndices.forEach(wi=>{aP+=PROJECTS.filter(x=>!x.category||x.category==='project').reduce((s,x)=>s+(x.allocations[team.id]?.[wi]||0),0);aB+=PROJECTS.filter(x=>x.category==='bau').reduce((s,x)=>s+(x.allocations[team.id]?.[wi]||0),0);aO+=PROJECTS.filter(x=>x.category==='overhead').reduce((s,x)=>s+(x.allocations[team.id]?.[wi]||0),0);aS+=PROJECTS.filter(x=>x.category==='scrum').reduce((s,x)=>s+(x.allocations[team.id]?.[wi]||0),0);aM+=PROJECTS.filter(x=>x.category==='maintenance').reduce((s,x)=>s+(x.allocations[team.id]?.[wi]||0),0);});
        const alloc=aP+aB+aO+aS+aM, free=md-alloc;
        result.teams.push({team,capRaw,md,eP,eB,eO,eS,eM,aP,aB,aO,aS,aM,alloc,free});
        sCapRaw+=capRaw;sMD+=md;sProj+=aP;sExpProj+=eP;sBau+=aB;sExpBau+=eB;sOH+=aO;sExpOH+=eO;sScr+=aS;sExpScr+=eS;sMnt+=aM;sExpMnt+=eM;sAlloc+=alloc;sFree+=free;
    });
    result.totals={sCapRaw,sMD,sProj,sExpProj,sBau,sExpBau,sOH,sExpOH,sScr,sExpScr,sMnt,sExpMnt,sAlloc,sFree};
    return result;
}

function renderTimeline() {
    // Integrated into workload grid — no-op
}

// --- ACTION NEEDED ---
function renderActionNeeded() {
    const container = document.getElementById('action-needed-container');
    if (!container) return;

    const alerts = [];
    const today = new Date();

    // Check if alert type is enabled
    const isAlertEnabled = (type) => {
        const config = getAlertConfig();
        return config[type]?.enabled !== false;
    };

    // Find current sprint week indices
    const sprintIndices = getSprintWeekIndices();

    // Rule 1: Overallocation — team capacity > 100% in current/next sprints
    if (isAlertEnabled('overCapacity')) {
        TEAMS.forEach(team => {
            let totalCap = 0, totalAlloc = 0;
            sprintIndices.forEach(wi => {
                totalCap += getCapacity(team.id, wi);
                totalAlloc += PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[wi] || 0), 0);
            });
            if (totalCap > 0) {
                const pct = Math.round((totalAlloc / totalCap) * 100);
                if (pct > 100) {
                    // Find which projects contribute most
                    const topProjects = PROJECTS
                        .filter(p => p.status !== 'done' && sprintIndices.some(wi => (p.allocations[team.id]?.[wi] || 0) > 0))
                        .map(p => ({ name: p.shortName || p.name, alloc: sprintIndices.reduce((s, wi) => s + (p.allocations[team.id]?.[wi] || 0), 0) }))
                        .sort((a, b) => b.alloc - a.alloc);
                    const topName = topProjects.length > 0 ? topProjects[0].name : team.name;
                    alerts.push({
                        level: 'critical',
                        icon: '🔴',
                        project: topName,
                        detail: t('action.overCapacity', { pct })
                    });
                }
            }
        });
    }

    // Rule 2: Unassigned team — project has team in list but 0 allocation in next 4 weeks
    if (isAlertEnabled('noAllocation')) {
        const next4Weeks = [];
        for (let i = 0; i < TOTAL_WEEKS && next4Weeks.length < 4; i++) {
            const ws = new Date(BASE_DATE);
            ws.setDate(BASE_DATE.getDate() + i * 7);
            if (ws >= today) next4Weeks.push(i);
        }

        PROJECTS.filter(p => p.status === 'in-progress' && (!p.category || p.category === 'project')).forEach(proj => {
            (proj.teams || []).forEach(teamName => {
                const team = TEAMS.find(t => t.name === teamName);
                if (!team) return;
                const hasAlloc = next4Weeks.some(wi => (proj.allocations[team.id]?.[wi] || 0) > 0);
                if (!hasAlloc) {
                    alerts.push({
                        level: 'warning',
                        icon: '🟠',
                        project: proj.shortName || proj.name,
                        detail: t('action.noAllocation', { team: team.name })
                    });
                }
            });
        });
    }

    // Rule 3: Deadline approaching (< 14 days)
    if (isAlertEnabled('deadlineApproaching')) {
        PROJECTS.filter(p => p.status === 'in-progress' && p.delivery && (!p.category || p.category === 'project')).forEach(proj => {
            const deadline = new Date(proj.delivery);
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 14) {
                alerts.push({
                    level: 'warning',
                    icon: '🟠',
                    project: proj.shortName || proj.name,
                    detail: t('action.deadlineIn', { days: daysLeft, date: proj.delivery })
                });
            } else if (daysLeft <= 0 && daysLeft > -30) {
                alerts.push({
                    level: 'critical',
                    icon: '🔴',
                    project: proj.shortName || proj.name,
                    detail: t('action.deadlinePassed', { days: Math.abs(daysLeft) })
                });
            }
        });
    }

    // Rule 4: High risk count
    if (isAlertEnabled('openRisks')) {
        PROJECTS.filter(p => p.status === 'in-progress' && (!p.category || p.category === 'project')).forEach(proj => {
            const risks = Array.isArray(proj.risks) ? proj.risks : (proj.risks ? [proj.risks] : []);
            const activeRisks = risks.filter(r => r && (typeof r === 'object' ? r.status !== 'closed' : r.trim && r.trim().length > 0));
            if (activeRisks.length >= 3) {
                alerts.push({
                    level: 'critical',
                    icon: '🔴',
                    project: proj.shortName || proj.name,
                    detail: t('action.openRisks', { count: activeRisks.length })
                });
            }
        });
    }

    // Rule 5: Opportunity — free capacity in a team (always show)
    TEAMS.forEach(team => {
        let totalCap = 0, totalAlloc = 0;
        sprintIndices.forEach(wi => {
            totalCap += getCapacity(team.id, wi);
            totalAlloc += PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[wi] || 0), 0);
        });
        const free = totalCap - totalAlloc;
        if (free >= 5) {
            alerts.push({
                level: 'opportunity',
                icon: '🟢',
                project: team.name,
                detail: t('action.freeCapacity', { md: Math.round(free) })
            });
        }
    });

    // Sort: critical first, then warning, then opportunity
    const order = { critical: 0, warning: 1, opportunity: 2 };
    alerts.sort((a, b) => order[a.level] - order[b.level]);

    // Add custom alerts — evaluate conditions
    let customAlerts = [];
    try {
        const saved = localStorage.getItem('cp_custom_alerts');
        if (saved) {
            customAlerts = JSON.parse(saved).filter(a => a.enabled);
            customAlerts.forEach(ca => {
                let matched = false;

                // Evaluate custom alert condition
                if (ca.type === 'project-field') {
                    // Check if field is empty in any project
                    matched = PROJECTS.some(p => p.status === 'in-progress' && (!p.category || p.category === 'project') && !p[ca.params]);
                }
                else if (ca.type === 'project-status') {
                    // Check if any project has this status
                    matched = PROJECTS.some(p => p.status === ca.params && (!p.category || p.category === 'project'));
                }
                else if (ca.type === 'team-allocation') {
                    // Check if team has 0 allocation in next 4 weeks
                    const next4Weeks = [];
                    for (let i = 0; i < TOTAL_WEEKS && next4Weeks.length < 4; i++) {
                        const ws = new Date(BASE_DATE);
                        ws.setDate(BASE_DATE.getDate() + i * 7);
                        if (ws >= today) next4Weeks.push(i);
                    }
                    const team = TEAMS.find(t => t.name === ca.params);
                    if (team) {
                        matched = PROJECTS.some(p => 
                            p.status === 'in-progress' && 
                            (p.teams || []).includes(ca.params) && 
                            (!p.category || p.category === 'project') &&
                            !next4Weeks.some(wi => (p.allocations[team.id]?.[wi] || 0) > 0)
                        );
                    }
                }
                else if (ca.type === 'deadline-days') {
                    // Check if any project deadline is within N days
                    const daysThreshold = parseInt(ca.params) || 14;
                    matched = PROJECTS.some(p => {
                        if (!p.delivery || p.status !== 'in-progress' || (p.category && p.category !== 'project')) return false;
                        const deadline = new Date(p.delivery);
                        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 && daysLeft <= daysThreshold;
                    });
                }
                else if (ca.type === 'health-status') {
                    // Check if any project has this health status
                    matched = PROJECTS.some(p => 
                        p.health === ca.params && 
                        p.status === 'in-progress' && 
                        (!p.category || p.category === 'project')
                    );
                }

                // Add to alerts if condition matched
                if (matched) {
                    alerts.push({
                        level: 'warning',
                        icon: '📌',
                        project: ca.name,
                        detail: ca.description
                    });
                }
            });
        }
    } catch (e) { }

    // Re-sort after adding custom alerts
    alerts.sort((a, b) => order[a.level] - order[b.level]);

    // Limit to top 8 items
    const visible = alerts.slice(0, 8);

    if (visible.length === 0) {
        container.innerHTML = `<div class="action-needed">
            <div class="action-needed-title">${t('action.title')}</div>
            <div class="action-needed-empty">${t('action.allClear')}</div>
        </div>`;
        return;
    }

    let html = `<div class="action-needed">
        <div class="action-needed-title">${t('action.title')}</div>
        <div class="action-needed-list">`;

    visible.forEach(a => {
        html += `<div class="action-item ${a.level}">
            <span class="action-item-icon">${a.icon}</span>
            <div class="action-item-content">
                <div class="action-item-project">${a.project}</div>
                <div class="action-item-detail">${a.detail}</div>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

// --- SPRINT AVAILABILITY (Dashboard panel) ---

function getNextSprint() {
    const today = new Date();
    const sorted = [...SPRINTS].sort((a, b) => {
        const da = parseSprintDates(a.dates);
        const db = parseSprintDates(b.dates);
        if (!da || !db) return 0;
        return da.start - db.start;
    });
    // Find current sprint, then return the one after it
    for (let i = 0; i < sorted.length; i++) {
        const d = parseSprintDates(sorted[i].dates);
        if (!d) continue;
        if (today >= d.start && today <= d.end) {
            return sorted[i + 1] || sorted[i]; // next, or current if last
        }
        if (today < d.start) {
            return sorted[i]; // first upcoming
        }
    }
    return sorted[sorted.length - 1] || null;
}

function getWorkingDaysInRange(start, end) {
    const days = [];
    const d = new Date(start);
    while (d <= end) {
        if (!isWeekend(d)) days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function renderSprintAvailability() {
    const container = document.getElementById('sprint-availability-content');
    if (!container) return;

    const sprint = getNextSprint();
    if (!sprint) {
        container.innerHTML = `<p style="color:var(--bt-grey-400);font-size:12px;">${t('sprint.noSprints')}</p>`;
        return;
    }

    const dates = parseSprintDates(sprint.dates);
    if (!dates) {
        container.innerHTML = `<p style="color:var(--bt-grey-400);font-size:12px;">${t('sprint.parseError')}</p>`;
        return;
    }

    const workDays = getWorkingDaysInRange(dates.start, dates.end);
    const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

    // Analyze each person
    const unavailable = [];
    PEOPLE.forEach(person => {
        let offDays = 0;
        let totalFactor = 0;
        const dayStatuses = [];

        workDays.forEach(d => {
            const { status, factor } = getDayStatus(person.name, d);
            totalFactor += factor;
            if (factor === 0 && status !== 'weekend') offDays++;
            dayStatuses.push({ date: d, status, factor });
        });

        if (offDays > 0) {
            unavailable.push({
                name: person.name,
                team: person.team,
                role: person.role,
                offDays,
                totalDays: workDays.length,
                totalFactor,
                dayStatuses
            });
        }
    });

    // Sort: most days off first
    unavailable.sort((a, b) => b.offDays - a.offDays);

    let html = '';
    html += `<div style="font-size:11px;color:var(--bt-grey-400);margin-bottom:10px;">${sprint.name} (${sprint.dates}) · ${workDays.length} ${t('sprint.workingDays')}</div>`;

    if (unavailable.length === 0) {
        html += `<p style="color:var(--accent-green);font-size:12px;font-weight:600;">${t('sprint.allAvailable')}</p>`;
    } else {
        html += `<table style="width:100%;border-collapse:collapse;font-size:11px;">`;
        html += `<thead><tr style="border-bottom:1px solid var(--bt-grey-200);">`;
        html += `<th style="text-align:left;padding:6px 8px;font-size:9px;color:var(--bt-grey-400);font-weight:600;">${t('sprint.colPerson')}</th>`;
        html += `<th style="text-align:left;padding:6px 4px;font-size:9px;color:var(--bt-grey-400);font-weight:600;">${t('sprint.colTeam')}</th>`;
        html += `<th style="text-align:left;padding:6px 4px;font-size:9px;color:var(--bt-grey-400);font-weight:600;">${t('sprint.colRole')}</th>`;
        html += `<th style="text-align:center;padding:6px 4px;font-size:9px;color:var(--bt-grey-400);font-weight:600;">${t('sprint.colDaysOff')}</th>`;
        html += `<th style="text-align:left;padding:6px 4px;font-size:9px;color:var(--bt-grey-400);font-weight:600;">${t('sprint.colCalendar')}</th>`;
        html += `</tr></thead><tbody>`;

        unavailable.forEach(p => {
            const pctOff = Math.round((p.offDays / p.totalDays) * 100);
            const rowColor = p.offDays === p.totalDays ? 'var(--accent-red)' : pctOff >= 50 ? 'var(--accent-yellow)' : 'var(--bt-navy)';

            // Role badge class
            const roleSlug = p.role.toLowerCase().replace(/\s+/g, '-');

            // Mini calendar
            let calHtml = '<div style="display:flex;gap:1px;">';
            p.dayStatuses.forEach(ds => {
                let bg = '#d1fae5'; // available
                if (ds.status === 'off') bg = '#fee2e2';
                else if (ds.status === 'holiday') bg = '#e5e7eb';
                else if (ds.status === 'company-off') bg = '#e0e7ff';
                else if (ds.status === 'friday') bg = '#fef3c7';
                const dn = dayNames[ds.date.getDay()];
                const title = `${ds.date.getDate()}.${ds.date.getMonth()+1} (${dn}) — ${ds.status}`;
                calHtml += `<span title="${title}" style="width:16px;height:16px;border-radius:2px;background:${bg};display:inline-block;"></span>`;
            });
            calHtml += '</div>';

            html += `<tr style="border-bottom:1px solid var(--bt-grey-100);">`;
            html += `<td style="padding:5px 8px;font-weight:600;color:${rowColor};">${p.name}</td>`;
            html += `<td style="padding:5px 4px;"><span class="team-tag">${p.team}</span></td>`;
            html += `<td style="padding:5px 4px;"><span class="role-badge role-${roleSlug}" style="font-size:9px;">${p.role}</span></td>`;
            html += `<td style="text-align:center;padding:5px 4px;font-weight:700;color:${rowColor};">${p.offDays}/${p.totalDays}</td>`;
            html += `<td style="padding:5px 4px;">${calHtml}</td>`;
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        html += `<div style="margin-top:8px;font-size:10px;color:var(--bt-grey-400);">${t('sprint.totalUnavailable', { count: unavailable.length, total: PEOPLE.length })}</div>`;
    }

    container.innerHTML = html;
}

function renderCapacityTable(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const c = (a, e) => a > e ? 'var(--accent-red)' : a > 0 ? 'var(--accent-green)' : 'var(--bt-grey-600)';
    let html = `<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="border-bottom:2px solid var(--bt-grey-200);">`;
    html += `<th style="text-align:left;padding:4px 6px;font-size:9px;color:var(--bt-grey-400);">${t('cap.team')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.cap')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.avail')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.proj')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.bau')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.oh')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.scrum')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.maint')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.total')}</th>`;
    html += `<th style="text-align:center;padding:4px 3px;font-size:9px;color:var(--bt-grey-400);">${t('cap.free')}</th>`;
    html += `</tr></thead><tbody>`;
    data.teams.forEach(d => {
        const fc = d.free < 0 ? 'var(--accent-red)' : d.free < 2 ? 'var(--accent-yellow)' : 'var(--accent-green)';
        html += `<tr style="border-bottom:1px solid var(--bt-grey-100);">`;
        html += `<td style="padding:5px 6px;font-weight:700;color:${d.team.color};font-size:10px;">${d.team.name}</td>`;
        html += `<td style="text-align:center;padding:3px;">${d.capRaw.toFixed(0)}</td>`;
        html += `<td style="text-align:center;padding:3px;font-weight:600;">${d.md.toFixed(0)}</td>`;
        html += `<td style="text-align:center;padding:3px;color:${c(d.aP,d.eP)};">${d.aP.toFixed(0)}<span style="font-size:8px;color:var(--bt-grey-400);">/${d.eP.toFixed(0)}</span></td>`;
        html += `<td style="text-align:center;padding:3px;color:${c(d.aB,d.eB)};">${d.aB.toFixed(0)}<span style="font-size:8px;color:var(--bt-grey-400);">/${d.eB.toFixed(0)}</span></td>`;
        html += `<td style="text-align:center;padding:3px;color:${c(d.aO,d.eO)};">${d.aO.toFixed(0)}<span style="font-size:8px;color:var(--bt-grey-400);">/${d.eO.toFixed(0)}</span></td>`;
        html += `<td style="text-align:center;padding:3px;color:${c(d.aS,d.eS)};">${d.aS.toFixed(0)}<span style="font-size:8px;color:var(--bt-grey-400);">/${d.eS.toFixed(0)}</span></td>`;
        html += `<td style="text-align:center;padding:3px;color:${c(d.aM,d.eM)};">${d.aM.toFixed(0)}<span style="font-size:8px;color:var(--bt-grey-400);">/${d.eM.toFixed(0)}</span></td>`;
        html += `<td style="text-align:center;padding:3px;font-weight:600;">${d.alloc.toFixed(0)}</td>`;
        html += `<td style="text-align:center;padding:3px;font-weight:700;color:${fc};">${d.free.toFixed(0)}</td>`;
        html += `</tr>`;
    });
    const totals = data.totals;
    const sf = totals.sFree<0?'var(--accent-red)':totals.sFree<5?'var(--accent-yellow)':'var(--accent-green)';
    html += `</tbody><tfoot><tr style="background:var(--bt-navy);">`;
    html += `<td style="padding:5px 6px;font-weight:700;color:var(--bt-white);font-size:9px;">${t('cap.sum')}</td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sCapRaw.toFixed(0)}</td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sMD.toFixed(0)}</td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sProj.toFixed(0)}<span style="font-size:7px;opacity:0.6;">/${totals.sExpProj.toFixed(0)}</span></td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sBau.toFixed(0)}<span style="font-size:7px;opacity:0.6;">/${totals.sExpBau.toFixed(0)}</span></td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sOH.toFixed(0)}<span style="font-size:7px;opacity:0.6;">/${totals.sExpOH.toFixed(0)}</span></td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sScr.toFixed(0)}<span style="font-size:7px;opacity:0.6;">/${totals.sExpScr.toFixed(0)}</span></td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sMnt.toFixed(0)}<span style="font-size:7px;opacity:0.6;">/${totals.sExpMnt.toFixed(0)}</span></td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:var(--bt-white);">${totals.sAlloc.toFixed(0)}</td>`;
    html += `<td style="text-align:center;padding:3px;font-weight:700;color:${sf};">${totals.sFree.toFixed(0)}</td>`;
    html += `</tr></tfoot></table>`;
    container.innerHTML = html;
}

function renderCapacityChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const maxMD = Math.max(...data.teams.map(d => d.md), 1);
    let html = `<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0;">`;
    data.teams.forEach(d => {
        const pP = d.md>0?(d.aP/d.md*100):0;
        const pB = d.md>0?(d.aB/d.md*100):0;
        const pO = d.md>0?(d.aO/d.md*100):0;
        const pS = d.md>0?(d.aS/d.md*100):0;
        const pM = d.md>0?(d.aM/d.md*100):0;
        const used = Math.round(pP+pB+pO+pS+pM);
        html += `<div style="display:flex;align-items:center;gap:6px;">`;
        html += `<span style="font-size:9px;font-weight:700;color:${d.team.color};min-width:55px;">${d.team.name}</span>`;
        html += `<div style="flex:1;height:14px;background:var(--bt-grey-100);border-radius:3px;overflow:hidden;display:flex;">`;
        if (pP>0) html += `<div style="width:${pP}%;background:var(--bt-cyan);" title="${t('legend.proj')} ${d.aP.toFixed(0)}"></div>`;
        if (pB>0) html += `<div style="width:${pB}%;background:#f59e0b;" title="BAU ${d.aB.toFixed(0)}"></div>`;
        if (pO>0) html += `<div style="width:${pO}%;background:#8b5cf6;" title="OH ${d.aO.toFixed(0)}"></div>`;
        if (pS>0) html += `<div style="width:${pS}%;background:#ec4899;" title="Scrum ${d.aS.toFixed(0)}"></div>`;
        if (pM>0) html += `<div style="width:${pM}%;background:#64748b;" title="Maint ${d.aM.toFixed(0)}"></div>`;
        html += `</div>`;
        html += `<span style="font-size:9px;color:var(--bt-grey-400);min-width:28px;">${used}%</span>`;
        html += `</div>`;
    });
    html += `<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">`;
    html += `<span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:var(--bt-cyan);"></span>Proj</span>`;
    html += `<span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:#f59e0b;"></span>BAU</span>`;
    html += `<span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:#8b5cf6;"></span>OH</span>`;
    html += `<span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:#ec4899;"></span>Scr</span>`;
    html += `<span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="width:8px;height:8px;border-radius:2px;background:#64748b;"></span>Mnt</span>`;
    html += `</div></div>`;
    container.innerHTML = html;
}

function renderProjectsTable() {
    const tbody = document.getElementById('projects-table');

    const CATEGORIES = [
        { id: 'project', label: t('cat.project') },
        { id: 'bau', label: t('cat.bau') },
        { id: 'overhead', label: t('cat.overhead') },
        { id: 'scrum', label: t('cat.scrum') },
        { id: 'maintenance', label: t('cat.maintenance') },
    ];

    // Projects without category = 'project'
    const categorized = {};
    CATEGORIES.forEach(c => { categorized[c.id] = []; });
    PROJECTS.forEach(p => {
        const cat = p.category || 'project';
        if (!categorized[cat]) categorized[cat] = [];
        categorized[cat].push(p);
    });

    // Sort each category by priority
    const sortByPrio = (arr) => [...arr].sort((a, b) => {
        const aNum = parseInt(a.priority);
        const bNum = parseInt(b.priority);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return aNum - bNum;
    });

    // Update projects count (only 'project' category)
    document.getElementById('projects-count').textContent = categorized.project.length;

    // Render main projects table
    tbody.innerHTML = sortByPrio(categorized.project).map(p => renderProjectRow(p)).join('');

    // Bind events for main table
    bindProjectTableEvents(tbody);

    // Render other category sections
    const otherContainer = document.getElementById('other-projects');
    let otherHtml = '';

    CATEGORIES.slice(1).forEach(cat => {
        const items = categorized[cat.id];
        if (items.length === 0) return;
        otherHtml += `<div class="table-container" style="margin-top:20px;">
            <div class="table-header"><h3>${cat.label} (${items.length})</h3></div>
            <div class="projects-table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th class="cell-prio">Prio</th><th class="cell-name">Projekt</th><th class="cell-status">Status</th><th class="cell-lead">IT Lead</th><th class="cell-teams">Zespoły</th><th class="cell-delivery">Termin</th><th class="cell-risks">Ryzyka</th><th class="cell-notes">Notatki</th><th class="cell-actions"></th>
                        </tr>
                    </thead>
                    <tbody>${sortByPrio(items).map(p => renderProjectRow(p)).join('')}</tbody>
                </table>
            </div>
        </div>`;
    });

    otherContainer.innerHTML = otherHtml;
    bindProjectTableEvents(otherContainer);

    renderArchivedProjects();

    // Enable column drag & resize (temporary tool)
    setTimeout(() => enableColumnReorder(), 100);
}

function bindProjectTableEvents(container) {
    container.querySelectorAll('.project-name-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openProjectDetail(parseInt(e.target.dataset.id));
        });
    });
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { startInlineEdit(parseInt(e.target.dataset.id)); });
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { deleteProject(parseInt(e.target.dataset.id)); });
    });
    container.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { openAddNote(parseInt(e.target.dataset.id), e.target); });
    });
    container.querySelectorAll('.add-risk-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { openAddRisk(parseInt(e.target.dataset.id), e.target); });
    });
    container.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const type = e.target.dataset.type;
            openViewAllPopup(id, type);
        });
    });
}

function renderOtherProjects(otherItems) {
    const container = document.getElementById('other-projects');
    if (otherItems.length === 0) { container.innerHTML = ''; return; }

    let html = `<div class="table-container" style="margin-top:24px;">
        <div class="table-header"><h3>Inne (${otherItems.length})</h3></div>
        <div class="projects-table-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Prio</th><th>Nazwa</th><th>Status</th><th>IT Lead</th><th>Zespoły</th><th>Termin</th><th>Ryzyka</th><th>Notatki</th><th>Akcje</th>
                    </tr>
                </thead>
                <tbody>${otherItems.map(p => renderProjectRow(p)).join('')}</tbody>
            </table>
        </div>
    </div>`;
    container.innerHTML = html;

    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { startInlineEdit(parseInt(e.target.dataset.id)); });
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { deleteProject(parseInt(e.target.dataset.id)); });
    });
    container.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { openAddNote(parseInt(e.target.dataset.id), e.target); });
    });
    container.querySelectorAll('.move-to-other-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { moveProjectToCategory(parseInt(e.target.dataset.id), 'other'); });
    });
    container.querySelectorAll('.move-to-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { moveProjectToCategory(parseInt(e.target.dataset.id), 'project'); });
    });
}

function renderProjectRow(p) {
    // Handle both old string format and new object format for notes
    const notesArr = p.notes || [];
    const notesFormatted = notesArr.map(n => 
        typeof n === 'object' ? `${n.content} (${n.author}, ${n.type})` : n
    );
    const notesLast = notesFormatted.length > 0 ? `<div class="note-entry">${notesFormatted[notesFormatted.length - 1]}</div>` : '';
    const notesHasMore = notesFormatted.length > 1;

    // Handle both old string format and new object format for risks
    const risksArr = Array.isArray(p.risks) ? p.risks : (p.risks ? [p.risks] : []);
    const risksFormatted = risksArr.map(r => 
        typeof r === 'object' ? `${r.description} (${r.owner}, ${r.status})` : r
    );
    const risksLast = risksFormatted.length > 0 ? `<div class="note-entry">${risksFormatted[risksFormatted.length - 1]}</div>` : '';
    const risksHasMore = risksFormatted.length > 1;

    // Normalize status and health for display
    const normStatus = normalizeStatus(p.status);
    const normHealth = normalizeHealth(p.health || 'green');
    const healthIcon = HEALTH_LEVELS[normHealth]?.icon || '🟢';

    // Display priority with color coding by ranges: 0-3=p0 (red), 4-10=p1 (yellow), 11-20=p2 (cyan), 21-30=p3 (purple), 31+=p4 (green), N/A=pna (grey)
    let prioClass = 'pna';
    let displayPrio = p.priority;
    if (p.priority === 'N/A') {
        prioClass = 'pna';
        displayPrio = 'N/A';
    } else {
        const prioNum = parseInt(p.priority);
        if (!isNaN(prioNum)) {
            if (prioNum <= 3) prioClass = 'p0';           // 0-3: red
            else if (prioNum <= 10) prioClass = 'p1';     // 4-10: yellow
            else if (prioNum <= 20) prioClass = 'p2';     // 11-20: cyan
            else if (prioNum <= 30) prioClass = 'p3';     // 21-30: purple
            else prioClass = 'p4';                         // 31+: green
        }
    }

    return `
        <tr data-id="${p.id}">
            <td class="cell-prio"><span class="priority-badge ${prioClass}">${displayPrio}</span></td>
            <td class="cell-name"><strong><a href="#" class="project-name-link" data-id="${p.id}" style="color:var(--bt-navy);text-decoration:none;">${p.shortName || p.name}</a></strong></td>
            <td class="cell-status"><span class="status-chip ${normStatus}">${getStatusLabel(normStatus, getLang())}</span></td>
            <td class="cell-health"><span class="health-badge ${normHealth}" title="${getHealthLabel(normHealth, getLang())}">${healthIcon}</span></td>
            <td class="cell-lead" style="color:var(--text-secondary)">${p.lead || '—'}</td>
            <td class="cell-teams">
                <div class="team-tags">
                    ${(p.teams || []).map(t => `<span class="team-tag">${t}</span>`).join('')}
                </div>
            </td>
            <td class="cell-delivery" style="color:var(--text-secondary)">${p.delivery || '—'}</td>
            <td class="cell-risks">
                <div style="display:flex;gap:4px;align-items:center;justify-content:flex-end;">
                    ${risksArr.length > 0 ? `<span style="font-size:9px;color:var(--accent-red);font-weight:700;">${risksArr.length}</span>` : ''}
                    ${risksArr.length > 0 ? `<button class="view-all-btn" data-id="${p.id}" data-type="risks" title="Pokaż ryzyka">…</button>` : ''}
                    <button class="add-note-btn add-risk-btn" data-id="${p.id}" title="${t('proj.addRisk')}">+</button>
                </div>
            </td>
            <td class="cell-notes">
                <div style="display:flex;gap:4px;align-items:center;justify-content:flex-end;">
                    ${notesArr.length > 0 ? `<span style="font-size:9px;color:var(--bt-cyan-dark);font-weight:700;">${notesArr.length}</span>` : ''}
                    ${notesArr.length > 0 ? `<button class="view-all-btn" data-id="${p.id}" data-type="notes" title="${t('proj.showNotes')}">…</button>` : ''}
                    <button class="add-note-btn" data-id="${p.id}" title="${t('proj.addNote')}">+</button>
                </div>
            </td>
            <td class="cell-actions">
                <button class="edit-btn" data-id="${p.id}" title="${t('proj.edit')}">✎</button>
                <button class="delete-btn" data-id="${p.id}" title="${t('proj.delete')}">×</button>
            </td>
        </tr>
    `;
}

const STATUS_OPTIONS = getStatusValues(true); // Include all statuses including Archived
const HEALTH_OPTIONS = getHealthValues();
const ALL_TEAMS_LIST = ['ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA', 'IT DELIVERY'];

function startInlineEdit(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;
    const row = document.querySelector(`tr[data-id="${projectId}"]`);
    if (!row) return;

    // Replace cells with inputs
    row.querySelector('.cell-prio').innerHTML = `<input class="inline-edit" type="text" value="${project.priority}" data-field="priority" style="width:40px;" />`;
    row.querySelector('.cell-name').innerHTML = `<input class="inline-edit" type="text" value="${project.name}" data-field="name" style="width:100%;" />`;

    const statusSelect = `<select class="inline-edit" data-field="status">
        ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === project.status ? 'selected' : ''}>${getStatusLabel(s, getLang())}</option>`).join('')}
    </select>`;
    row.querySelector('.cell-status').innerHTML = statusSelect;

    const healthSelect = `<select class="inline-edit" data-field="health">
        ${HEALTH_OPTIONS.map(h => `<option value="${h}" ${h === (project.health || 'green') ? 'selected' : ''}>${getHealthLabel(h, getLang())}</option>`).join('')}
    </select>`;
    row.querySelector('.cell-health').innerHTML = healthSelect;

    row.querySelector('.cell-lead').innerHTML = `<input class="inline-edit" type="text" value="${project.lead || ''}" data-field="lead" />`;

    const teamsCheckboxes = ALL_TEAMS_LIST.map(t => {
        const checked = (project.teams || []).includes(t) ? 'checked' : '';
        return `<label class="team-check-label"><input type="checkbox" value="${t}" ${checked} />${t}</label>`;
    }).join('');
    row.querySelector('.cell-teams').innerHTML = `<div class="teams-edit">${teamsCheckboxes}</div>`;

    row.querySelector('.cell-delivery').innerHTML = `<input class="inline-edit" type="date" value="${project.delivery || ''}" data-field="delivery" />`;

    // Replace edit button with save/cancel
    row.querySelector('.cell-actions').innerHTML = `
        <div style="display:flex;gap:4px;">
            <button class="save-edit-btn" data-id="${projectId}" style="padding:3px 8px;font-size:10px;border:none;background:var(--bt-cyan);color:var(--bt-navy);border-radius:4px;cursor:pointer;font-weight:600;">OK</button>
            <button class="cancel-edit-btn" data-id="${projectId}" style="padding:3px 8px;font-size:10px;border:1px solid var(--bt-grey-200);background:var(--bt-white);color:var(--bt-navy);border-radius:4px;cursor:pointer;">✕</button>
        </div>
    `;

    row.querySelector('.save-edit-btn').addEventListener('click', () => saveInlineEdit(projectId));
    row.querySelector('.cancel-edit-btn').addEventListener('click', () => renderProjectsTable());
}

function saveInlineEdit(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;
    const row = document.querySelector(`tr[data-id="${projectId}"]`);
    if (!row) return;

    // Save old status BEFORE making changes
    const oldStatus = project.status;

    // Read values from inputs
    row.querySelectorAll('.inline-edit').forEach(input => {
        const field = input.dataset.field;
        if (field) {
            project[field] = input.value;
        }
    });

    // Read teams checkboxes
    const teamChecks = row.querySelectorAll('.teams-edit input[type="checkbox"]');
    project.teams = [];
    teamChecks.forEach(cb => {
        if (cb.checked) project.teams.push(cb.value);
    });

    // Normalize and validate fields (update in-place, don't reassign)
    const validated = validateProject(project);
    project.priority = validated.priority;
    project.status = validated.status;
    project.health = validated.health;

    // Mark done timestamp if transitioning to done
    if (oldStatus !== 'done' && project.status === 'done') {
        project.doneAt = new Date().toISOString();
    }

    saveProjects();
    renderProjectsTable();

    // Auto-move to archived if status is now done
    if (project.status === 'done') {
        // Wait for render to complete, then archive
        setTimeout(() => archiveProject(projectId), 100);
    }
}

function openAddNote(projectId, btnElement) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:500px;">
            <h3 style="margin-bottom:16px;">${t('proj.addNote')}</h3>
            <div class="modal-form">
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.noteType')}</span>
                    <select class="note-type-select" style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;">
                        ${Object.entries(NOTE_TYPES).map(([key, val]) => `<option value="${key}">${val.icon} ${t(`note.type.${key}`)}</option>`).join('')}
                    </select>
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.noteContent')}</span>
                    <textarea class="note-content-input" placeholder="Zawartość notatki..." style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;min-height:100px;resize:vertical;"></textarea>
                </label>
                <div style="display:flex;gap:8px;margin-top:16px;">
                    <button class="edit-btn note-save-btn" style="flex:1;">${t('proj.add')}</button>
                    <button class="delete-btn" style="flex:1;background:var(--bt-grey-200);color:var(--bt-navy);border:none;">${t('proj.cancel')}</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    overlay.querySelector('.note-save-btn').addEventListener('click', () => {
        const content = overlay.querySelector('.note-content-input').value.trim();
        const type = overlay.querySelector('.note-type-select').value;
        if (content) {
            if (!project.notes) project.notes = [];
            const newNote = {
                id: Math.random().toString(36).substr(2, 9),
                content: content,
                author: getCurrentUser(),
                type: type,
                createdAt: new Date().toISOString()
            };
            project.notes.push(newNote);
            saveProjects();
            renderProjectsTable();
            closeModal();
        }
    });

    overlay.querySelector('.delete-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    overlay.querySelector('.note-content-input').focus();
}

function openAddRisk(projectId, btnElement) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <h3 style="margin-bottom:16px;">${t('proj.addRisk')}</h3>
            <div class="modal-form">
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskDescription')}</span>
                    <textarea class="risk-desc-input" placeholder="Opis ryzyka..." style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;min-height:80px;resize:vertical;"></textarea>
                </label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <label style="display:flex;flex-direction:column;gap:4px;">
                        <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskImpact')}</span>
                        <select class="risk-impact-select" style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;">
                            ${Object.entries(RISK_LEVELS).map(([key, val]) => `<option value="${key}">${val.icon} ${t(`risk.level.${key}`)}</option>`).join('')}
                        </select>
                    </label>
                    <label style="display:flex;flex-direction:column;gap:4px;">
                        <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskProbability')}</span>
                        <select class="risk-prob-select" style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;">
                            ${Object.entries(RISK_LEVELS).map(([key, val]) => `<option value="${key}">${val.icon} ${t(`risk.level.${key}`)}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskOwner')}</span>
                    <input type="text" class="risk-owner-input" placeholder="Imię i nazwisko..." style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;" />
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskMitigation')}</span>
                    <textarea class="risk-miti-input" placeholder="Plan mitygacji..." style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;min-height:80px;resize:vertical;"></textarea>
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;color:var(--bt-navy);">${t('proj.riskDueDate')}</span>
                    <input type="date" class="risk-due-input" style="padding:8px;border:1px solid var(--bt-grey-200);border-radius:4px;font-size:12px;" />
                </label>
                <div style="display:flex;gap:8px;margin-top:16px;">
                    <button class="edit-btn risk-save-btn" style="flex:1;">${t('proj.add')}</button>
                    <button class="delete-btn" style="flex:1;background:var(--bt-grey-200);color:var(--bt-navy);border:none;">${t('proj.cancel')}</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    overlay.querySelector('.risk-save-btn').addEventListener('click', () => {
        const description = overlay.querySelector('.risk-desc-input').value.trim();
        const impact = overlay.querySelector('.risk-impact-select').value;
        const probability = overlay.querySelector('.risk-prob-select').value;
        const owner = overlay.querySelector('.risk-owner-input').value.trim();
        const mitigation = overlay.querySelector('.risk-miti-input').value.trim();
        const dueDate = overlay.querySelector('.risk-due-input').value;

        if (description) {
            if (!Array.isArray(project.risks)) {
                project.risks = project.risks ? [project.risks] : [];
            }
            const newRisk = {
                id: Math.random().toString(36).substr(2, 9),
                description: description,
                owner: owner || 'TBD',
                impact: impact,
                probability: probability,
                mitigation: mitigation,
                dueDate: dueDate,
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            project.risks.push(newRisk);
            saveProjects();
            renderProjectsTable();
            closeModal();
        }
    });

    overlay.querySelector('.delete-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    overlay.querySelector('.risk-desc-input').focus();
}

function openViewAllPopup(projectId, type) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const items = type === 'risks'
        ? (Array.isArray(project.risks) ? project.risks : (project.risks ? [project.risks] : []))
        : (project.notes || []);

    const title = type === 'risks' ? 'Ryzyka' : 'Notatki';

    // Workload notes for notes popup
    let workloadNotesHtml = '';
    if (type === 'notes' && project.workloadNotes && Object.keys(project.workloadNotes).length > 0) {
        workloadNotesHtml = `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--bt-grey-200);">
            <span style="font-size:10px;font-weight:700;color:var(--bt-grey-400);text-transform:uppercase;">Z obciążenia:</span>`;
        Object.entries(project.workloadNotes).forEach(([key, note]) => {
            const [tid, weekIdx] = key.split('_');
            const team = TEAMS.find(t => t.id === tid);
            const teamName = team ? team.name : tid;
            const weekLabel = ALL_WEEKS[parseInt(weekIdx)] ? ALL_WEEKS[parseInt(weekIdx)].label : `tydz. ${weekIdx}`;
            workloadNotesHtml += `<div class="note-entry" style="padding:4px 0;font-size:11px;"><span style="color:${team ? team.color : 'var(--bt-grey-400)'};font-weight:600;">${teamName}</span> <span style="color:var(--bt-grey-400);">(${weekLabel})</span>: ${note}</div>`;
        });
        workloadNotesHtml += `</div>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:500px;">
            <h3 style="margin-bottom:12px;">${project.name} — ${title}</h3>
            <div style="max-height:400px;overflow-y:auto;">
                ${items.length > 0
                    ? items.map(item => `<div class="note-entry" style="padding:6px 0;border-bottom:1px solid var(--bt-grey-100);">${item}</div>`).join('')
                    : '<p style="color:var(--bt-grey-400);font-size:12px;">Brak wpisów</p>'
                }
                ${workloadNotesHtml}
            </div>
            <div style="margin-top:16px;text-align:right;">
                <button class="edit-btn modal-close-btn">Zamknij</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function openAddProjectModal() {
    // Remove existing modal
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const teamsCheckboxes = ALL_TEAMS_LIST.map(t => {
        return `<label class="team-check-label"><input type="checkbox" value="${t}" />${t}</label>`;
    }).join('');

    // Build priority options
    const prioOptions = Object.entries(PRIORITY_LEVELS).map(([key, prio]) => {
        const label = getLang() === 'pl' ? prio.label_pl : prio.label_en;
        return `<option value="${key}">${label}</option>`;
    }).join('');

    // Build status options
    const statusOptions = getStatusValues(false).map(s => {
        const label = getStatusLabel(s, getLang());
        return `<option value="${s}">${label}</option>`;
    }).join('');

    // Build health options
    const healthOptions = getHealthValues().map(h => {
        const label = getHealthLabel(h, getLang());
        return `<option value="${h}">${label}</option>`;
    }).join('');

    overlay.innerHTML = `
        <div class="modal">
            <h3 style="margin-bottom:16px; color:var(--bt-navy);">Dodaj nową pozycję</h3>
            <div class="modal-form">
                <label>Kategoria
                    <select id="new-category" class="inline-edit">
                        <option value="project">Projekt</option>
                        <option value="bau">BAU</option>
                        <option value="overhead">Overhead</option>
                        <option value="scrum">Scrum</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </label>
                <label>Priorytet
                    <select id="new-prio" class="inline-edit">
                        ${prioOptions}
                    </select>
                </label>
                <label>Nazwa<input type="text" id="new-name" class="inline-edit" placeholder="Nazwa" /></label>
                <label>Status
                    <select id="new-status" class="inline-edit">
                        ${statusOptions}
                    </select>
                </label>
                <label>Zdrowie (Health)
                    <select id="new-health" class="inline-edit">
                        ${healthOptions}
                    </select>
                </label>
                <label>Business Owner<input type="text" id="new-bo" class="inline-edit" /></label>
                <label>IT Lead<input type="text" id="new-lead" class="inline-edit" /></label>
                <label>Termin<input type="date" id="new-delivery" class="inline-edit" /></label>
                <label>Zespoły<div class="teams-edit" id="new-teams">${teamsCheckboxes}</div></label>
                <label>Ryzyka / Problemy<input type="text" id="new-risks" class="inline-edit" /></label>
                <label>Notatka (opcjonalnie)<input type="text" id="new-note" class="inline-edit" placeholder="Pierwsza notatka..." /></label>
            </div>
            <div style="display:flex; gap:8px; margin-top:20px; justify-content:flex-end;">
                <button class="edit-btn modal-cancel-btn" style="background:var(--bt-grey-200);color:var(--bt-navy);">Anuluj</button>
                <button class="edit-btn modal-save-btn">Zapisz</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('.modal-save-btn').addEventListener('click', () => {
        const name = document.getElementById('new-name').value.trim();
        if (!name) { alert('Nazwa jest wymagana'); return; }

        const category = document.getElementById('new-category').value;
        const teams = [];
        document.querySelectorAll('#new-teams input[type="checkbox"]').forEach(cb => {
            if (cb.checked) teams.push(cb.value);
        });

        const notes = [];
        const noteText = document.getElementById('new-note').value.trim();
        if (noteText) {
            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
            notes.push(`${dateStr}: ${noteText}`);
        }

        const newId = PROJECTS.length > 0 ? Math.max(...PROJECTS.map(p => p.id)) + 1 : 1;

        const newProject = {
            id: newId,
            priority: document.getElementById('new-prio').value,
            status: document.getElementById('new-status').value,
            health: document.getElementById('new-health').value,
            name: name,
            businessOwner: document.getElementById('new-bo').value.trim(),
            lead: document.getElementById('new-lead').value.trim(),
            delivery: document.getElementById('new-delivery').value,
            teams: teams,
            risks: document.getElementById('new-risks').value.trim(),
            notes: notes,
            allocations: {},
            category: category !== 'project' ? category : 'project',
            createdAt: new Date().toISOString()
        };

        // Validate project
        newProject = validateProject(newProject);

        PROJECTS.push(newProject);

        saveProjects();
        renderProjectsTable();
        overlay.remove();
    });
}

// --- PROJECTS SAVE/LOAD ---

function saveProjects() {
    localStorage.setItem('cp_projects', JSON.stringify(PROJECTS));
}

function loadProjects() {
    const saved = localStorage.getItem('cp_projects');
    if (saved) {
        try {
            PROJECTS = JSON.parse(saved);
            // Auto-merge: add any new default projects not yet in saved data
            DEFAULT_PROJECTS.forEach(dp => {
                if (!PROJECTS.find(p => p.id === dp.id)) {
                    PROJECTS.push(JSON.parse(JSON.stringify(dp)));
                }
            });
            // Migrate and normalize all projects
            PROJECTS = PROJECTS.map(p => {
                // Normalize priority, status, health
                p = validateProject(p);
                
                // Migrate old 'other' category to specific categories
                if (p.category === 'other') {
                    const name = p.name.toLowerCase();
                    if (name.includes('bau') || name.includes('1st line') || name.includes('support')) {
                        p.category = 'bau';
                    } else if (name.includes('maintenance') || name.includes('test automation')) {
                        p.category = 'maintenance';
                    } else if (name.includes('cele') || name.includes('szkoleni') || name.includes('development')) {
                        p.category = 'overhead';
                    } else {
                        p.category = 'bau'; // default fallback for old 'other'
                    }
                }
                // Migrate risks from string to array
                if (p.risks && !Array.isArray(p.risks)) {
                    p.risks = p.risks.trim() ? [p.risks] : [];
                }
                if (!p.risks) p.risks = [];
                
                return p;
            });
        } catch (e) { /* use defaults */ }
    }
}

// --- ARCHIVED PROJECTS SAVE/LOAD ---

function saveArchived() {
    localStorage.setItem('cp_archived_projects', JSON.stringify(ARCHIVED_PROJECTS));
}

function loadArchived() {
    const saved = localStorage.getItem('cp_archived_projects');
    if (saved) {
        try {
            ARCHIVED_PROJECTS = JSON.parse(saved);
        } catch (e) { /* use empty array */ }
    }
}

function moveProjectToCategory(id, targetCategory) {
    const project = PROJECTS.find(p => p.id === id);
    if (!project) return;

    if (targetCategory === 'project') {
        delete project.category;
    } else {
        project.category = targetCategory;
    }

    saveProjects();
    renderProjectsTable();
}

function deleteProject(id) {
    const project = PROJECTS.find(p => p.id === id);
    if (!project) return;

    if (!confirm(`${t('confirm.deleteProject')} "${project.name}"?`)) return;

    // Remove from PROJECTS
    PROJECTS = PROJECTS.filter(p => p.id !== id);

    // Add archived date
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
    project.archivedDate = dateStr;

    // Add to ARCHIVED_PROJECTS
    ARCHIVED_PROJECTS.push(project);

    // Save both
    saveProjects();
    saveArchived();

    // Re-render
    renderProjectsTable();
}

function archiveProject(id) {
    const project = PROJECTS.find(p => p.id === id);
    if (!project) return;

    // Set status to archived
    project.status = 'archived';

    // Remove from PROJECTS
    PROJECTS = PROJECTS.filter(p => p.id !== id);

    // Add archived date
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
    project.archivedDate = dateStr;

    // Add to ARCHIVED_PROJECTS
    ARCHIVED_PROJECTS.push(project);

    // Save both
    saveProjects();
    saveArchived();

    // Re-render
    renderProjectsTable();
}

function restoreProject(id) {
    const project = ARCHIVED_PROJECTS.find(p => p.id === id);
    if (!project) return;

    // Remove from archive
    ARCHIVED_PROJECTS = ARCHIVED_PROJECTS.filter(p => p.id !== id);

    // Remove archivedDate field
    delete project.archivedDate;

    // Add back to PROJECTS
    PROJECTS.push(project);

    // Save both
    saveProjects();
    saveArchived();

    // Re-render
    renderProjectsTable();
}

function renderArchivedProjects() {
    const container = document.getElementById('archived-projects');
    if (!container) return;

    if (ARCHIVED_PROJECTS.length === 0) {
        container.innerHTML = '';
        return;
    }

    const rows = ARCHIVED_PROJECTS.map(p => {
        const statusClass = p.status || '';
        return `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td><span class="status-chip ${statusClass}">${(p.status || '').replace('-', ' ')}</span></td>
                <td style="color:var(--text-secondary)">${p.businessOwner || '—'}</td>
                <td style="color:var(--text-secondary)">${p.lead || '—'}</td>
                <td style="color:var(--text-secondary)">${p.archivedDate || '—'}</td>
                <td>
                    <button class="restore-btn" data-id="${p.id}">Przywróć</button>
                    <button class="delete-btn archive-delete-btn" data-id="${p.id}" title="Usuń" style="margin-left:4px;">×</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="archive-section">
            <div class="archive-header" id="archive-toggle">
                <span>📁</span>
                <span>Historia zamkniętych projektów (${ARCHIVED_PROJECTS.length})</span>
            </div>
            <div id="archive-table-wrapper" style="display:none;">
                <table class="archive-table">
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Status</th>
                            <th>Business Owner</th>
                            <th>IT Lead</th>
                            <th>Data zamknięcia</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;

    // Toggle visibility
    container.querySelector('#archive-toggle').addEventListener('click', () => {
        const wrapper = container.querySelector('#archive-table-wrapper');
        wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
    });

    // Bind restore buttons
    container.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            restoreProject(id);
        });
    });

    // Bind delete buttons in archive
    container.querySelectorAll('.archive-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const project = ARCHIVED_PROJECTS.find(p => p.id === id);
            if (!project) return;
            if (!confirm(`Trwale usunąć "${project.name}" z historii?`)) return;
            
            // Save scroll position and archive state
            const archiveContainer = document.getElementById('archived-projects');
            const wasOpen = archiveContainer?.querySelector('#archive-table-wrapper')?.style.display === 'block';
            const scrollPos = archiveContainer?.offsetTop || 0;
            
            // Delete project
            ARCHIVED_PROJECTS = ARCHIVED_PROJECTS.filter(p => p.id !== id);
            saveArchived();
            renderArchivedProjects();
            
            // Restore archive state and scroll
            setTimeout(() => {
                if (wasOpen) {
                    const wrapper = document.getElementById('archived-projects')?.querySelector('#archive-table-wrapper');
                    if (wrapper) wrapper.style.display = 'block';
                }
                // Scroll to archive section
                if (scrollPos > 0) {
                    window.scrollTo({ top: scrollPos - 100, behavior: 'smooth' });
                }
            }, 50);
        });
    });
}

function renderWorkloadGrid() {
    const container = document.getElementById('workload-grid');

    // Visible weeks slice based on offset
    const visibleWeeks = ALL_WEEKS.slice(workloadOffset, workloadOffset + WEEKS_PER_PAGE);

    // Group weeks by month for colspan header
    const monthGroups = [];
    visibleWeeks.forEach(w => {
        const last = monthGroups[monthGroups.length - 1];
        if (last && last.month === w.month) {
            last.count++;
        } else {
            monthGroups.push({ month: w.month, count: 1 });
        }
    });

    let html = `<table class="workload-table">`;

    // Row 1: month colspan headers
    html += `<thead>`;
    html += `<tr class="hdr-row hdr-row-1">`;
    html += `<th class="col-project hdr-frozen">Projekt</th>`;
    html += `<th class="col-team hdr-frozen">Zespół</th>`;
    monthGroups.forEach(mg => {
        html += `<th class="col-month" colspan="${mg.count}">${mg.month}</th>`;
    });
    html += `</tr>`;

    // Row 2: sprint headers (grouped by sprint span)
    const sprintGroups = [];
    visibleWeeks.forEach(w => {
        const weekStart = new Date(BASE_DATE);
        weekStart.setDate(BASE_DATE.getDate() + w.dataIdx * 7);
        const sprint = findSprintForDate(weekStart);
        const sprintLabel = sprint ? sprint.name.replace('Sprint ', 'S') : '—';
        const last = sprintGroups[sprintGroups.length - 1];
        if (last && last.label === sprintLabel) {
            last.count++;
        } else {
            sprintGroups.push({ label: sprintLabel, count: 1, isCurrent: sprint ? isCurrentSprint(sprint) : false });
        }
    });

    html += `<tr class="hdr-row hdr-row-2" style="background:var(--bt-navy-light);">`;
    html += `<th class="col-project hdr-frozen"></th>`;
    html += `<th class="col-team hdr-frozen"></th>`;
    sprintGroups.forEach(sg => {
        const cls = sg.isCurrent ? 'wl-sprint-current' : '';
        html += `<th colspan="${sg.count}" class="wl-sprint-header ${cls}">${sg.label}${sg.isCurrent ? ' ●' : ''}</th>`;
    });
    html += `</tr>`;

    // Row 3: individual week headers
    html += `<tr class="hdr-row hdr-row-3">`;
    html += `<th class="col-project hdr-frozen"></th>`;
    html += `<th class="col-team hdr-frozen"></th>`;
    visibleWeeks.forEach(w => {
        const [from, to] = w.label.split(' – ');
        html += `<th class="col-week"><span class="week-from">${from}–${to}</span></th>`;
    });
    html += `</tr>`;

    // Row 4: working days per week
    html += `<tr class="hdr-row hdr-row-4" style="background:var(--bt-navy-dark);">`;
    html += `<th class="col-project hdr-frozen"></th>`;
    html += `<th class="col-team hdr-frozen"></th>`;
    visibleWeeks.forEach(w => {
        const weekStart = new Date(BASE_DATE);
        weekStart.setDate(BASE_DATE.getDate() + w.dataIdx * 7);
        const wd = countWorkDaysInWeek(weekStart);
        html += `<th style="text-align:center;font-size:9px;padding:3px 2px;color:var(--bt-grey-400);font-weight:700;">${Math.round(wd)} d</th>`;
    });
    html += `</tr></thead>`;

    // Project rows — show ALL projects with their assigned teams
    html += `<tbody>`;

    // Utilisation per team rows
    TEAMS.forEach(team => {
        html += `<tr style="background:rgba(0,186,199,0.03);">`;
        html += `<td style="padding:3px 8px;font-size:10px;font-weight:600;color:${team.color};border-right:2px solid var(--bt-grey-200);background:var(--bt-grey-50);position:sticky;left:0;" colspan="2">${team.name}</td>`;
        visibleWeeks.forEach(w => {
            const i = w.dataIdx;
            const cap = getCapacity(team.id, i);
            const alloc = PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[i] || 0), 0);
            const pct = cap > 0 ? Math.round((alloc / cap) * 100) : 0;
            const color = pct > 100 ? 'var(--accent-red)' : pct > 85 ? 'var(--accent-yellow)' : pct > 0 ? 'var(--bt-cyan-dark)' : 'var(--bt-grey-400)';
            html += `<td style="text-align:center;font-size:10px;font-weight:600;color:${color};padding:3px 2px;">${pct}%</td>`;
        });
        html += `</tr>`;
    });
    html += `<tr><td colspan="${visibleWeeks.length + 2}" style="border:none;padding:0;height:4px;border-bottom:2px solid var(--bt-grey-200);"></td></tr>`;

    // Sort projects: numeric priority first, then N/A. Exclude done.
    const allProjects = [...PROJECTS].filter(p => p.status !== 'done').sort((a, b) => {
        const aNum = parseInt(a.priority);
        const bNum = parseInt(b.priority);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return aNum - bNum;
    });

    const teamColor = (teamName) => {
        const found = TEAMS.find(tm => tm.name === teamName);
        return found ? found.color : '#8a9bb0';
    };
    const teamId = (teamName) => {
        const found = TEAMS.find(tm => tm.name === teamName);
        return found ? found.id : teamName.toLowerCase().replace(/\s+/g, '_');
    };

    allProjects.forEach(project => {
        const teams = project.teams || [];
        if (teams.length === 0) return; // skip projects with no teams assigned

        // Ensure allocations object exists for each team
        teams.forEach(tName => {
            const tid = teamId(tName);
            if (!project.allocations[tid]) {
                project.allocations[tid] = {};
            }
        });

        const normPrio = normalizePriority(project.priority, project.category);
        const displayPrio = (normPrio === 'N/A') ? 'N/A' : normPrio;
        let prioClass = 'pna';
        if (normPrio !== 'N/A') {
            const prioNum = parseInt(normPrio);
            if (!isNaN(prioNum)) {
                if (prioNum <= 3) prioClass = 'p0';
                else if (prioNum <= 10) prioClass = 'p1';
                else if (prioNum <= 20) prioClass = 'p2';
                else if (prioNum <= 30) prioClass = 'p3';
                else prioClass = 'p4';
            }
        }

        teams.forEach((tName, idx) => {
            const tid = teamId(tName);
            const isFirst = idx === 0;
            const rowspan = teams.length;

            html += `<tr class="${isFirst ? 'project-first-row' : 'project-cont-row'}">`;

            if (isFirst) {
                html += `<td class="col-project" rowspan="${rowspan}">
                    <div class="project-label">
                        <span class="prio-dot ${prioClass}">${project.priority}</span>
                        ${project.name}
                    </div>
                </td>`;
            }

            html += `<td class="col-team">
                <span class="team-pill" style="border-left: 3px solid ${teamColor(tName)}">${tName}</span>
                <button class="remove-team-from-project" data-pid="${project.id}" data-team="${tName}" title="Usuń zespół z projektu" style="border:none;background:none;color:var(--accent-red);font-size:12px;font-weight:700;cursor:pointer;margin-left:4px;">×</button>
            </td>`;

            visibleWeeks.forEach(w => {
                const val = project.allocations[tid]?.[w.dataIdx] || 0;
                const cls = val > 0 ? 'has-value' : '';
                const noteKey = `${tid}_${w.dataIdx}`;
                if (!project.workloadNotes) project.workloadNotes = {};
                const hasNote = project.workloadNotes[noteKey];
                html += `<td class="col-value ${cls}">
                    <div class="wl-cell-wrap">
                        <input type="number" class="wl-input" data-pid="${project.id}" data-team="${tid}" data-week="${w.dataIdx}" value="${val > 0 ? val : ''}" min="0" step="0.5" />
                        <button class="wl-note-btn ${hasNote ? 'has-note' : ''}" data-pid="${project.id}" data-key="${noteKey}" title="${hasNote || 'Dodaj notatkę'}">+</button>
                    </div>
                </td>`;
            });

            html += `</tr>`;
        });
    });

    // Totals row per team
    html += `<tr class="totals-row">`;
    html += `<td class="col-project totals-label" colspan="2">Σ ${t('workload.totalsLabel')}</td>`;
    visibleWeeks.forEach(w => {
        const i = w.dataIdx;
        const total = PROJECTS.reduce((sum, p) =>
            sum + Object.values(p.allocations).reduce((s, wk) => s + (wk[i] || 0), 0), 0);
        const totalCap = TEAMS.reduce((sum, t) => sum + getCapacity(t.id, i), 0);
        const cls = totalCap > 0 && total > totalCap ? 'overloaded' : totalCap > 0 && total / totalCap > 0.85 ? 'warning' : 'ok';
        html += `<td class="col-value totals-cell ${cls}">${total.toFixed(0)}<span class="cap-slash">/${totalCap.toFixed(0)}</span></td>`;
    });
    html += `</tr></tbody></table>`;

    container.innerHTML = html;

    // Bind editable inputs
    container.querySelectorAll('.wl-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const pid = parseInt(e.target.dataset.pid);
            const tid = e.target.dataset.team;
            const weekIdx = parseInt(e.target.dataset.week);
            const val = parseFloat(e.target.value) || 0;

            const project = PROJECTS.find(p => p.id === pid);
            if (project) {
                if (!project.allocations[tid]) project.allocations[tid] = {};
                project.allocations[tid][weekIdx] = val;
            }

            e.target.closest('td').className = 'col-value ' + (val > 0 ? 'has-value' : '');

            saveAllocations();
            updateTotalsRow();
        });

        input.addEventListener('focus', (e) => e.target.select());
    });

    // Bind workload note buttons
    container.querySelectorAll('.wl-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pid = parseInt(btn.dataset.pid);
            const key = btn.dataset.key;
            const project = PROJECTS.find(p => p.id === pid);
            if (!project) return;
            if (!project.workloadNotes) project.workloadNotes = {};

            const existing = project.workloadNotes[key] || '';
            const text = prompt('Notatka:', existing);
            if (text === null) return; // cancelled

            if (text.trim()) {
                const user = getCurrentUser();
                const now = new Date();
                const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
                project.workloadNotes[key] = `${dateStr} [${user}]: ${text.trim()}`;
                btn.classList.add('has-note');
                btn.title = project.workloadNotes[key];
            } else {
                delete project.workloadNotes[key];
                btn.classList.remove('has-note');
                btn.title = 'Dodaj notatkę';
            }
            saveProjects();
        });
    });

    // Bind remove team from project buttons
    container.querySelectorAll('.remove-team-from-project').forEach(btn => {
        btn.addEventListener('click', () => {
            const pid = parseInt(btn.dataset.pid);
            const teamName = btn.dataset.team;
            const project = PROJECTS.find(p => p.id === pid);
            if (!project) return;
            if (!confirm(`Usunąć zespół "${teamName}" z projektu "${project.name}"?`)) return;

            // Remove team from project.teams
            project.teams = project.teams.filter(t => t !== teamName);

            // Remove allocations for this team
            const tid = teamId(teamName);
            delete project.allocations[tid];

            saveProjects();
            saveAllocations();
            renderWorkloadGrid();
        });
    });

    // Update nav label and button states
    updateWorkloadNav();

    // Fix sticky header top offsets dynamically based on actual rendered heights
    fixStickyHeaderOffsets();
}

function fixStickyHeaderOffsets() {
    const wrapper = document.querySelector('.weekly-grid-wrapper');
    const nav = wrapper ? wrapper.querySelector('.week-nav') : null;
    const table = wrapper ? wrapper.querySelector('.workload-table') : null;
    if (!table || !nav) return;

    const navHeight = nav.offsetHeight;
    const theadRows = table.querySelectorAll('thead tr');
    let cumTop = navHeight;

    theadRows.forEach((row, idx) => {
        const cells = row.querySelectorAll('th');
        cells.forEach(cell => {
            cell.style.top = cumTop + 'px';
        });
        cumTop += row.offsetHeight;
    });
}

function saveAllocations() {
    const data = {};
    PROJECTS.forEach(p => {
        data[p.id] = p.allocations;
    });
    localStorage.setItem('cp_allocations', JSON.stringify(data));
}

function loadAllocations() {
    const saved = localStorage.getItem('cp_allocations');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            PROJECTS.forEach(p => {
                if (data[p.id]) {
                    p.allocations = data[p.id];
                }
            });
        } catch (e) { /* ignore corrupt data */ }
    }
}

function updateTotalsRow() {
    const visibleWeeks = ALL_WEEKS.slice(workloadOffset, workloadOffset + WEEKS_PER_PAGE);
    const totalsRow = document.querySelector('.totals-row');
    if (!totalsRow) return;

    const cells = totalsRow.querySelectorAll('.totals-cell');
    visibleWeeks.forEach((w, idx) => {
        const i = w.dataIdx;
        const total = PROJECTS.reduce((sum, p) =>
            sum + Object.values(p.allocations).reduce((s, wk) => s + (wk[i] || 0), 0), 0);
        const totalCap = TEAMS.reduce((sum, t) => sum + getCapacity(t.id, i), 0);
        const cls = totalCap > 0 && total > totalCap ? 'overloaded' : totalCap > 0 && total / totalCap > 0.85 ? 'warning' : 'ok';
        if (cells[idx]) {
            cells[idx].className = `col-value totals-cell ${cls}`;
            cells[idx].innerHTML = `${total.toFixed(0)}<span class="cap-slash">/${totalCap.toFixed(0)}</span>`;
        }
    });
}

function createNextSprints(count) {
    // Get the newest sprint (first in array since sorted newest-first)
    const newest = SPRINTS[0];
    const newestId = newest.id;
    
    // Parse the dates of newest sprint to calculate next ones
    // Format: "DD.MM - DD.MM" — each sprint is 2 weeks (10 business days)
    // We'll just increment the ID and generate placeholder dates
    for (let i = 1; i <= count; i++) {
        const newId = newestId + i;
        // Calculate approximate dates based on sprint cadence (2 weeks each)
        const baseDate = parseDateRange(newest.dates);
        const startDate = new Date(baseDate.end);
        startDate.setDate(startDate.getDate() + 1 + (i - 1) * 14);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 11); // 12 days span (2 work weeks)
        
        const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        SPRINTS.unshift({
            id: newId,
            name: `Sprint ${newId}`,
            dates: `${formatDate(startDate)} - ${formatDate(endDate)}`
        });
    }
    // Save to localStorage so new sprints persist
    localStorage.setItem('cp_sprints_custom', JSON.stringify(SPRINTS));
}

function parseDateRange(dateStr) {
    // Parse "DD.MM - DD.MM" format, assume current year 2026 if month > 6, else 2026
    const parts = dateStr.split(' - ');
    const [d1, m1] = parts[0].split('.').map(Number);
    const [d2, m2] = parts[1].split('.').map(Number);
    const year = 2026;
    return {
        start: new Date(year, m1 - 1, d1),
        end: new Date(year, m2 - 1, d2)
    };
}

function renderPeople() {
    const container = document.getElementById('people-grid');
    if (!container) return;

    // Sync OFF% from calendar time-off data
    syncAllPeopleOff();

    // Visible sprints (5 at a time, ascending from current sprint)
    const sprintsAsc = getSprintsFromCurrent();
    const visibleSprints = sprintsAsc.slice(sprintPageOffset, sprintPageOffset + 5);

    let html = '';

    // --- Team filter tabs (multi-select) ---
    html += `<div class="team-tabs">`;
    html += `<button class="team-tab ${activeTeamFilters.size === 0 ? 'active' : ''}" data-team-filter="all">Wszystkie</button>`;
    TEAMS.forEach(t => {
        const isSelected = activeTeamFilters.has(t.name);
        html += `<button class="team-tab ${isSelected ? 'active' : ''}" data-team-filter="${t.name}" data-is-role-filter="false">${t.name}</button>`;
    });
    html += `</div>`;

    // --- Role filter tabs (multi-select) ---
    html += `<div class="team-tabs">`;
    html += `<button class="team-tab ${activeRoleFilters.size === 0 ? 'active' : ''}" data-role-filter="all" data-is-role-filter="true">Wszystkie role</button>`;
    ROLES.forEach(role => {
        const isSelected = activeRoleFilters.has(role);
        html += `<button class="team-tab ${isSelected ? 'active' : ''}" data-role-filter="${role}" data-is-role-filter="true">${role}</button>`;
    });
    html += `</div>`;

    // --- Sprint pagination nav ---
    const firstVisible = visibleSprints[0];
    const lastVisible = visibleSprints[visibleSprints.length - 1];
    const canGoPrev = sprintPageOffset > 0;
    const canGoNext = sprintPageOffset + 5 < sprintsAsc.length;
    const atNewestEdge = !canGoNext;

    html += `<div class="people-sprint-nav">`;
    html += `<button id="people-sprint-prev" ${!canGoPrev ? 'disabled' : ''} style="padding:3px 8px;font-size:11px;">&#8592;</button>`;
    html += `<span class="sprint-range-label">${firstVisible ? firstVisible.name : ''} – ${lastVisible ? lastVisible.name : ''}</span>`;
    html += `<button id="people-sprint-next" ${!canGoNext ? 'disabled' : ''} style="padding:3px 8px;font-size:11px;">&#8594;</button>`;
    if (atNewestEdge) {
        html += `<button id="people-add-sprints" class="add-sprints-btn">+ Dodaj 5 sprintów</button>`;
    }
    html += `</div>`;

    // --- Team sections ---
    const allTeams = [...TEAMS];
    allTeams.forEach(team => {
        // Get people from main team + people with assignedTeams matching this team
        let members = PEOPLE.filter(p => p.team === team.name || (p.assignedTeams && p.assignedTeams.includes(team.name)));
        
        // Apply team filter (multi-select)
        if (activeTeamFilters.size > 0 && !activeTeamFilters.has(team.name)) {
            return; // Skip this team if not selected
        }
        
        // Apply role filter (multi-select)
        if (activeRoleFilters.size > 0) {
            members = members.filter(p => activeRoleFilters.has(p.role));
        }
        
        // Sort by role order
        members.sort((a, b) => (ROLE_SORT_ORDER[a.role] || 99) - (ROLE_SORT_ORDER[b.role] || 99));
        
        if (members.length === 0) return;

        html += `
        <div class="team-section" data-team="${team.name}">
            <div class="team-section-header">
                <span class="team-section-dot" style="background:${team.color}"></span>
                <span class="team-section-name">${team.name}</span>
                <span class="team-section-count">${members.length} osób</span>
            </div>
            <div class="people-table-scroll-wrapper">
            <table class="people-table">
                <thead>
                    <tr>
                        <th>Imię i nazwisko</th>
                        <th>Rola</th>
                        <th>Przydział</th>
                        ${visibleSprints.map(s => {
                            const sDates = parseSprintDatesForSort(s.dates);
                            const today = new Date();
                            const isCurrent = sDates && today >= sDates.start && today <= sDates.end;
                            return `<th class="sprint-col ${isCurrent ? 'sprint-col-current' : ''}"><div class="sprint-col-header"><span class="sprint-num">${s.name}${isCurrent ? ' <span class="current-badge">●</span>' : ''}</span><span class="sprint-dates">${s.dates}</span></div></th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${members.map(p => {
                        const sprintCells = visibleSprints.map(s => {
                            const assignments = (personAssignments[p.name] && personAssignments[p.name][s.id]) || [];
                            const hasOff = assignments.some(a => a.startsWith('OFF:'));
                            const offEntry = assignments.find(a => a.startsWith('OFF:'));
                            const offPct = offEntry ? parseInt(offEntry.split(':')[1]) : 0;
                            const tags = assignments.map((a, idx) => {
                                if (a.startsWith('OFF:')) {
                                    const pct = a.split(':')[1] || '100';
                                    return `<span class="sprint-assignment off-assignment">OFF ${pct}%</span>`;
                                }
                                return `<span class="sprint-assignment">${a}<span class="remove-assignment" data-person="${p.name}" data-sprint="${s.id}" data-idx="${idx}">×</span></span>`;
                            }).join('');
                            const sDatesCheck = parseSprintDatesForSort(s.dates);
                            const todayCheck = new Date();
                            const isCurrentCell = sDatesCheck && todayCheck >= sDatesCheck.start && todayCheck <= sDatesCheck.end;
                            const cellClass = (hasOff ? (offPct >= 50 ? 'sprint-cell-td off-cell off-critical' : 'sprint-cell-td off-cell') : 'sprint-cell-td') + (isCurrentCell ? ' sprint-cell-current' : '');
                            const nonOffAssignments = assignments.filter(a => !a.startsWith('OFF:'));
                            const showCopy = nonOffAssignments.length === 0;
                            return `<td class="${cellClass}"><div class="sprint-cell">${tags}<div class="sprint-cell-actions"><button class="add-assignment-btn" data-person="${p.name}" data-sprint="${s.id}" title="Dodaj przypisanie">+</button>${showCopy ? `<button class="copy-prev-btn" data-person="${p.name}" data-sprint="${s.id}" title="Kopiuj z poprzedniego sprintu">⧉</button>` : ''}</div></div></td>`;
                        }).join('');

                        return `
                    <tr>
                        <td class="person-name-cell">
                            <div class="person-name-inner">
                                <div class="avatar" style="background:${team.color}22; color:${team.color}">
                                    ${p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                                </div>
                                ${p.name}
                            </div>
                        </td>
                        <td class="role-cell"><span class="role-badge role-${p.role.replace(/\s+/g, '-').toLowerCase()}">${p.role}</span></td>
                        <td class="assigned-teams-cell"><span style="font-size:11px; color:var(--bt-grey-600);">${p.assignedTeams && p.assignedTeams.length > 0 ? p.assignedTeams.join(', ') : '—'}</span></td>
                        ${sprintCells}
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    // Apply persisted team filter on render (multi-select)
    if (activeTeamFilters.size > 0) {
        container.querySelectorAll('.team-section').forEach(section => {
            section.style.display = activeTeamFilters.has(section.dataset.team) ? '' : 'none';
        });
    }

    // --- Bind team tab clicks (multi-select) ---
    container.querySelectorAll('.team-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Check if this is a role filter or team filter
            const isRoleFilter = tab.dataset.isRoleFilter === 'true';
            const filterValue = isRoleFilter ? tab.dataset.roleFilter : tab.dataset.teamFilter;
            const filterSet = isRoleFilter ? activeRoleFilters : activeTeamFilters;
            
            if (filterValue === 'all') {
                // "Wszystkie" button - clear all filters
                filterSet.clear();
                container.querySelectorAll('.team-tab').forEach(t => {
                    const isRole = t.dataset.isRoleFilter === 'true';
                    if (isRole === isRoleFilter) {
                        t.classList.toggle('active', false);
                    }
                });
                tab.classList.add('active');
            } else {
                // Toggle specific filter
                if (filterSet.has(filterValue)) {
                    filterSet.delete(filterValue);
                } else {
                    filterSet.add(filterValue);
                }
                
                // Update button states
                container.querySelectorAll('.team-tab').forEach(t => {
                    const isRole = t.dataset.isRoleFilter === 'true';
                    if (isRole === isRoleFilter) {
                        const tFilterValue = isRole ? t.dataset.roleFilter : t.dataset.teamFilter;
                        if (tFilterValue === 'all') {
                            t.classList.toggle('active', filterSet.size === 0);
                        } else {
                            t.classList.toggle('active', filterSet.has(tFilterValue));
                        }
                    }
                });
            }
            
            renderPeople();
        });
    });

    // --- Bind sprint nav buttons ---
    const prevBtn = container.querySelector('#people-sprint-prev');
    const nextBtn = container.querySelector('#people-sprint-next');
    const addSprintsBtn = container.querySelector('#people-add-sprints');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (sprintPageOffset > 0) {
                sprintPageOffset = Math.max(0, sprintPageOffset - 5);
                renderPeople();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const sprintsAsc = getSprintsFromCurrent();
            if (sprintPageOffset + 5 < sprintsAsc.length) {
                sprintPageOffset += 5;
                renderPeople();
            }
        });
    }

    if (addSprintsBtn) {
        addSprintsBtn.addEventListener('click', () => {
            createNextSprints(5);
            renderPeople();
            // Also re-render sprints tab
            renderSprints();
        });
    }

    // --- Bind "+" buttons to open assignment form ---
    container.querySelectorAll('.add-assignment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const personName = e.target.dataset.person;
            const sprintId = parseInt(e.target.dataset.sprint);
            openAssignmentForm(e.target, personName, sprintId);
        });
    });

    // --- Bind "×" remove buttons ---
    container.querySelectorAll('.remove-assignment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const personName = e.target.dataset.person;
            const sprintId = parseInt(e.target.dataset.sprint);
            const idx = parseInt(e.target.dataset.idx);
            if (personAssignments[personName] && personAssignments[personName][sprintId]) {
                personAssignments[personName][sprintId].splice(idx, 1);
                savePersonAssignments();
                renderPeople();
            }
        });
    });

    // --- Bind copy from previous sprint buttons ---
    container.querySelectorAll('.copy-prev-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const personName = e.target.dataset.person;
            const sprintId = parseInt(e.target.dataset.sprint);
            const prevSprintId = sprintId - 1;

            const prevAssignments = (personAssignments[personName] && personAssignments[personName][prevSprintId]) || [];
            const toCopy = prevAssignments.filter(a => !a.startsWith('OFF:'));

            if (toCopy.length === 0) {
                alert('Brak przypisań w poprzednim sprincie (Sprint ' + prevSprintId + ')');
                return;
            }

            if (!personAssignments[personName]) personAssignments[personName] = {};
            if (!personAssignments[personName][sprintId]) personAssignments[personName][sprintId] = [];

            // Add copied assignments (skip duplicates)
            toCopy.forEach(a => {
                if (!personAssignments[personName][sprintId].includes(a)) {
                    personAssignments[personName][sprintId].push(a);
                }
            });
            savePersonAssignments();
            renderPeople();
        });
    });

    // --- Bind assigned teams cell clicks to edit assignedTeams ---
    container.querySelectorAll('.assigned-teams-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const personNameCell = tr.querySelector('.person-name-cell');
            if (!personNameCell) return;
            const personName = personNameCell.textContent.trim();
            const person = PEOPLE.find(p => p.name === personName);
            if (person) {
                openEditAssignedTeamsModal(person);
            }
        });
        // Make it look clickable
        cell.style.cursor = 'pointer';
    });
}

function openEditAssignedTeamsModal(person) {
    // Close any existing modal
    const existing = document.getElementById('edit-assigned-teams-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-assigned-teams-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    const teamList = TEAMS.map(t => t.name);
    const selectedTeams = person.assignedTeams || [];
    const checkboxHTML = teamList.map(team => `
        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
            <input type="checkbox" id="team-${team}" class="team-checkbox" value="${team}" ${selectedTeams.includes(team) ? 'checked' : ''} />
            <label for="team-${team}" style="cursor: pointer; margin: 0;">${team}</label>
        </div>
    `).join('');

    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.2);">
            <h2 style="font-size: 18px; font-weight: 700; color: var(--bt-navy); margin-bottom: 20px;">
                Przydział zespołów - ${person.name}
            </h2>
            <div style="font-size: 12px; color: var(--bt-grey-600); margin-bottom: 16px;">
                Zaznacz zespoły projektowe, do których przypisany jest ten tester:
            </div>
            <div style="border: 1px solid var(--bt-grey-200); border-radius: 6px; padding: 16px; max-height: 300px; overflow-y: auto; margin-bottom: 24px;">
                ${checkboxHTML}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-assigned-teams" style="padding: 8px 16px; background: var(--bt-grey-200); color: var(--bt-navy); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                    Anuluj
                </button>
                <button id="save-assigned-teams" style="padding: 8px 16px; background: var(--bt-cyan); color: var(--bt-navy); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                    Zapisz
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Bind buttons
    document.getElementById('cancel-assigned-teams').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('save-assigned-teams').addEventListener('click', () => {
        const checked = Array.from(modal.querySelectorAll('.team-checkbox:checked')).map(cb => cb.value);
        person.assignedTeams = checked;
        savePeople();
        modal.remove();
        renderPeople(); // Re-render to show updated data
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function openAssignmentForm(btnElement, personName, sprintId) {
    // Remove any existing assignment form
    const existing = document.querySelector('.assignment-form');
    if (existing) existing.remove();

    // Projects sorted alphabetically, grouped: projects first, then other
    const projectItems = PROJECTS.filter(p => !p.category || p.category === 'project').sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    const bauItems = PROJECTS.filter(p => p.category === 'bau').sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    const otherCatItems = PROJECTS.filter(p => p.category && !['project','bau'].includes(p.category)).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    let projectOptions = `<optgroup label="Projekty">`;
    projectOptions += projectItems.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    projectOptions += `</optgroup><optgroup label="BAU">`;
    projectOptions += bauItems.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    projectOptions += `</optgroup><optgroup label="Inne (Overhead, Scrum, Maint.)">`;
    projectOptions += otherCatItems.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    projectOptions += `</optgroup>`;

    const form = document.createElement('div');
    form.className = 'assignment-form';
    form.innerHTML = `
        <div class="assignment-row">
            <select class="assignment-select">
                <option value="">— Wybierz projekt —</option>
                ${projectOptions}
                <option value="__custom__">— Inne (wpisz) —</option>
            </select>
        </div>
        <div class="assignment-row assignment-details" style="display:none;">
            <select class="assignment-scope-select">
                <option value="">— Zakres —</option>
                <option value="DEV">DEV</option>
                <option value="SIT">SIT</option>
                <option value="UAT">UAT</option>
                <option value="Go live">Go live</option>
                <option value="1st Line Support">1st Line Support</option>
                <option value="Analiza">Analiza</option>
                <option value="__custom_scope__">— Inny (wpisz) —</option>
            </select>
            <input type="text" class="assignment-scope-custom" placeholder="Wpisz zakres..." style="display:none;" />
            <input type="text" class="assignment-comment" placeholder="Komentarz (opcjonalnie)..." />
        </div>
        <div class="assignment-row">
            <input type="text" class="assignment-custom-input" placeholder="Wpisz zadanie..." style="display:none;" />
        </div>
        <div class="assignment-row">
            <button class="assignment-confirm-btn">Dodaj</button>
        </div>
    `;

    btnElement.parentNode.appendChild(form);

    const select = form.querySelector('.assignment-select');
    const detailsDiv = form.querySelector('.assignment-details');
    const scopeSelect = form.querySelector('.assignment-scope-select');
    const scopeCustom = form.querySelector('.assignment-scope-custom');
    const commentInput = form.querySelector('.assignment-comment');
    const customInput = form.querySelector('.assignment-custom-input');
    const confirmBtn = form.querySelector('.assignment-confirm-btn');

    select.addEventListener('change', () => {
        const isCustom = select.value === '__custom__';
        const isProject = select.value && !isCustom;
        customInput.style.display = isCustom ? '' : 'none';
        detailsDiv.style.display = isProject ? '' : 'none';
        if (isCustom) customInput.focus();
    });

    scopeSelect.addEventListener('change', () => {
        scopeCustom.style.display = scopeSelect.value === '__custom_scope__' ? '' : 'none';
        if (scopeSelect.value === '__custom_scope__') scopeCustom.focus();
    });

    confirmBtn.addEventListener('click', () => {
        let value = '';
        if (select.value === '__custom__') {
            value = customInput.value.trim();
        } else if (select.value) {
            let scope = '';
            if (scopeSelect.value === '__custom_scope__') {
                scope = scopeCustom.value.trim();
            } else if (scopeSelect.value) {
                scope = scopeSelect.value;
            }
            const comment = commentInput.value.trim();

            // Build value: "Project: Scope (comment)" or "Project: Scope" or "Project (comment)" or "Project"
            value = select.value;
            if (scope && comment) {
                value += `: ${scope} (${comment})`;
            } else if (scope) {
                value += `: ${scope}`;
            } else if (comment) {
                value += ` (${comment})`;
            }
        }
        if (!value) return;

        if (!personAssignments[personName]) personAssignments[personName] = {};
        if (!personAssignments[personName][sprintId]) personAssignments[personName][sprintId] = [];
        personAssignments[personName][sprintId].push(value);
        savePersonAssignments();
        renderPeople();
    });

    select.focus();
}

// Sprints tab pagination
let sprintsTabOffset = 0; // starts at current sprint

function renderSprints() {
    const container = document.getElementById('sprints-list');
    const sprintsAsc = getSprintsFromCurrent();
    const visibleSprints = sprintsAsc.slice(sprintsTabOffset, sprintsTabOffset + 5);

    let html = '';

    // Sprint navigation
    const firstVisible = visibleSprints[0];
    const lastVisible = visibleSprints[visibleSprints.length - 1];
    const canGoPrev = sprintsTabOffset > 0;
    const canGoNext = sprintsTabOffset + 5 < sprintsAsc.length;

    html += `<div class="people-sprint-nav">`;
    html += `<button id="sprints-tab-prev" ${!canGoPrev ? 'disabled' : ''} style="padding:3px 8px;font-size:11px;">&#8592;</button>`;
    html += `<span class="sprint-range-label">${firstVisible ? firstVisible.name : ''} – ${lastVisible ? lastVisible.name : ''}</span>`;
    html += `<button id="sprints-tab-next" ${!canGoNext ? 'disabled' : ''} style="padding:3px 8px;font-size:11px;">&#8594;</button>`;
    html += `</div>`;

    // Build columns layout
    html += `<div class="sprints-columns">`;
    visibleSprints.forEach(sprint => {
        const sDates = parseSprintDatesForSort(sprint.dates);
        const today = new Date();
        const isCurrent = sDates && today >= sDates.start && today <= sDates.end;
        html += `<div class="sprint-column ${isCurrent ? 'sprint-column-current' : ''}">`;
        html += `<div class="sprint-column-header">`;
        html += `<span class="sprint-col-name">${sprint.name}${isCurrent ? ` <span class="current-badge">${t('sprints.current')}</span>` : ''}</span>`;
        html += `<span class="sprint-col-dates">${sprint.dates}</span>`;
        html += `</div>`;

        // --- Collect assignments per project per team with scope details ---
        const projectData = {}; // { projectName: { teams: { teamName: [scope1, scope2] } } }

        PEOPLE.forEach(p => {
            const assignments = (personAssignments[p.name] && personAssignments[p.name][sprint.id]) || [];
            assignments.forEach(a => {
                if (a.startsWith('OFF:')) return;
                let projectName = a;
                let scope = '';
                const colonIdx = a.indexOf(': ');
                if (colonIdx > -1) {
                    projectName = a.substring(0, colonIdx);
                    scope = a.substring(colonIdx + 2);
                }
                if (!projectData[projectName]) projectData[projectName] = { teams: {} };
                if (!projectData[projectName].teams[p.team]) projectData[projectName].teams[p.team] = [];
                if (scope && !projectData[projectName].teams[p.team].includes(scope)) {
                    projectData[projectName].teams[p.team].push(scope);
                }
            });
        });

        // Group by category
        const catGroups = { project: [], bau: [], maintenance: [] };
        Object.keys(projectData).forEach(projName => {
            const proj = PROJECTS.find(p => p.name === projName);
            const cat = proj ? (proj.category || 'project') : 'project';
            if (cat === 'bau' || cat === 'other') catGroups.bau.push(projName);
            else if (cat === 'maintenance') catGroups.maintenance.push(projName);
            else catGroups.project.push(projName);
        });

        // Sort each group by priority
        const sortByPriority = (arr) => arr.sort((a, b) => {
            const pa = PROJECTS.find(p => p.name === a);
            const pb = PROJECTS.find(p => p.name === b);
            const prioA = pa ? (pa.priority === 'N/A' ? 999 : parseInt(pa.priority) || 998) : 997;
            const prioB = pb ? (pb.priority === 'N/A' ? 999 : parseInt(pb.priority) || 998) : 997;
            return prioA - prioB;
        });

        // Render each category
        const renderSprintCategory = (label, items) => {
            if (items.length === 0) return;
            html += `<div class="sprint-section-label">${label}:</div>`;
            items.forEach(projName => {
                const proj = PROJECTS.find(p => p.name === projName);
                const prio = proj ? proj.priority : '—';
                let prioClass = 'pna';
                if (prio !== '—' && prio !== 'N/A') {
                    const prioNum = parseInt(prio);
                    if (!isNaN(prioNum)) {
                        if (prioNum <= 3) prioClass = 'p0';
                        else if (prioNum <= 10) prioClass = 'p1';
                        else if (prioNum <= 20) prioClass = 'p2';
                        else if (prioNum <= 30) prioClass = 'p3';
                        else prioClass = 'p4';
                    }
                } else if (prio === 'N/A') {
                    prioClass = 'pna';
                }

                html += `<div class="sprint-project-block">`;
                html += `<div class="sprint-project-name"><span class="prio-dot ${prioClass}">${prio}</span> ${projName}</div>`;

                const data = projectData[projName];
                TEAMS.forEach(team => {
                    const teamObj = TEAMS.find(t => t.name === team.name);
                    const scopes = data.teams[team.name];
                    if (!scopes) return;
                    if (scopes.length > 0) {
                        html += `<div class="sprint-project-team"><span style="color:${teamObj.color}">- ${team.name}:</span> ${scopes.join(', ')}</div>`;
                    } else {
                        html += `<div class="sprint-project-team"><span style="color:${teamObj.color}">- ${team.name}</span></div>`;
                    }
                });
                html += `</div>`;
            });
        };

        renderSprintCategory('PROJEKTY', sortByPriority(catGroups.project));
        renderSprintCategory('BAU', sortByPriority(catGroups.bau));
        renderSprintCategory('MAINTENANCE', sortByPriority(catGroups.maintenance));

        // Sprint goals (editable)
        if (sprint.goals) {
            html += `<div class="sprint-section-label" style="margin-top:12px;">CELE SPRINTU:</div>`;
            TEAMS.forEach(team => {
                const goal = sprint.goals[team.id];
                if (!goal) return;
                html += `<div class="sprint-team-line">`;
                html += `<span class="sprint-team-name" style="color:${team.color}">${team.name}:</span> `;
                html += `<span class="sprint-team-projects">${goal}</span>`;
                html += `</div>`;
            });
        }

        // Edit goals button
        html += `<button class="edit-sprint-goals-btn" data-sprint-id="${sprint.id}" title="Edytuj cele">✎</button>`;

        html += `</div>`; // sprint-column
    });
    html += `</div>`; // sprints-columns

    // --- Second row: Projects with assigned people ---
    html += `<div style="margin-top:20px;"><h4 style="font-size:12px;font-weight:700;color:var(--bt-navy);margin-bottom:10px;">Przypisania osób do projektów</h4></div>`;
    html += `<div class="sprints-columns">`;
    visibleSprints.forEach(sprint => {
        const sDates = parseSprintDatesForSort(sprint.dates);
        const today = new Date();
        const isCurrent = sDates && today >= sDates.start && today <= sDates.end;
        html += `<div class="sprint-column ${isCurrent ? 'sprint-column-current' : ''}">`;
        html += `<div class="sprint-column-header">`;
        html += `<span class="sprint-col-name">${sprint.name}${isCurrent ? ` <span class="current-badge">${t('sprints.current')}</span>` : ''}</span>`;
        html += `<span class="sprint-col-dates">${sprint.dates}</span>`;
        html += `</div>`;

        // Collect assignments per project per person
        const projectPeople = {}; // { projectName: { teamName: [personName1, personName2] } }

        PEOPLE.forEach(p => {
            const assignments = (personAssignments[p.name] && personAssignments[p.name][sprint.id]) || [];
            assignments.forEach(a => {
                if (a.startsWith('OFF:')) return;
                let projectName = a;
                const colonIdx = a.indexOf(': ');
                if (colonIdx > -1) {
                    projectName = a.substring(0, colonIdx);
                }
                if (!projectPeople[projectName]) projectPeople[projectName] = {};
                if (!projectPeople[projectName][p.team]) projectPeople[projectName][p.team] = [];
                if (!projectPeople[projectName][p.team].includes(p.name)) {
                    projectPeople[projectName][p.team].push(p.name);
                }
            });
        });

        // Sort by priority
        const sortedProjects = Object.keys(projectPeople).sort((a, b) => {
            const pa = PROJECTS.find(p => p.name === a);
            const pb = PROJECTS.find(p => p.name === b);
            const prioA = pa ? (pa.priority === 'N/A' ? 999 : parseInt(pa.priority) || 998) : 997;
            const prioB = pb ? (pb.priority === 'N/A' ? 999 : parseInt(pb.priority) || 998) : 997;
            return prioA - prioB;
        });

        html += `<div class="sprint-section-label">PROJEKTY / OSOBY:</div>`;

        sortedProjects.forEach(projName => {
            const proj = PROJECTS.find(p => p.name === projName);
            const prio = proj ? proj.priority : '—';
            let prioClass = 'pna';
            if (prio !== '—' && prio !== 'N/A') {
                const prioNum = parseInt(prio);
                if (!isNaN(prioNum)) {
                    if (prioNum <= 3) prioClass = 'p0';
                    else if (prioNum <= 10) prioClass = 'p1';
                    else if (prioNum <= 20) prioClass = 'p2';
                    else if (prioNum <= 30) prioClass = 'p3';
                    else prioClass = 'p4';
                }
            } else if (prio !== '—') {
                prioClass = 'pna';
            }

            html += `<div class="sprint-project-block">`;
            html += `<div class="sprint-project-name"><span class="prio-dot ${prioClass}">${prio}</span> ${projName}</div>`;

            const data = projectPeople[projName];
            TEAMS.forEach(team => {
                const people = data[team.name];
                if (!people) return;
                const teamObj = TEAMS.find(t => t.name === team.name);
                html += `<div class="sprint-project-team"><span style="color:${teamObj.color}">- ${team.name}:</span> ${people.join(', ')}</div>`;
            });
            html += `</div>`;
        });

        if (sortedProjects.length === 0) {
            html += `<span style="font-size:11px;color:var(--bt-grey-400);">Brak przypisań</span>`;
        }

        html += `</div>`; // sprint-column
    });
    html += `</div>`; // sprints-columns

    container.innerHTML = html;

    // Bindings
    const prevBtn = container.querySelector('#sprints-tab-prev');
    const nextBtn = container.querySelector('#sprints-tab-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (sprintsTabOffset > 0) {
                sprintsTabOffset = Math.max(0, sprintsTabOffset - 5);
                renderSprints();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const sprintsAsc = getSprintsFromCurrent();
            if (sprintsTabOffset + 5 < sprintsAsc.length) {
                sprintsTabOffset += 5;
                renderSprints();
            }
        });
    }

    // Edit goals buttons
    container.querySelectorAll('.edit-sprint-goals-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sprintId = parseInt(btn.dataset.sprintId);
            openSprintGoalsEditor(sprintId);
        });
    });
}

function openSprintGoalsEditor(sprintId) {
    const sprint = SPRINTS.find(s => s.id === sprintId);
    if (!sprint) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    let goalsHtml = '';
    TEAMS.forEach(team => {
        const currentGoal = (sprint.goals && sprint.goals[team.id]) || '';
        goalsHtml += `
            <label>
                <span style="color:${team.color}; font-weight:700;">${team.name}</span>
                <input type="text" class="inline-edit sprint-goal-input" data-team-id="${team.id}" value="${currentGoal}" placeholder="Cele dla ${team.name}..." />
            </label>`;
    });

    overlay.innerHTML = `
        <div class="modal">
            <h3 style="margin-bottom:16px;">${sprint.name} — Cele sprintu</h3>
            <div class="modal-form">
                ${goalsHtml}
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button class="edit-btn" id="save-sprint-goals">Zapisz</button>
                    <button class="delete-btn" id="cancel-sprint-goals">Anuluj</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#cancel-sprint-goals').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#save-sprint-goals').addEventListener('click', () => {
        if (!sprint.goals) sprint.goals = {};
        overlay.querySelectorAll('.sprint-goal-input').forEach(input => {
            const teamId = input.dataset.teamId;
            const val = input.value.trim();
            if (val) {
                sprint.goals[teamId] = val;
            } else {
                delete sprint.goals[teamId];
            }
        });
        // Save to localStorage
        localStorage.setItem('cp_sprint_goals', JSON.stringify(
            SPRINTS.reduce((acc, s) => { if (s.goals) acc[s.id] = s.goals; return acc; }, {})
        ));
        overlay.remove();
        renderSprints();
    });
}

// --- NAVIGATION ---

function updateWorkloadNav() {
    const first = ALL_WEEKS[workloadOffset];
    const last = ALL_WEEKS[Math.min(workloadOffset + WEEKS_PER_PAGE - 1, TOTAL_WEEKS - 1)];
    const label = document.getElementById('current-week-label');
    if (label) label.textContent = `${first.label.split(' – ')[0]} – ${last.label.split(' – ')[1]}`;

    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    if (prevBtn) prevBtn.disabled = workloadOffset === 0;
    if (nextBtn) nextBtn.disabled = workloadOffset + WEEKS_PER_PAGE >= TOTAL_WEEKS;
}

// --- LANGUAGE TOGGLE ---

function initLangToggle() {
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;

    // Highlight active button
    updateLangButtons();

    toggle.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLang(lang);
            updateLangButtons();
            applyStaticTranslations();
            // Re-render all dynamic content
            renderCapacityBars();
            renderActionNeeded();
            renderSprintAvailability();
            renderProjectsTable();
            renderWorkloadGrid();
            renderPeople();
            renderSprints();
            renderTeams();
            renderSettings();
        });
    });
}

function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === getLang());
    });
}

function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}

function initNavigation() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
        const app = document.querySelector('.app');
        app.classList.toggle('sidebar-collapsed');
        const collapsed = app.classList.contains('sidebar-collapsed');
        sidebarToggle.innerHTML = collapsed ? '&#187;' : '&#171;';
        localStorage.setItem('cp_sidebar_collapsed', collapsed);
    });

    // Restore sidebar state
    if (localStorage.getItem('cp_sidebar_collapsed') === 'true') {
        document.querySelector('.app').classList.add('sidebar-collapsed');
        sidebarToggle.innerHTML = '&#187;';
    }

    // Language toggle
    initLangToggle();

    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + item.dataset.page).classList.add('active');
            showPage(item.dataset.page);
        });
    });

    // Workload navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        if (workloadOffset > 0) {
            workloadOffset = Math.max(0, workloadOffset - WEEKS_PER_PAGE);
            renderWorkloadGrid();
        }
    });

    document.getElementById('next-week').addEventListener('click', () => {
        if (workloadOffset + WEEKS_PER_PAGE >= TOTAL_WEEKS) {
            // Extend by 8 more weeks and generate sprints
            extendWeeks(8);
        }
        workloadOffset = Math.min(TOTAL_WEEKS - WEEKS_PER_PAGE, workloadOffset + WEEKS_PER_PAGE);
        renderWorkloadGrid();
    });

    // Add project button
    document.getElementById('add-project-btn').addEventListener('click', openAddProjectModal);

    // Project filter buttons
    document.querySelectorAll('.table-filter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.table-filter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            const rows = document.querySelectorAll('#projects-table tr');
            rows.forEach(row => {
                if (filter === 'all') {
                    row.style.display = '';
                } else {
                    const project = PROJECTS.find(p => p.id === parseInt(row.dataset.id));
                    row.style.display = (project && project.status === filter) ? '' : 'none';
                }
            });
        });
    });

    // ========== ACCESSIBILITY FIX #3: Keyboard Navigation for nav items ==========
    // Added: August 7, 2026 | WCAG 2.1.1 Keyboard (A)
    // Allows ENTER and SPACE keys to activate nav items with role="button"
    
    document.querySelectorAll('[role="button"].nav-item').forEach(navItem => {
        navItem.addEventListener('keydown', function(e) {
            // Allow both ENTER and SPACE to activate the button
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();  // Prevent default browser behavior
                this.click();         // Trigger the onclick handler
            }
        });
    });
    // ============================================================================
}

// ============================================================
// TEAMS CALENDAR - Availability view
// ============================================================

// ============================================================
// EMPLOYMENT TYPES (for partial availability)
// ============================================================

const EMPLOYMENT_TYPES = {
    'full-time': { value: 'full-time', label_pl: 'Pełna zatrudnienie', label_en: 'Full-time', availability: 100 },
    'half-time': { value: 'half-time', label_pl: 'Pół etatu', label_en: 'Half-time', availability: 50 },
    'part-time': { value: 'part-time', label_pl: 'Część etatu', label_en: 'Part-time', availability: 25 },
    'contractor': { value: 'contractor', label_pl: 'Kontraktor', label_en: 'Contractor', availability: 100 }
};

// ============================================================
// PUBLIC HOLIDAYS (predefined + user-managed)
// ============================================================

// Default Polish public holidays by year
const DEFAULT_PUBLIC_HOLIDAYS = {
    '2026': [
        { date: '2026-01-01', name_pl: 'Nowy Rok', name_en: 'New Year' },
        { date: '2026-01-06', name_pl: 'Trzech Króli', name_en: 'Epiphany' },
        { date: '2026-04-05', name_pl: 'Wielkanoc', name_en: 'Easter' },
        { date: '2026-04-06', name_pl: 'Poniedziałek Wielkanocny', name_en: 'Easter Monday' },
        { date: '2026-05-01', name_pl: 'Święto Pracy', name_en: 'Labour Day' },
        { date: '2026-05-03', name_pl: 'Konstytucja 3 Maja', name_en: 'Constitution Day' },
        { date: '2026-05-24', name_pl: 'Zielone Świątki', name_en: 'Whit Sunday' },
        { date: '2026-06-04', name_pl: 'Boże Ciało', name_en: 'Corpus Christi' },
        { date: '2026-08-15', name_pl: 'Wniebowzięcie NMP', name_en: 'Assumption of Mary' },
        { date: '2026-11-01', name_pl: 'Wszystkich Świętych', name_en: "All Saints' Day" },
        { date: '2026-11-11', name_pl: 'Niepodległość', name_en: 'Independence Day' },
        { date: '2026-12-24', name_pl: 'Wigilia', name_en: 'Christmas Eve' },
        { date: '2026-12-25', name_pl: 'Boże Narodzenie', name_en: 'Christmas Day' },
        { date: '2026-12-26', name_pl: 'Drugi dzień BN', name_en: 'Boxing Day' },
    ],
    '2027': [
        { date: '2027-01-01', name_pl: 'Nowy Rok', name_en: 'New Year' },
        { date: '2027-01-06', name_pl: 'Trzech Króli', name_en: 'Epiphany' },
        { date: '2027-04-25', name_pl: 'Wielkanoc', name_en: 'Easter' },
        { date: '2027-04-26', name_pl: 'Poniedziałek Wielkanocny', name_en: 'Easter Monday' },
        { date: '2027-05-01', name_pl: 'Święto Pracy', name_en: 'Labour Day' },
        { date: '2027-05-03', name_pl: 'Konstytucja 3 Maja', name_en: 'Constitution Day' },
        { date: '2027-06-13', name_pl: 'Zielone Świątki', name_en: 'Whit Sunday' },
        { date: '2027-06-24', name_pl: 'Boże Ciało', name_en: 'Corpus Christi' },
        { date: '2027-08-15', name_pl: 'Wniebowzięcie NMP', name_en: 'Assumption of Mary' },
        { date: '2027-11-01', name_pl: 'Wszystkich Świętych', name_en: "All Saints' Day" },
        { date: '2027-11-11', name_pl: 'Niepodległość', name_en: 'Independence Day' },
        { date: '2027-12-24', name_pl: 'Wigilia', name_en: 'Christmas Eve' },
        { date: '2027-12-25', name_pl: 'Boże Narodzenie', name_en: 'Christmas Day' },
        { date: '2027-12-26', name_pl: 'Drugi dzień BN', name_en: 'Boxing Day' },
    ],
    '2028': [
        { date: '2028-01-01', name_pl: 'Nowy Rok', name_en: 'New Year' },
        { date: '2028-01-06', name_pl: 'Trzech Króli', name_en: 'Epiphany' },
        { date: '2028-04-09', name_pl: 'Wielkanoc', name_en: 'Easter' },
        { date: '2028-04-10', name_pl: 'Poniedziałek Wielkanocny', name_en: 'Easter Monday' },
        { date: '2028-05-01', name_pl: 'Święto Pracy', name_en: 'Labour Day' },
        { date: '2028-05-03', name_pl: 'Konstytucja 3 Maja', name_en: 'Constitution Day' },
        { date: '2028-05-28', name_pl: 'Zielone Świątki', name_en: 'Whit Sunday' },
        { date: '2028-06-08', name_pl: 'Boże Ciała', name_en: 'Corpus Christi' },
        { date: '2028-08-15', name_pl: 'Wniebowzięcie NMP', name_en: 'Assumption of Mary' },
        { date: '2028-11-01', name_pl: 'Wszystkich Świętych', name_en: "All Saints' Day" },
        { date: '2028-11-11', name_pl: 'Niepodległość', name_en: 'Independence Day' },
        { date: '2028-12-24', name_pl: 'Wigilia', name_en: 'Christmas Eve' },
        { date: '2028-12-25', name_pl: 'Boże Narodzenie', name_en: 'Christmas Day' },
        { date: '2028-12-26', name_pl: 'Drugi dzień BN', name_en: 'Boxing Day' },
    ]
};

// Mutable public holidays - loaded from localStorage or defaults
let publicHolidays = JSON.parse(JSON.stringify(DEFAULT_PUBLIC_HOLIDAYS));

// ============================================================
// PLANNED TRAININGS (training/workshops with date range and hours)
// ============================================================

let trainings = [];  // [ { id, personName, dateFrom, dateTo, hoursPerDay, trainingType, description, status } ]

function loadTrainings() {
    const saved = localStorage.getItem('cp_trainings');
    if (saved) {
        try { trainings = JSON.parse(saved); } catch(e) {}
    }
}

function saveTrainings() {
    localStorage.setItem('cp_trainings', JSON.stringify(trainings));
}

// State
let activeTeamView = 'ALF';
let teamsCalMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // bieżący miesiąc
let companyDaysOff = []; // ['2026-08-14', '2026-12-31'] etc.
let activeCalendarRoleFilters = new Set(); // Multi-select roles for calendar view
let personTimeOff = {};  // { 'Kamila Molas': ['2026-07-21', '2026-07-22', ...] }

function loadTeamsData() {
    // Load public holidays
    const savedHolidays = localStorage.getItem('cp_public_holidays');
    if (savedHolidays) {
        try { publicHolidays = JSON.parse(savedHolidays); } catch(e) {}
    }
    
    const savedCo = localStorage.getItem('cp_company_days_off');
    if (savedCo) {
        try { companyDaysOff = JSON.parse(savedCo); } catch(e) {}
    }
    const savedPto = localStorage.getItem('cp_person_time_off');
    if (savedPto) {
        try { personTimeOff = JSON.parse(savedPto); } catch(e) {}
    }
    
    // Load trainings
    loadTrainings();
}

function saveTeamsData() {
    localStorage.setItem('cp_public_holidays', JSON.stringify(publicHolidays));
    localStorage.setItem('cp_company_days_off', JSON.stringify(companyDaysOff));
    localStorage.setItem('cp_person_time_off', JSON.stringify(personTimeOff));
    saveTrainings();
}

function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDaysInMonth(year, month) {
    const days = [];
    const numDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, month, i);
        days.push(d);
    }
    return days;
}

function isWeekend(d) {
    return d.getDay() === 0 || d.getDay() === 6;
}

function isFriday(d) {
    return d.getDay() === 5;
}

function isHoliday(dateKey) {
    // Check if dateKey is in any year's public holidays
    for (const year in publicHolidays) {
        const holidays = publicHolidays[year];
        if (holidays && holidays.some(h => h.date === dateKey)) {
            return true;
        }
    }
    return false;
}

function isCompanyOff(dateKey) {
    return companyDaysOff.includes(dateKey);
}

function isPersonOff(personName, dateKey) {
    return personTimeOff[personName] && personTimeOff[personName].includes(dateKey);
}

function getDayStatus(personName, d) {
    const dateKey = formatDateKey(d);
    const person = PEOPLE.find(p => p.name === personName);
    
    // Start with base availability (employment type or default 100%)
    let baseFactor = person && person.availability ? (person.availability / 100) : 1.0;
    
    // Check for day-based statuses that override availability
    if (isWeekend(d)) return { status: 'weekend', factor: 0 };
    if (isHoliday(dateKey)) return { status: 'holiday', factor: 0 };
    if (isCompanyOff(dateKey)) return { status: 'company-off', factor: 0 };
    if (isPersonOff(personName, dateKey)) return { status: 'off', factor: 0 };
    
    // Check for active trainings
    const activeTraining = trainings.find(tr => {
        if (tr.personName !== personName) return false;
        const trFrom = new Date(tr.dateFrom);
        const trTo = new Date(tr.dateTo);
        return d >= trFrom && d <= trTo;
    });
    
    if (activeTraining) {
        const trainingFactor = 1.0 - (activeTraining.hoursPerDay / 8.0);
        const finalFactor = baseFactor * trainingFactor;
        return { status: 'training', factor: finalFactor };
    }
    
    // Apply day multipliers (Friday reduced hours) to base factor
    if (isFriday(d)) return { status: 'friday', factor: baseFactor * FRIDAY_FACTOR };
    
    return { status: 'available', factor: baseFactor };
}

function calcMonthCapacity(personName, year, month) {
    const days = getDaysInMonth(year, month);
    let totalMD = 0;
    days.forEach(d => {
        const { factor } = getDayStatus(personName, d);
        totalMD += factor;
    });
    return totalMD;
}

function renderTeams() {
    const container = document.getElementById('teams-calendar');
    const year = teamsCalMonth.getFullYear();
    const month = teamsCalMonth.getMonth();
    const days = getDaysInMonth(year, month);
    const monthName = teamsCalMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

    const isAllView = activeTeamView === 'ALL';
    const team = !isAllView ? TEAMS.find(t => t.name === activeTeamView) : null;

    let html = '';

    // View mode tabs (All Teams, Single Teams)
    html += `<div class="team-tabs" style="margin-bottom:12px;">`;
    html += `<button class="team-tab ${isAllView ? 'active' : ''}" data-team-cal="ALL">${t('cal.allTeams')}</button>`;
    TEAMS.forEach(t => {
        html += `<button class="team-tab ${t.name === activeTeamView ? 'active' : ''}" data-team-cal="${t.name}">${t.name}</button>`;
    });
    html += `</div>`;

    // Role filter tabs (only in ALL view)
    if (isAllView) {
        const uniqueRoles = [...new Set(PEOPLE.map(p => p.role))].sort((a, b) => (ROLE_SORT_ORDER[a] || 99) - (ROLE_SORT_ORDER[b] || 99));
        html += `<div class="team-tabs" style="margin-bottom:12px;">`;
        html += `<button class="team-tab ${activeCalendarRoleFilters.size === 0 ? 'active' : ''}" data-role-cal="all" data-is-role-cal="true">Wszystkie role</button>`;
        uniqueRoles.forEach(role => {
            const isSelected = activeCalendarRoleFilters.has(role);
            html += `<button class="team-tab ${isSelected ? 'active' : ''}" data-role-cal="${role}" data-is-role-cal="true">${role}</button>`;
        });
        html += `</div>`;
    }

    // Month navigation
    html += `<div class="teams-month-nav">`;
    html += `<button id="teams-prev-month" style="padding:3px 8px;font-size:11px;">&#8592;</button>`;
    let navLabel = '';
    if (isAllView) navLabel = 'Wszystkie zespoły';
    else navLabel = team ? team.name : 'Zespół';
    html += `<span class="teams-month-label">${navLabel} — ${monthName}</span>`;
    html += `<button id="teams-next-month" style="padding:3px 8px;font-size:11px;">&#8594;</button>`;
    html += `</div>`;

    if (isAllView) {
        // --- ALL TEAMS OVERVIEW (read-only) ---
        html += renderAllTeamsOverview(days, dayNames);
    } else {
        // --- SINGLE TEAM VIEW (editable) ---
        html += renderSingleTeamCalendar(days, dayNames, year, month);
    }

    container.innerHTML = html;

    // --- Bindings ---
    // Team tabs
    container.querySelectorAll('[data-team-cal]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeTeamView = btn.dataset.teamCal;
            renderTeams();
        });
    });

    // Role tabs (calendar view)
    container.querySelectorAll('[data-role-cal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.roleCal;
            
            if (role === 'all') {
                // "Wszystkie role" button - clear all filters
                activeCalendarRoleFilters.clear();
            } else {
                // Toggle specific role
                if (activeCalendarRoleFilters.has(role)) {
                    activeCalendarRoleFilters.delete(role);
                } else {
                    activeCalendarRoleFilters.add(role);
                }
            }
            
            renderTeams();
        });
    });

    // Month nav
    document.getElementById('teams-prev-month').addEventListener('click', () => {
        teamsCalMonth.setMonth(teamsCalMonth.getMonth() - 1);
        renderTeams();
    });
    document.getElementById('teams-next-month').addEventListener('click', () => {
        teamsCalMonth.setMonth(teamsCalMonth.getMonth() + 1);
        renderTeams();
    });

    if (!isAllView) {
        bindSingleTeamEvents(container, year, month);
    }
}

function renderAllTeamsOverview(days, dayNames) {
    let html = '';
    html += `<div class="teams-calendar-grid"><table class="cal-table"><thead><tr>`;
    html += `<th class="person-header">${t('cal.person')}</th>`;
    days.forEach(d => {
        const we = isWeekend(d);
        const dn = dayNames[d.getDay()];
        html += `<th class="${we ? 'weekend-header' : ''}">${d.getDate()}<br>${dn}</th>`;
    });
    html += `<th>MD</th>`;
    html += `</tr></thead><tbody>`;

    TEAMS.forEach(team => {
        let members = PEOPLE.filter(p => p.team === team.name)
            .sort((a, b) => (ROLE_SORT_ORDER[a.role] || 99) - (ROLE_SORT_ORDER[b.role] || 99));
        
        // Apply role filter (calendar view)
        if (activeCalendarRoleFilters.size > 0) {
            members = members.filter(p => activeCalendarRoleFilters.has(p.role));
        }
        
        if (members.length === 0) return;

        // Team header row
        html += `<tr class="cal-capacity-row"><td class="person-name-td" style="font-size:11px!important;">${team.name}</td>`;
        let teamTotalMD = 0;
        const teamDailyTotals = days.map(() => 0);
        members.forEach(p => {
            days.forEach((d, i) => {
                const { factor } = getDayStatus(p.name, d);
                teamDailyTotals[i] += factor;
            });
        });
        teamDailyTotals.forEach(v => {
            teamTotalMD += v;
            html += `<td><span class="cap-value">${v > 0 ? v.toFixed(0) : ''}</span></td>`;
        });
        html += `<td><span class="cap-value" style="font-size:12px;">${teamTotalMD.toFixed(1)}</span></td></tr>`;

        // Person rows
        members.forEach(p => {
            html += `<tr><td class="person-name-td">${p.name}</td>`;
            let personMD = 0;
            days.forEach(d => {
                const { status, factor } = getDayStatus(p.name, d);
                personMD += factor;
                let label = '';
                if (status === 'friday') label = '65';
                else if (status === 'off') label = '0';
                html += `<td><span class="cal-day ${status}">${label}</span></td>`;
            });
            html += `<td><span class="cap-value">${personMD.toFixed(1)}</span></td></tr>`;
        });
    });

    html += `</tbody></table>`;
    // Legend
    html += `<div class="cal-legend">`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#d1fae5"></span> ${t('cal.available')}</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#fef3c7"></span> ${t('cal.friday')}</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#cffafe"></span> Szkolenie</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#fee2e2"></span> ${t('cal.off')}</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#e0e7ff"></span> ${t('cal.companyOff')}</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--bt-grey-200)"></span> ${t('cal.holiday')}</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--bt-grey-100)"></span> ${t('cal.weekend')}</div>`;
    html += `</div></div>`;
    return html;
}

function renderSingleTeamCalendar(days, dayNames, year, month) {
    const members = PEOPLE.filter(p => p.team === activeTeamView)
        .sort((a, b) => (ROLE_SORT_ORDER[a.role] || 99) - (ROLE_SORT_ORDER[b.role] || 99));

    let html = '';
    html += `<div class="teams-calendar-grid"><table class="cal-table"><thead><tr>`;
    html += `<th class="person-header">${t('cal.personSingle')}</th>`;
    days.forEach(d => {
        const we = isWeekend(d);
        const dn = dayNames[d.getDay()];
        html += `<th class="${we ? 'weekend-header' : ''}">${d.getDate()}<br>${dn}</th>`;
    });
    html += `<th>MD</th>`;
    html += `</tr></thead><tbody>`;

    const dailyTotals = days.map(() => 0);

    members.forEach(p => {
        html += `<tr>`;
        html += `<td class="person-name-td">${p.name}</td>`;
        let personMD = 0;
        days.forEach((d, i) => {
            const { status, factor } = getDayStatus(p.name, d);
            const dateKey = formatDateKey(d);
            dailyTotals[i] += factor;
            let label = '';
            if (status === 'friday') label = '65';
            else if (status === 'off') label = '0';
            personMD += factor;
            html += `<td><span class="cal-day ${status}" data-person="${p.name}" data-date="${dateKey}" title="${p.name} - ${dateKey}">${label || ''}</span></td>`;
        });
        html += `<td><span class="cap-value">${personMD.toFixed(1)}</span></td>`;
        html += `</tr>`;
    });

    // Totals row
    html += `<tr class="cal-capacity-row"><td class="person-name-td">RAZEM MD</td>`;
    let totalMD = 0;
    dailyTotals.forEach(v => {
        totalMD += v;
        html += `<td><span class="cap-value">${v > 0 ? v.toFixed(1) : ''}</span></td>`;
    });
    html += `<td><span class="cap-value" style="font-size:12px;">${totalMD.toFixed(1)}</span></td>`;
    html += `</tr>`;
    html += `</tbody></table>`;

    // Legend
    html += `<div class="cal-legend">`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#d1fae5"></span> Dostępny (100%)</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#fef3c7"></span> Piątek (65%)</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#cffafe"></span> Szkolenie (zredukowana dostępność)</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#fee2e2"></span> Nieobecność</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#e0e7ff"></span> Dzień wolny firmy</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--bt-grey-200)"></span> Święto</div>`;
    html += `<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--bt-grey-100)"></span> Weekend</div>`;
    html += `</div></div>`;

    // Person time off quick add
    html += `<div class="company-off-section" style="margin-top:12px;">`;
    html += `<h4>Urlop / Nieobecność osoby</h4>`;
    html += `<div class="add-company-off">`;
    html += `<select id="pto-person-select">`;
    members.forEach(p => { html += `<option value="${p.name}">${p.name}</option>`; });
    html += `</select>`;
    html += `<input type="date" id="pto-date-from" />`;
    html += `<span style="font-size:12px;">do</span>`;
    html += `<input type="date" id="pto-date-to" />`;
    html += `<button id="add-pto-btn">Dodaj urlop</button>`;
    html += `</div>`;
    // Show current PTO for this team
    html += `<div class="company-off-tags" style="margin-top:10px;">`;
    members.forEach(p => {
        const offDays = (personTimeOff[p.name] || []).filter(d => d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
        if (offDays.length > 0) {
            html += `<span class="company-off-tag" style="background:#fee2e2;color:#991b1b;">${p.name.split(' ')[0]}: ${offDays.length}d<span class="remove-co" data-person="${p.name}" data-month="${year}-${String(month+1).padStart(2,'0')}">×</span></span>`;
        }
    });
    html += `</div></div>`;

    return html;
}

function bindSingleTeamEvents(container, year, month) {
    // Click on calendar day to toggle person off
    container.querySelectorAll('.cal-day.available, .cal-day.friday').forEach(cell => {
        cell.addEventListener('click', () => {
            const personName = cell.dataset.person;
            const dateKey = cell.dataset.date;
            if (!personTimeOff[personName]) personTimeOff[personName] = [];
            personTimeOff[personName].push(dateKey);
            saveTeamsData();
            renderTeams();
            updateOffInPeople(personName);
        });
    });

    // Click on off day to remove
    container.querySelectorAll('.cal-day.off').forEach(cell => {
        cell.addEventListener('click', () => {
            const personName = cell.dataset.person;
            const dateKey = cell.dataset.date;
            if (personTimeOff[personName]) {
                personTimeOff[personName] = personTimeOff[personName].filter(d => d !== dateKey);
                saveTeamsData();
                renderTeams();
                updateOffInPeople(personName);
            }
        });
    });

    // Remove person PTO for month
    container.querySelectorAll('.remove-co[data-person]').forEach(btn => {
        btn.addEventListener('click', () => {
            const personName = btn.dataset.person;
            const monthPrefix = btn.dataset.month;
            if (personTimeOff[personName]) {
                personTimeOff[personName] = personTimeOff[personName].filter(d => !d.startsWith(monthPrefix));
                saveTeamsData();
                renderTeams();
                updateOffInPeople(personName);
            }
        });
    });

    // Add PTO range
    document.getElementById('add-pto-btn').addEventListener('click', () => {
        const personName = document.getElementById('pto-person-select').value;
        const from = document.getElementById('pto-date-from').value;
        const to = document.getElementById('pto-date-to').value;
        if (!personName || !from) return;
        const endDate = to || from;

        if (!personTimeOff[personName]) personTimeOff[personName] = [];
        const start = new Date(from);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = formatDateKey(d);
            if (!isWeekend(d) && !isHoliday(key) && !personTimeOff[personName].includes(key)) {
                personTimeOff[personName].push(key);
            }
        }
        saveTeamsData();
        renderTeams();
        updateOffInPeople(personName);
    });

}

// Sync OFF from calendar to People tab assignments
function updateOffInPeople(personName) {
    // Calculate OFF% per sprint based on time-off data
    SPRINTS.forEach(sprint => {
        const sprintDates = parseSprintDates(sprint.dates);
        if (!sprintDates) return;

        const workDays = [];
        for (let d = new Date(sprintDates.start); d <= sprintDates.end; d.setDate(d.getDate() + 1)) {
            const key = formatDateKey(d);
            if (!isWeekend(d) && !isHoliday(key) && !isCompanyOff(key)) {
                workDays.push(key);
            }
        }
        if (workDays.length === 0) return;

        const offDays = workDays.filter(key => isPersonOff(personName, key));
        const offPct = Math.round((offDays.length / workDays.length) * 100);

        if (!personAssignments[personName]) personAssignments[personName] = {};
        if (!personAssignments[personName][sprint.id]) personAssignments[personName][sprint.id] = [];

        // Remove old OFF entry
        personAssignments[personName][sprint.id] = personAssignments[personName][sprint.id].filter(a => !a.startsWith('OFF:'));

        // Add OFF if > 0
        if (offPct > 0) {
            personAssignments[personName][sprint.id].unshift(`OFF:${offPct}`);
        }
    });
    savePersonAssignments();
}

// Sync all people's OFF from calendar time-off data
function syncAllPeopleOff() {
    PEOPLE.forEach(p => {
        const hasAnyTimeOff = personTimeOff[p.name] && personTimeOff[p.name].length > 0;
        if (!hasAnyTimeOff) return;
        SPRINTS.forEach(sprint => {
            const sprintDates = parseSprintDates(sprint.dates);
            if (!sprintDates) return;

            const workDays = [];
            for (let d = new Date(sprintDates.start); d <= sprintDates.end; d.setDate(d.getDate() + 1)) {
                const key = formatDateKey(d);
                if (!isWeekend(d) && !isHoliday(key) && !isCompanyOff(key)) {
                    workDays.push(key);
                }
            }
            if (workDays.length === 0) return;

            const offDays = workDays.filter(key => isPersonOff(p.name, key));
            const offPct = Math.round((offDays.length / workDays.length) * 100);

            if (!personAssignments[p.name]) personAssignments[p.name] = {};
            if (!personAssignments[p.name][sprint.id]) personAssignments[p.name][sprint.id] = [];

            // Remove old OFF entry
            personAssignments[p.name][sprint.id] = personAssignments[p.name][sprint.id].filter(a => !a.startsWith('OFF:'));

            // Add OFF if > 0
            if (offPct > 0) {
                personAssignments[p.name][sprint.id].unshift(`OFF:${offPct}`);
            }
        });
    });
    savePersonAssignments();
}

function parseSprintDates(dateStr) {
    // Format: "DD.MM - DD.MM"
    try {
        const parts = dateStr.split(' - ');
        const [d1, m1] = parts[0].split('.').map(Number);
        const [d2, m2] = parts[1].split('.').map(Number);
        return {
            start: new Date(2026, m1 - 1, d1),
            end: new Date(2026, m2 - 1, d2)
        };
    } catch(e) {
        return null;
    }
}

function findSprintForDate(weekStart) {
    // Check if any day of the week falls within a sprint
    for (const sprint of SPRINTS) {
        const dates = parseSprintDates(sprint.dates);
        if (!dates) continue;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        // Week overlaps with sprint
        if (weekEnd >= dates.start && weekStart <= dates.end) {
            return sprint;
        }
    }
    return null;
}

function isCurrentSprint(sprint) {
    const dates = parseSprintDates(sprint.dates);
    if (!dates) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= dates.start && today <= dates.end;
}

// --- EDIT ALERT MODAL ---

function openEditAlertModal(alertType) {
    const config = getAlertConfig();
    const alert = config[alertType];
    if (!alert) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:700px;">
            <h3 style="margin:0 0 16px 0; color:var(--bt-navy);">⚙️ Edytuj alert: ${alert.label}</h3>

            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
                
                <!-- Threshold -->
                <div>
                    <label style="display:flex; flex-direction:column; gap:4px; margin-bottom:4px;">
                        <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Próg alertu</span>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <select class="edit-threshold-op" style="font-size:12px; padding:6px 8px; border:1px solid var(--bt-grey-200); border-radius:3px;">
                                <option value=">" ${alert.thresholdOp === '>' ? 'selected' : ''}>większy niż ></option>
                                <option value=">=" ${alert.thresholdOp === '>=' ? 'selected' : ''}>większy lub równy >=</option>
                                <option value="<" ${alert.thresholdOp === '<' ? 'selected' : ''}>mniejszy niż <</option>
                                <option value="<=" ${alert.thresholdOp === '<=' ? 'selected' : ''}>mniejszy lub równy <=</option>
                                <option value="=" ${alert.thresholdOp === '=' ? 'selected' : ''}>równy =</option>
                            </select>
                            <input type="number" class="edit-threshold" value="${alert.threshold}" style="font-size:12px; padding:6px 8px; border:1px solid var(--bt-grey-200); border-radius:3px; width:80px;" />
                            <span style="font-size:11px; color:var(--bt-grey-600);">${
                                alertType === 'overCapacity' ? '%' :
                                alertType === 'deadlineApproaching' ? 'dni' :
                                alertType === 'noAllocation' ? 'tygodni' :
                                'ryzyk'
                            }</span>
                        </div>
                    </label>
                </div>

                <!-- Scope -->
                <div>
                    <label style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Zakres</span>
                        <select class="edit-scope" style="font-size:12px; padding:6px 8px; border:1px solid var(--bt-grey-200); border-radius:3px;">
                            <option value="all-teams" ${alert.scope === 'all-teams' ? 'selected' : ''}>Wszystkie zespoły</option>
                            <option value="selected-teams" ${alert.scope === 'selected-teams' ? 'selected' : ''}>Wybrane zespoły</option>
                            <option value="all-projects" ${alert.scope === 'all-projects' ? 'selected' : ''}>Wszystkie projekty</option>
                            <option value="selected-projects" ${alert.scope === 'selected-projects' ? 'selected' : ''}>Wybrane projekty</option>
                        </select>
                    </label>
                </div>

                <!-- Scope Details -->
                <div class="edit-scope-details" style="display:${alert.scope.startsWith('selected') ? 'block' : 'none'}; background:var(--bt-grey-50); padding:10px; border-radius:3px; border:1px solid var(--bt-grey-200);">
                    <label style="font-size:11px; font-weight:600; color:var(--bt-navy); display:block; margin-bottom:6px;">
                        ${alert.scope === 'selected-teams' ? 'Wybierz zespoły:' : 'Wybierz projekty:'}
                    </label>
                    <div class="edit-scope-items" style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto;">
                        ${alert.scope === 'selected-teams' ? 
                            TEAMS.map(t => `<label style="display:flex; align-items:center; gap:6px; font-size:11px; cursor:pointer;">
                                <input type="checkbox" class="scope-item-check" data-value="${t.name}" ${alert.scopeValue.includes(t.name) ? 'checked' : ''} />
                                ${t.name}
                            </label>`).join('') :
                            alert.scope === 'selected-projects' ?
                            PROJECTS.filter(p => p.category === 'project').map(p => `<label style="display:flex; align-items:center; gap:6px; font-size:11px; cursor:pointer;">
                                <input type="checkbox" class="scope-item-check" data-value="${p.id}" ${alert.scopeValue.includes(p.id) ? 'checked' : ''} />
                                ${p.name}
                            </label>`).join('') :
                            ''
                        }
                    </div>
                </div>

                <!-- Level -->
                <div>
                    <label style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Poziom ważności</span>
                        <select class="edit-level" style="font-size:12px; padding:6px 8px; border:1px solid var(--bt-grey-200); border-radius:3px;">
                            <option value="critical" ${alert.level === 'critical' ? 'selected' : ''}>🔴 Krytyczny</option>
                            <option value="warning" ${alert.level === 'warning' ? 'selected' : ''}>🟠 Ostrzeżenie</option>
                            <option value="info" ${alert.level === 'info' ? 'selected' : ''}>🔵 Informacja</option>
                            <option value="opportunity" ${alert.level === 'opportunity' ? 'selected' : ''}>🟢 Szansa</option>
                        </select>
                    </label>
                </div>

                <!-- Description -->
                <div>
                    <label style="display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Opis / Instrukcja</span>
                        <textarea class="edit-description" style="font-size:11px; padding:8px; border:1px solid var(--bt-grey-200); border-radius:3px; min-height:60px; resize:vertical;">${alert.description}</textarea>
                    </label>
                </div>

                <!-- Status -->
                <div style="display:flex; align-items:center; gap:12px; padding:10px; background:var(--bt-grey-100); border-radius:3px;">
                    <label style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; cursor:pointer; margin:0;">
                        <input type="checkbox" class="edit-enabled" ${alert.enabled ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;" />
                        Alert aktywny
                    </label>
                </div>

            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button class="cancel-btn" style="padding:8px 16px; background:var(--bt-grey-300); color:white; border:none; cursor:pointer; border-radius:4px;">Anuluj</button>
                <button class="info-btn" style="padding:8px 16px; background:var(--bt-cyan); color:white; border:none; cursor:pointer; border-radius:4px;">ℹ️ Jak to działa</button>
                <button class="save-btn" style="padding:8px 16px; background:var(--accent-green); color:white; border:none; cursor:pointer; border-radius:4px;">💾 Zapisz</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    // Handle scope change
    const scopeSelect = overlay.querySelector('.edit-scope');
    const scopeDetails = overlay.querySelector('.edit-scope-details');
    scopeSelect.addEventListener('change', () => {
        scopeDetails.style.display = scopeSelect.value.startsWith('selected') ? 'block' : 'none';
    });

    // Handle scope items checkbox
    overlay.querySelectorAll('.scope-item-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const selected = Array.from(overlay.querySelectorAll('.scope-item-check:checked'))
                .map(c => c.dataset.value);
            // Store selected values for save
            cb.dataset.selected = selected.join(',');
        });
    });

    // Info button
    overlay.querySelector('.info-btn').addEventListener('click', () => {
        openAlertConfigModal(alertType);
    });

    // Save button
    overlay.querySelector('.save-btn').addEventListener('click', () => {
        const threshold = parseInt(overlay.querySelector('.edit-threshold').value) || 0;
        const thresholdOp = overlay.querySelector('.edit-threshold-op').value;
        const scope = overlay.querySelector('.edit-scope').value;
        const level = overlay.querySelector('.edit-level').value;
        const description = overlay.querySelector('.edit-description').value.trim();
        const enabled = overlay.querySelector('.edit-enabled').checked;

        let scopeValue = [];
        if (scope.startsWith('selected')) {
            scopeValue = Array.from(overlay.querySelectorAll('.scope-item-check:checked'))
                .map(c => {
                    const val = c.dataset.value;
                    return isNaN(val) ? val : parseInt(val);
                });
        }

        // Update config
        config[alertType] = {
            ...alert,
            threshold,
            thresholdOp,
            scope,
            scopeValue,
            level,
            description,
            enabled
        };

        saveAlertConfig(config);
        renderActionNeeded();
        renderSettings();
        closeModal();
        alert('Alert zaktualizowany!');
    });

    // Cancel button
    overlay.querySelector('.cancel-btn').addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// --- ALERT CONFIGURATION MODAL (info only) ---

function openAlertConfigModal(alertType) {
    // Alert configurations with required fields and thresholds
    const configs = {
        overCapacity: {
            title: 'Konfiguracja: Przekroczenie capacity',
            icon: '🔴',
            color: '#ef4444',
            description: 'Alert pojawia się gdy zespół przekracza 100% dostępności w bieżącym/następnym sprincie',
            requiredFields: [
                '✓ Zespół przypisany do projektu',
                '✓ Alokacja > 0% dla zespołu w sprincie',
                '✓ Aktualna dostępność zespołu'
            ],
            threshold: 'Poziom: Przekroczenie >100% capacity',
            howToFix: [
                '1. Przejdź do Obciążenia (Workload)',
                '2. Zmniejsz alokację na projekcie dla danego zespołu',
                '3. Lub dodaj dodatkowych członków zespołu',
                '4. Lub przesuń zadania na następne sprinty'
            ]
        },
        noAllocation: {
            title: 'Konfiguracja: Brak przypisania zespołu',
            icon: '🟠',
            color: '#f59e0b',
            description: 'Alert pojawia się gdy projekt ma zespół przypisany, ale nie ma alokacji w następnych 4 tygodniach',
            requiredFields: [
                '✓ Status projektu: "W toku"',
                '✓ Zespół wybrany w polu "Zespoły"',
                '✓ Brak alokacji MD dla zespołu (0 MD)',
                '✓ Projekt w kategori "Projekt"'
            ],
            threshold: 'Okres kontrolny: Następne 4 tygodnie',
            howToFix: [
                '1. Przejdź do Obciążenia (Workload)',
                '2. Przypisz zespół do projektu (zaznacz MD)',
                '3. Lub zmień status projektu na "Zaplanowany"',
                '4. Lub usuń zespół z pola "Zespoły"'
            ]
        },
        deadlineApproaching: {
            title: 'Konfiguracja: Zbliżający się termin',
            icon: '⏰',
            color: '#f59e0b',
            description: 'Alert pojawia się gdy termin realizacji jest w ciągu 14 dni od dziś',
            requiredFields: [
                '✓ Status projektu: "W toku"',
                '✓ Data w polu "Termin"',
                '✓ Projekt w kategori "Projekt"'
            ],
            threshold: 'Ostrzeżenie: 1-14 dni | Krytyczne: termin minął (do 30 dni)',
            howToFix: [
                '1. Przejdź do szczegółów projektu',
                '2. Zmień datę terminu na późniejszą',
                '3. Lub zmień status na "Ukończony"',
                '4. Lub zmień status na "Wstrzymany"'
            ]
        },
        openRisks: {
            title: 'Konfiguracja: Otwarte ryzyka',
            icon: '⚠️',
            color: '#ef4444',
            description: 'Alert pojawia się gdy projekt ma 3 lub więcej otwartych ryzyk',
            requiredFields: [
                '✓ Status projektu: "W toku"',
                '✓ 3+ ryzyka z statusem innym niż "Zamknięty"',
                '✓ Projekt w kategori "Projekt"'
            ],
            threshold: 'Próg: ≥3 otwarte ryzyka',
            howToFix: [
                '1. Przejdź do szczegółów projektu → Ryzyka',
                '2. Zmień status ryzyka na "Złagodzony" lub "Zamknięty"',
                '3. Lub usuń ryzyko jeśli już nie istnieje',
                '4. Dodaj plan mitygacji do każdego ryzyka'
            ]
        },
        noKeyRole: {
            title: 'Konfiguracja: Brak kluczowej roli',
            icon: '👤',
            color: '#ef4444',
            description: 'Alert pojawia się gdy brakuje Developer lub QA w następnym sprincie',
            requiredFields: [
                '✓ Osoby przypisane do zespołu',
                '✓ Osoby mają rolę "Developer" lub "QA"',
                '✓ Dni wolne/urlopy zaznaczone w Kalendarz'
            ],
            threshold: 'Dla każdego dnia roboczego: min. 1 DEV + min. 1 QA na zespół',
            howToFix: [
                '1. Przejdź do Ustawienia → Osoby',
                '2. Dodaj brakujące osoby do zespołu',
                '3. Lub przejdź do Kalendarz i usuń dni wolne',
                '4. Lub zaplanuj urlop na inny okres'
            ]
        }
    };

    const config = configs[alertType];
    if (!config) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                <span style="font-size:32px;">${config.icon}</span>
                <h3 style="margin:0; color:var(--bt-navy);">${config.title}</h3>
            </div>

            <div style="background:${config.color}15; border-left:4px solid ${config.color}; padding:12px; margin-bottom:16px; border-radius:4px;">
                <p style="margin:0; font-size:12px; color:var(--bt-navy);">${config.description}</p>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                <!-- Left: Required Fields -->
                <div>
                    <h4 style="font-size:12px; font-weight:600; color:var(--bt-navy); margin-bottom:8px;">❓ CO MUSI UZUPEŁNIĆ LIDER</h4>
                    <div style="background:var(--bt-grey-50); padding:10px; border-radius:4px; border:1px solid var(--bt-grey-200);">
                        ${config.requiredFields.map(f => `<div style="font-size:11px; color:var(--bt-navy); margin-bottom:6px; line-height:1.4;">${f}</div>`).join('')}
                    </div>
                </div>

                <!-- Right: How to Fix -->
                <div>
                    <h4 style="font-size:12px; font-weight:600; color:var(--bt-navy); margin-bottom:8px;">🛠️ JAK WYŁĄCZYĆ ALERT</h4>
                    <div style="background:var(--bt-grey-50); padding:10px; border-radius:4px; border:1px solid var(--bt-grey-200); font-size:11px; line-height:1.5;">
                        ${config.howToFix.map(s => `<div style="color:var(--bt-navy); margin-bottom:4px;">${s}</div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Threshold Info -->
            <div style="background:${config.color}25; padding:10px; border-radius:4px; margin-bottom:16px; border:1px solid ${config.color}50;">
                <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">📊 WARUNEK AKTYWACJI:</span>
                <div style="font-size:11px; color:var(--bt-navy); margin-top:4px;">${config.threshold}</div>
            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button class="edit-btn" style="padding:8px 16px; background:${config.color}; color:white; border:none; cursor:pointer;">Zrozumiałem</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector('.edit-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// --- CUSTOM ALERT EDIT MODAL ---

function openCustomAlertEditModal(alert, idx, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <h3 style="margin:0 0 16px 0; color:var(--bt-navy);">Edytuj niestandardowy alert</h3>

            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
                <label style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Nazwa alertu</span>
                    <input type="text" class="edit-name-input" value="${alert.name}" class="inline-edit" style="font-size:12px;" />
                </label>

                <label style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Typ warunku</span>
                    <select class="edit-type-select" class="inline-edit" style="font-size:12px;">
                        <option value="project-field" ${alert.type === 'project-field' ? 'selected' : ''}>Projekt — pole puste</option>
                        <option value="project-status" ${alert.type === 'project-status' ? 'selected' : ''}>Projekt — status równy</option>
                        <option value="team-allocation" ${alert.type === 'team-allocation' ? 'selected' : ''}>Zespół — brak alokacji</option>
                        <option value="deadline-days" ${alert.type === 'deadline-days' ? 'selected' : ''}>Projekt — termin za N dni</option>
                        <option value="health-status" ${alert.type === 'health-status' ? 'selected' : ''}>Projekt — zdrowie równe</option>
                    </select>
                </label>

                <label style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Parametry warunku</span>
                    <input type="text" class="edit-params-input" value="${alert.params}" class="inline-edit" placeholder="np. 'lead' lub '14' lub 'green'" style="font-size:12px;" />
                </label>

                <label style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Opis / Instrukcja</span>
                    <textarea class="edit-desc-textarea" class="inline-edit" style="width:100%; font-size:11px; padding:8px; border:1px solid var(--bt-grey-200); border-radius:3px; min-height:60px; resize:vertical;">${alert.description}</textarea>
                </label>
            </div>

            <div style="background:var(--bt-grey-50); padding:10px; border-radius:4px; margin-bottom:16px; font-size:11px;">
                <strong>Typy warunków:</strong>
                <div style="margin-top:6px; line-height:1.6; color:var(--bt-grey-700);">
                    • <strong>project-field:</strong> Sprawdza czy pole projektu jest puste (np. 'lead', 'businessOwner')<br>
                    • <strong>project-status:</strong> Sprawdza czy status projektu równa się wartości (np. 'in-progress', 'blocked')<br>
                    • <strong>team-allocation:</strong> Sprawdza czy zespół nie ma alokacji w następnych 4 tyg. (param: nazwa zespołu)<br>
                    • <strong>deadline-days:</strong> Sprawdza czy termin ≤ N dni od dziś (param: liczba dni)<br>
                    • <strong>health-status:</strong> Sprawdza czy zdrowie projektu równa się (param: 'green', 'amber', 'red')
                </div>
            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button class="cancel-btn" style="padding:8px 16px; background:var(--bt-grey-300); color:white; border:none; cursor:pointer; border-radius:4px;">Anuluj</button>
                <button class="save-btn" style="padding:8px 16px; background:var(--accent-green); color:white; border:none; cursor:pointer; border-radius:4px;">💾 Zapisz</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    overlay.querySelector('.cancel-btn').addEventListener('click', closeModal);
    overlay.querySelector('.save-btn').addEventListener('click', () => {
        const name = overlay.querySelector('.edit-name-input').value.trim();
        const type = overlay.querySelector('.edit-type-select').value;
        const params = overlay.querySelector('.edit-params-input').value.trim();
        const desc = overlay.querySelector('.edit-desc-textarea').value.trim();

        if (!name || !type || !params) {
            alert('Podaj: nazwę, typ warunku i parametry');
            return;
        }

        const conditionLabel = {
            'project-field': `Pole puste: ${params}`,
            'project-status': `Status równy: ${params}`,
            'team-allocation': `Brak alokacji dla: ${params}`,
            'deadline-days': `Termin za ${params} dni`,
            'health-status': `Zdrowie równe: ${params}`
        };

        const updated = {
            ...alert,
            name: name,
            type: type,
            condition: conditionLabel[type] || type,
            params: params,
            description: desc
        };

        callback(updated);
        closeModal();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// --- SETTINGS PAGE ---
function renderSettings() {
    const container = document.getElementById('settings-content');

    let html = '';

    // --- Tab navigation ---
    const tabs = [
        { id: 'teams', label: t('settings.teams') },
        { id: 'roles', label: t('settings.roles') },
        { id: 'people', label: t('settings.people') },
        { id: 'days-off', label: t('settings.daysOff') },
        { id: 'params', label: t('settings.params') },
        { id: 'alerts', label: t('settings.alerts') },
        { id: 'import', label: t('settings.import') },
        { id: 'data', label: t('settings.data') },
    ];

    html += `<div class="team-tabs" style="margin-bottom:20px;">`;
    tabs.forEach((tab, i) => {
        html += `<button class="team-tab settings-tab ${i === 0 ? 'active' : ''}" data-settings-tab="${tab.id}">${tab.label}</button>`;
    });
    html += `</div>`;

    // --- Section: Teams ---
    html += `<div class="settings-panel" data-panel="teams">`;
    html += `<div class="settings-section">`;
    html += `<div class="settings-items">`;
    TEAMS.forEach((team, idx) => {
        html += `<div class="settings-item">
            <span class="settings-color-dot" style="background:${team.color}"></span>
            <span class="settings-item-name">${team.name}</span>
            <input type="color" class="settings-color-input" data-team-idx="${idx}" value="${team.color}" title="${t('settings.changeColor')}" />
            <button class="delete-btn settings-remove-team" data-team-idx="${idx}" style="padding:3px 8px;font-size:10px;">×</button>
        </div>`;
    });
    html += `</div>`;
    html += `<div class="settings-add-row">
        <input type="text" id="new-team-name" class="inline-edit" placeholder="${t('settings.teamName')}" style="width:150px;" />
        <input type="text" id="new-team-id" class="inline-edit" placeholder="ID (np. devops)" style="width:120px;" />
        <input type="color" id="new-team-color" value="#6366f1" />
        <button class="edit-btn" id="add-team-btn">${t('settings.addTeam')}</button>
    </div>`;
    html += `</div></div>`;

    // --- Section: Roles ---
    html += `<div class="settings-panel" data-panel="roles" style="display:none;">`;
    html += `<div class="settings-section">`;
    html += `<div class="settings-items">`;
    ROLES.forEach((r, idx) => {
        html += `<div class="settings-item">
            <span class="settings-item-name">${r}</span>
            <span style="font-size:10px;color:var(--bt-grey-400);">${t('settings.priority')}: ${ROLE_SORT_ORDER[r] !== undefined ? ROLE_SORT_ORDER[r] : '—'}</span>
            <button class="delete-btn settings-remove-role" data-role-idx="${idx}" style="padding:3px 8px;font-size:10px;">×</button>
        </div>`;
    });
    html += `</div>`;
    html += `<div class="settings-add-row">
        <input type="text" id="new-role-name" class="inline-edit" placeholder="${t('settings.roleName')}" style="width:180px;" />
        <button class="edit-btn" id="add-role-btn">${t('settings.addRole')}</button>
    </div>`;
    html += `</div></div>`;

    // --- Section: People ---
    html += `<div class="settings-panel" data-panel="people" style="display:none;">`;
    html += `<div class="settings-section">`;

    // Add person form on top
    html += `<div class="settings-add-row" style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--bt-grey-200);">
        <input type="text" id="settings-new-person-name" class="inline-edit" placeholder="${t('settings.personName')}" style="width:180px;" />
        <select id="settings-new-person-role" class="inline-edit" style="width:150px;">`;
    ROLES.forEach(r => { html += `<option value="${r}">${r}</option>`; });
    html += `</select>
        <select id="settings-new-person-team" class="inline-edit" style="width:140px;">`;
    TEAMS.forEach(t => { html += `<option value="${t.name}">${t.name}</option>`; });
    html += `</select>
        <button class="edit-btn" id="settings-add-person-btn">${t('settings.addPerson')}</button>
    </div>`;

    // People list grouped by team — members in two columns within each team
    TEAMS.forEach(team => {
        const members = PEOPLE.filter(p => p.team === team.name);
        if (members.length === 0) return;
        html += `<div style="margin-bottom:16px;">`;
        html += `<h4 style="font-size:12px;font-weight:700;color:${team.color};margin-bottom:8px;">${team.name} (${members.length})</h4>`;
        html += `<div class="settings-items" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">`;
        members.forEach(p => {
            html += `<div class="settings-item" data-person-row="${p.name}">
                <span class="settings-item-name" style="font-size:11px;">${p.name}</span>
                <span style="font-size:9px;color:var(--bt-grey-400);">${p.role}</span>
                <button class="edit-btn settings-edit-person" data-person="${p.name}" style="padding:2px 6px;font-size:9px;margin-left:auto;">✎</button>
                <button class="delete-btn settings-remove-person" data-person="${p.name}" style="padding:2px 6px;font-size:9px;">×</button>
            </div>`;
        });
        html += `</div></div>`;
    });

    html += `</div></div>`;

    // --- Section: Public Holidays ---
    html += `<div class="settings-panel" data-panel="days-off" style="display:none;">`;
    html += `<div class="settings-section">`;
    
    // Public Holidays subsection
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">🗓️ ${t('settings.publicHolidays')}</h4>`;
    html += `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--bt-grey-200);">`;
    
    // Import buttons for each year
    html += `<div class="settings-add-row" style="margin-bottom:12px;">
        <span style="font-size:12px;font-weight:600;">Import defaults:</span>`;
    ['2026', '2027', '2028'].forEach(year => {
        html += `<button class="edit-btn import-holidays-btn" data-year="${year}" style="padding:4px 8px;font-size:11px;">📥 ${year}</button>`;
    });
    html += `</div>`;
    
    // Current holidays list
    html += `<div class="settings-items" style="flex-direction:row; flex-wrap:wrap; gap:6px;">`;
    const allHolidayDates = [];
    for (const year in publicHolidays) {
        publicHolidays[year].forEach(h => allHolidayDates.push(h));
    }
    allHolidayDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (allHolidayDates.length === 0) {
        html += `<span style="font-size:12px;color:var(--bt-grey-400);">Brak załadowanych świąt. Kliknij przycisk import powyżej.</span>`;
    } else {
        allHolidayDates.forEach((h, idx) => {
            const label_i18n = getLang() === 'pl' ? h.name_pl : h.name_en;
            html += `<span class="company-off-tag" style="background:#e0e7ff;color:#4338ca;">${h.date} — ${label_i18n}<span class="remove-holiday-settings" data-date="${h.date}" style="cursor:pointer;font-weight:700;margin-left:6px;color:#4338ca;">×</span></span>`;
        });
    }
    html += `</div>`;
    
    // Add custom holiday
    html += `<div class="settings-add-row" style="margin-top:12px;">
        <input type="date" id="settings-new-holiday-date" class="inline-edit" />
        <input type="text" id="settings-new-holiday-name-pl" class="inline-edit" placeholder="${t('settings.holidayName')} (PL)" style="width:150px;" />
        <input type="text" id="settings-new-holiday-name-en" class="inline-edit" placeholder="Holiday Name (EN)" style="width:150px;" />
        <button class="edit-btn" id="settings-add-holiday-btn">${t('settings.addHoliday')}</button>
    </div>`;
    html += `</div>`;
    
    // Company days off subsection
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">🏢 ${t('settings.companyDaysOff')}</h4>`;
    html += `<div class="settings-items" style="flex-direction:row; flex-wrap:wrap; gap:6px;">`;
    companyDaysOff.forEach((d, idx) => {
        html += `<span class="company-off-tag">${d}<span class="remove-co-settings" data-idx="${idx}" style="cursor:pointer;font-weight:700;margin-left:6px;color:#6366f1;">×</span></span>`;
    });
    if (companyDaysOff.length === 0) {
        html += `<span style="font-size:12px;color:var(--bt-grey-400);">${t('settings.noCompanyDays')}</span>`;
    }
    html += `</div>`;
    html += `<div class="settings-add-row" style="margin-top:12px;">
        <input type="date" id="settings-new-co-date" class="inline-edit" />
        <button class="edit-btn" id="settings-add-co-btn">${t('settings.addDayOff')}</button>
    </div>`;

    // --- Trainings subsection ---
    html += `<h4 style="font-size:13px;font-weight:600;margin-top:16px;margin-bottom:12px;">📚 Planowane szkolenia</h4>`;
    html += `<div class="settings-items" style="flex-direction:column;gap:8px;">`;
    
    if (trainings.length === 0) {
        html += `<span style="font-size:12px;color:var(--bt-grey-400);">Brak zaplanowanych szkoleń</span>`;
    } else {
        trainings.forEach((tr, idx) => {
            const person = PEOPLE.find(p => p.name === tr.personName);
            const personTeam = person ? person.team : '—';
            const dateFrom = new Date(tr.dateFrom);
            const dateTo = new Date(tr.dateTo);
            const daysCount = Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)) + 1;
            html += `<div class="settings-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bt-grey-50);border-radius:4px;border-left:4px solid var(--bt-cyan);">
                <div style="flex:1;">
                    <div style="font-size:11px;font-weight:600;">${tr.personName}</div>
                    <div style="font-size:10px;color:var(--bt-grey-500);">${personTeam} • ${tr.dateFrom} → ${tr.dateTo} (${daysCount} dni) • ${tr.hoursPerDay}h/dzień</div>
                    <div style="font-size:10px;color:var(--bt-grey-400);">${tr.trainingType}${tr.description ? ' — ' + tr.description : ''}</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <button class="edit-btn edit-training-btn" data-training-id="${tr.id}" style="padding:2px 6px;font-size:9px;">✎</button>
                    <button class="delete-btn delete-training-btn" data-training-id="${tr.id}" style="padding:2px 6px;font-size:9px;">×</button>
                </div>
            </div>`;
        });
    }
    html += `</div>`;
    
    // Add training form
    html += `<div class="settings-add-row" style="margin-top:12px;flex-wrap:wrap;gap:8px;align-items:center;">
        <select id="settings-new-training-person" class="inline-edit" style="width:140px;">
            <option value="">— Wybierz osobę —</option>`;
    PEOPLE.forEach(p => { html += `<option value="${p.name}">${p.name}</option>`; });
    html += `</select>
        <input type="date" id="settings-new-training-dateFrom" class="inline-edit" title="Data początkowa" />
        <input type="date" id="settings-new-training-dateTo" class="inline-edit" title="Data końcowa" />
        <input type="number" id="settings-new-training-hours" class="inline-edit" placeholder="h/dzień" min="0" max="8" step="0.5" style="width:70px;" />
        <select id="settings-new-training-type" class="inline-edit" style="width:120px;">
            <option value="">— Typ szkolenia —</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="conference">Conference</option>
            <option value="certification">Certification</option>
            <option value="workshop">Workshop</option>
        </select>
        <input type="text" id="settings-new-training-desc" class="inline-edit" placeholder="Opis (opcjonalnie)" style="width:120px;" />
        <button class="edit-btn" id="settings-add-training-btn">Dodaj szkolenie</button>
    </div>`;

    html += `</div></div>`;

    // --- Section: Parameters ---
    html += `<div class="settings-panel" data-panel="params" style="display:none;">`;
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">${t('settings.fridayLabel').replace(':', '')}</h4>`;
    html += `<div class="settings-add-row" style="margin-bottom:20px;">
        <span style="font-size:12px;">${t('settings.fridayLabel')}</span>
        <input type="number" id="settings-friday-factor" class="inline-edit" value="${(FRIDAY_FACTOR * 100).toFixed(0)}" min="0" max="100" step="5" style="width:70px;" />
        <span style="font-size:12px;">%</span>
        <button class="edit-btn" id="save-friday-factor">${t('generic.save')}</button>
    </div>`;
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">${t('settings.capacityParams')}</h4>`;
    html += `<p style="font-size:11px;color:var(--bt-grey-400);margin-bottom:12px;">Overhead + Scrum + Maintenance + BAU + ${t('cat.project')} = 100%.</p>`;
    html += `<table class="people-table" style="font-size:12px;">`;
    html += `<thead><tr><th>${t('cap.team')}</th><th>Overhead</th><th>Scrum</th><th>Maintenance</th><th>BAU</th><th style="color:var(--bt-cyan-dark);">${t('cat.project')}</th><th>Σ</th></tr></thead>`;
    html += `<tbody>`;
    TEAMS.forEach(team => {
        const p = CAPACITY_PARAMS[team.id] || { overhead: 5, scrum: 10, maintenance: 10, bau: 10, projects: 65 };
        const sum = p.overhead + p.scrum + p.maintenance + p.bau + p.projects;
        const sumColor = sum === 100 ? 'var(--accent-green)' : 'var(--accent-red)';
        html += `<tr>
            <td style="font-weight:600;color:${team.color}">${team.name}</td>
            <td><input type="number" class="wl-input param-input" data-team="${team.id}" data-field="overhead" value="${p.overhead}" min="0" max="100" /></td>
            <td><input type="number" class="wl-input param-input" data-team="${team.id}" data-field="scrum" value="${p.scrum}" min="0" max="100" /></td>
            <td><input type="number" class="wl-input param-input" data-team="${team.id}" data-field="maintenance" value="${p.maintenance}" min="0" max="100" /></td>
            <td><input type="number" class="wl-input param-input" data-team="${team.id}" data-field="bau" value="${p.bau}" min="0" max="100" /></td>
            <td style="font-weight:700;color:var(--bt-cyan-dark);"><input type="number" class="wl-input param-input" data-team="${team.id}" data-field="projects" value="${p.projects}" min="0" max="100" style="color:var(--bt-cyan-dark);font-weight:700;" /></td>
            <td class="param-sum-cell" data-sum-team="${team.id}" style="font-weight:700;color:${sumColor};">${sum}%</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    html += `<div class="settings-add-row" style="margin-top:12px;">
        <button class="edit-btn" id="save-capacity-params">${t('generic.save')}</button>
    </div>`;
    html += `</div></div>`;

    // --- Section: Alerts Management ---
    html += `<div class="settings-panel" data-panel="alerts" style="display:none;">`;
    html += `<div class="settings-section">`;
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">${t('settings.alertsTitle')}</h4>`;
    html += `<p style="font-size:12px;color:var(--bt-grey-600);margin-bottom:16px;">${t('settings.alertsDesc')}</p>`;
    
    // Alert types with proper cards
    const alertConfig = getAlertConfig();
    const alertTypes = [
        { 
            id: 'overCapacity', 
            label: t('settings.alertOverCapacity'), 
            icon: '🔴',
            type: 'Capacity',
            level: 'critical',
            description: 'Alert pojawia się gdy zespół przekracza 100% dostępności w sprincie'
        },
        { 
            id: 'noAllocation', 
            label: t('settings.alertNoAllocation'), 
            icon: '🟠',
            type: 'Projekt',
            level: 'warning',
            description: 'Alert pojawia się gdy projekt ma zespół, ale bez alokacji w następnych 4 tygodniach'
        },
        { 
            id: 'deadlineApproaching', 
            label: t('settings.alertDeadlineApproaching'), 
            icon: '⏰',
            type: 'Projekt',
            level: 'warning',
            description: 'Alert pojawia się gdy termin realizacji jest w ciągu 14 dni od dziś'
        },
        { 
            id: 'openRisks', 
            label: t('settings.alertOpenRisks'), 
            icon: '⚠️',
            type: 'Ryzyko',
            level: 'critical',
            description: 'Alert pojawia się gdy projekt ma 3 lub więcej otwartych ryzyk'
        },
        { 
            id: 'noKeyRole', 
            label: t('settings.alertNoKeyRole'), 
            icon: '👤',
            type: 'Dostępność',
            level: 'critical',
            description: 'Alert pojawia się gdy brakuje Developer lub QA w następnym sprincie'
        },
    ];

    const levelColors = {
        critical: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        opportunity: '#10b981'
    };

    const levelLabels = {
        critical: 'Krytyczny',
        warning: 'Ostrzeżenie',
        info: 'Informacja',
        opportunity: 'Szansa'
    };

    html += `<div class="settings-items" style="gap:12px;">`;
    alertTypes.forEach(alertType => {
        const config = alertConfig[alertType.id];
        const isEnabled = config?.enabled !== false;
        const levelColor = levelColors[config?.level || alertType.level] || '#666';
        
        html += `<div style="display:grid;grid-template-columns:1fr auto auto;gap:16px;padding:12px;background:var(--bt-grey-50);border-radius:4px;border:1px solid var(--bt-grey-200);border-left:4px solid ${levelColor};">
            <div style="min-width:0;">
                <div style="font-size:12px;font-weight:600;color:var(--bt-navy);margin-bottom:4px;">${alertType.icon} ${alertType.label}</div>
                <div style="font-size:11px;color:var(--bt-grey-600);margin-bottom:8px;line-height:1.4;">${config?.description || alertType.description}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:10px;background:var(--bt-grey-200);color:var(--bt-navy);padding:2px 6px;border-radius:3px;font-weight:600;">Typ: ${alertType.type}</span>
                    <span style="font-size:10px;background:${levelColor}20;color:${levelColor};padding:2px 6px;border-radius:3px;font-weight:600;">🎯 ${levelLabels[config?.level || alertType.level]}</span>
                    ${config?.thresholdOp ? `<span style="font-size:10px;background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:3px;font-weight:600;">Próg: ${config.thresholdOp} ${config.threshold}</span>` : ''}
                </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;justify-content:center;">
                <button class="edit-btn alert-edit-btn" data-alert-type="${alertType.id}" style="padding:6px 12px;font-size:11px;white-space:nowrap;background:var(--bt-cyan);color:white;border:none;border-radius:3px;cursor:pointer;">✎ Edytuj regułę</button>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:center;min-width:100px;">
                <div style="font-size:10px;font-weight:600;color:var(--bt-grey-600);">Status</div>
                <div style="position:relative;width:50px;height:26px;">
                    <input type="checkbox" class="alert-toggle" data-alert-type="${alertType.id}" ${isEnabled ? 'checked' : ''} style="position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0;" />
                    <div style="position:absolute;top:0;left:0;width:50px;height:26px;background:${isEnabled ? '#10b981' : '#cbd5e1'};border-radius:13px;transition:background 0.3s;pointer-events:none;">
                        <div style="position:absolute;top:3px;${isEnabled ? 'right:3px;' : 'left:3px;'}width:20px;height:20px;background:white;border-radius:10px;transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.15);"></div>
                    </div>
                </div>
                <span style="font-size:11px;font-weight:600;color:var(--bt-navy);height:16px;">${isEnabled ? '✓ Włączony' : '✗ Wyłączony'}</span>
            </div>
        </div>`;
    });
    html += `</div>`;
    html += `</div></div>`;

    // --- Section: Custom Alerts ---
    html += `<div class="settings-panel" data-panel="alerts" style="display:none;">`;
    html += `<div class="settings-section" style="margin-top:24px;">`;
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">🆕 Niestandardowe alerty</h4>`;
    html += `<p style="font-size:12px;color:var(--bt-grey-600);margin-bottom:12px;">Stwórz własne reguły alertów na bazie kryteriów.</p>`;
    
    // Load custom alerts from localStorage
    let customAlerts = [];
    try {
        const saved = localStorage.getItem('cp_custom_alerts');
        if (saved) customAlerts = JSON.parse(saved);
    } catch (e) { }

    // Display existing custom alerts
    if (customAlerts.length > 0) {
        html += `<div class="settings-items" style="gap:8px; margin-bottom:12px;">`;
        customAlerts.forEach((alert, idx) => {
            const statusColor = alert.enabled ? 'var(--accent-green)' : 'var(--bt-grey-400)';
            html += `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bt-grey-50); border-radius:4px; border:1px solid var(--bt-grey-200);">
                <input type="checkbox" class="custom-alert-toggle" data-idx="${idx}" ${alert.enabled ? 'checked' : ''} style="cursor:pointer; width:18px; height:18px;" />
                <div style="flex:1;">
                    <div style="font-size:12px; font-weight:600; color:var(--bt-navy);">${alert.name}</div>
                    <div style="font-size:11px; color:var(--bt-grey-600);">Typ: ${alert.type} | ${alert.condition}</div>
                </div>
                <button class="edit-btn custom-alert-edit" data-idx="${idx}" style="padding:4px 8px; font-size:11px;">✎</button>
                <button class="delete-btn custom-alert-delete" data-idx="${idx}" style="padding:4px 8px; font-size:11px;">×</button>
                <span style="font-size:11px; color:${statusColor}; font-weight:600;">${alert.enabled ? '✓ On' : '✗ Off'}</span>
            </div>`;
        });
        html += `</div>`;
    }

    // Add new custom alert form
    html += `<div style="background:var(--bt-grey-50); padding:12px; border-radius:4px; border:1px solid var(--bt-grey-200);">
        <div style="margin-bottom:12px;">
            <label style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Nazwa alertu</span>
                <input type="text" id="custom-alert-name" class="inline-edit" placeholder="np. 'Projekt bez IT Lead'" style="font-size:12px;" />
            </label>

            <label style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Typ warunku</span>
                <select id="custom-alert-type" class="inline-edit" style="font-size:12px;">
                    <option value="project-field">Projekt — pole puste</option>
                    <option value="project-status">Projekt — status równy</option>
                    <option value="team-allocation">Zespół — brak alokacji</option>
                    <option value="deadline-days">Projekt — termin za N dni</option>
                    <option value="health-status">Projekt — zdrowie równe</option>
                </select>
            </label>

            <label style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Parametry warunku</span>
                <input type="text" id="custom-alert-params" class="inline-edit" placeholder="np. 'lead' lub '14' lub 'green'" style="font-size:12px;" />
            </label>

            <label style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <span style="font-size:11px; font-weight:600; color:var(--bt-navy);">Opis / Instrukcja</span>
                <textarea id="custom-alert-desc" class="inline-edit" placeholder="Jak wyłączyć ten alert? Co sprawdzić?" style="width:100%; font-size:11px; padding:8px; border:1px solid var(--bt-grey-200); border-radius:3px; min-height:60px; resize:vertical;"></textarea>
            </label>
        </div>
        <button class="edit-btn" id="add-custom-alert-btn" style="padding:6px 12px; font-size:11px; width:100%; background:var(--accent-green); color:white; border:none; cursor:pointer;">+ Dodaj niestandardowy alert</button>
    </div>`;
    html += `</div></div>`;
    html += `<div class="settings-panel" data-panel="import" style="display:none;">`;
    html += `<div class="settings-section">`;
    
    // === JIRA Import Section ===
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">📋 Import z Jiry (LSG)</h4>`;
    html += `<div class="settings-info" style="background:var(--bt-grey-50);padding:12px;border-radius:4px;margin-bottom:12px;border-left:4px solid var(--bt-cyan);">`;
    html += `<p style="font-size:12px;color:var(--bt-grey-600);margin-bottom:8px;">Importuj zadania z Jiry LSG do alokacji zespołów. Obsługiwane pola:</p>`;
    html += `<ul style="font-size:11px;color:var(--bt-grey-600);margin-left:20px;list-style:disc;">`;
    html += `<li><code style="background:white;padding:2px 4px;">Original Estimate</code> (dev) → Man-Days</li>`;
    html += `<li><code style="background:white;padding:2px 4px;">Test Estimate (QA)</code> → Man-Days</li>`;
    html += `<li><code style="background:white;padding:2px 4px;">Assignee</code> → Osoba + Zespół</li>`;
    html += `<li><code style="background:white;padding:2px 4px;">Status</code> → Scope Planner</li>`;
    html += `</ul>`;
    html += `</div>`;
    
    html += `<div style="background:var(--bt-white);border:1px solid var(--bt-grey-200);border-radius:4px;padding:12px;margin-bottom:12px;">`;
    html += `<div style="margin-bottom:12px;">`;
    html += `<label style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">`;
    html += `<span style="font-size:11px;font-weight:600;color:var(--bt-navy);">Backend URL</span>`;
    html += `<input type="text" id="jira-backend-url" class="inline-edit" placeholder="http://localhost:5000" style="font-size:12px;" value="http://localhost:5000" />`;
    html += `</label>`;
    html += `<label style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">`;
    html += `<span style="font-size:11px;font-weight:600;color:var(--bt-navy);">Projekt Jiry</span>`;
    html += `<input type="text" id="jira-project" class="inline-edit" placeholder="np. LSG" style="font-size:12px;" value="LSG" />`;
    html += `</label>`;
    html += `<label style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">`;
    html += `<span style="font-size:11px;font-weight:600;color:var(--bt-navy);">JQL Query (opcjonalnie)</span>`;
    html += `<textarea id="jira-jql" class="inline-edit" placeholder="np. project=LSG AND assignee=currentUser()" style="font-size:11px;padding:8px;border:1px solid var(--bt-grey-200);border-radius:3px;min-height:50px;resize:vertical;width:100%;"></textarea>`;
    html += `</label>`;
    html += `</div>`;
    html += `<div style="display:flex;gap:8px;margin-bottom:12px;">`;
    html += `<button class="edit-btn" id="jira-test-connection" style="padding:8px 12px;font-size:11px;flex:1;">🔗 Test połączenia</button>`;
    html += `<button class="edit-btn" id="jira-fetch-preview" style="padding:8px 12px;font-size:11px;flex:1;background:var(--bt-cyan);color:white;">👁️ Podgląd</button>`;
    html += `</div>`;
    html += `<div id="jira-preview-container" style="margin-bottom:12px;display:none;"></div>`;
    html += `<button class="edit-btn" id="jira-import-confirm" style="padding:8px 12px;font-size:11px;width:100%;background:var(--accent-green);color:white;display:none;">✓ Potwierdź import</button>`;
    html += `<div id="jira-status-message" style="font-size:11px;color:var(--bt-grey-600);margin-top:8px;"></div>`;
    html += `</div>`;
    
    // === Excel Import Section (legacy) ===
    html += `<h4 style="font-size:13px;font-weight:600;margin-top:24px;margin-bottom:12px;">📊 Import z Excel (legacy)</h4>`;
    html += `<div class="settings-info">`;
    html += `<p style="font-size:12px;color:var(--bt-grey-600);">Źródło: <code style="font-size:11px;background:var(--bt-grey-100);padding:2px 6px;border-radius:3px;">capacity.xlsx</code> (GitHub Pages)</p>`;
    html += `<p style="font-size:12px;color:var(--bt-grey-600);">Załadowane osoby: <strong>${Object.keys(excelAvailability).length}</strong> | Tygodnie: <strong>${excelWeekDates.length}</strong></p>`;
    html += `</div>`;
    html += `<div class="settings-add-row" style="margin-top:12px;">
        <button class="edit-btn" id="reimport-excel-btn">${t('settings.importBtn')}</button>
    </div>`;
    html += `</div></div>`;

    // --- Section: Data reset ---
    html += `<div class="settings-panel" data-panel="data" style="display:none;">`;
    html += `<div class="settings-section">`;
    html += `<h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">${t('settings.data')}</h4>`;
    html += `<div class="settings-add-row" style="gap:12px;">
        <button class="delete-btn" id="reset-all-data" style="padding:8px 16px;">${t('settings.resetData')}</button>
    </div>`;
    html += `</div></div>`;

    container.innerHTML = html;

    // --- Tab navigation ---
    container.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const panelId = tab.dataset.settingsTab;
            container.querySelectorAll('.settings-panel').forEach(p => {
                p.style.display = p.dataset.panel === panelId ? '' : 'none';
            });
        });
    });

    // --- Bindings ---

    // Add team
    container.querySelector('#add-team-btn').addEventListener('click', () => {
        const name = document.getElementById('new-team-name').value.trim();
        const id = document.getElementById('new-team-id').value.trim().toLowerCase().replace(/\s+/g, '_');
        const color = document.getElementById('new-team-color').value;
        if (!name || !id) { alert('Podaj nazwę i ID zespołu'); return; }
        if (TEAMS.find(t => t.id === id)) { alert('Zespół o takim ID już istnieje'); return; }
        TEAMS.push({ id, name, color });
        saveSettings();
        renderSettings();
    });

    // Remove team
    container.querySelectorAll('.settings-remove-team').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.teamIdx);
            const team = TEAMS[idx];
            if (!confirm(`Usunąć zespół "${team.name}"? Osoby przypisane do tego zespołu nie zostaną usunięte.`)) return;
            TEAMS.splice(idx, 1);
            saveSettings();
            renderSettings();
        });
    });

    // Change team color
    container.querySelectorAll('.settings-color-input').forEach(input => {
        input.addEventListener('change', () => {
            const idx = parseInt(input.dataset.teamIdx);
            TEAMS[idx].color = input.value;
            saveSettings();
            renderSettings();
        });
    });

    // Add role
    container.querySelector('#add-role-btn').addEventListener('click', () => {
        const name = document.getElementById('new-role-name').value.trim();
        if (!name) { alert('Podaj nazwę roli'); return; }
        if (ROLES.includes(name)) { alert('Taka rola już istnieje'); return; }
        ROLES.push(name);
        ROLE_SORT_ORDER[name] = Math.max(...Object.values(ROLE_SORT_ORDER)) + 1;
        saveSettings();
        renderSettings();
    });

    // Remove role
    container.querySelectorAll('.settings-remove-role').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.roleIdx);
            const role = ROLES[idx];
            if (!confirm(`Usunąć rolę "${role}"?`)) return;
            ROLES.splice(idx, 1);
            delete ROLE_SORT_ORDER[role];
            saveSettings();
            renderSettings();
        });
    });

    // Add person
    container.querySelector('#settings-add-person-btn').addEventListener('click', () => {
        const name = document.getElementById('settings-new-person-name').value.trim();
        const role = document.getElementById('settings-new-person-role').value;
        const team = document.getElementById('settings-new-person-team').value;
        if (!name) { alert('Podaj imię i nazwisko'); return; }
        if (PEOPLE.find(p => p.name === name)) { alert('Osoba o tym imieniu już istnieje'); return; }
        addPerson({ name, role, team, projects: [] });
        renderSettings();
    });

    // Remove person
    container.querySelectorAll('.settings-remove-person').forEach(btn => {
        btn.addEventListener('click', () => {
            const personName = btn.dataset.person;
            if (!confirm(`Usunąć osobę "${personName}"?`)) return;
            removePerson(personName);
            renderSettings();
        });
    });

    // Edit person (open modal)
    container.querySelectorAll('.settings-edit-person').forEach(btn => {
        btn.addEventListener('click', () => {
            const personName = btn.dataset.person;
            const person = PEOPLE.find(p => p.name === personName);
            if (!person) return;

            // Populate modal
            document.getElementById('editPersonTitle').textContent = `Edytuj: ${personName}`;
            
            // Roles
            const roleSelect = document.getElementById('editPersonRole');
            roleSelect.innerHTML = ROLES.map(r => `<option value="${r}" ${r === person.role ? 'selected' : ''}>${r}</option>`).join('');
            
            // Teams
            const teamSelect = document.getElementById('editPersonTeam');
            teamSelect.innerHTML = TEAMS.map(t => `<option value="${t.name}" ${t.name === person.team ? 'selected' : ''}>${t.name}</option>`).join('');
            
            // Assigned Teams (multi-select)
            const assignedTeamsSelect = document.getElementById('editPersonAssignedTeams');
            assignedTeamsSelect.innerHTML = TEAMS.map(t => `<option value="${t.name}" ${(person.assignedTeams && person.assignedTeams.includes(t.name)) ? 'selected' : ''}>${t.name}</option>`).join('');
            
            // Employment type
            document.getElementById('editPersonEmploymentType').value = person.employmentType || 'full-time';
            
            // Availability
            document.getElementById('editPersonAvailability').value = person.availability || 100;
            document.getElementById('editPersonAvailabilityFrom').value = person.availabilityFrom || '';
            document.getElementById('editPersonAvailabilityTo').value = person.availabilityTo || '';
            document.getElementById('editPersonNotes').value = person.notes || '';
            
            // Show modal
            document.getElementById('editPersonModal').style.display = 'flex';
            
            // Store original name for update
            document.getElementById('saveEditPersonBtn').dataset.personName = personName;
        });
    });

    // Modal: Close buttons
    document.getElementById('closeEditPersonBtn').addEventListener('click', () => {
        document.getElementById('editPersonModal').style.display = 'none';
    });
    document.getElementById('cancelEditPersonBtn').addEventListener('click', () => {
        document.getElementById('editPersonModal').style.display = 'none';
    });

    // Modal: Save button
    document.getElementById('saveEditPersonBtn').addEventListener('click', () => {
        const personName = document.getElementById('saveEditPersonBtn').dataset.personName;
        const person = PEOPLE.find(p => p.name === personName);
        if (!person) return;

        const newRole = document.getElementById('editPersonRole').value;
        const newTeam = document.getElementById('editPersonTeam').value;
        const newEmploymentType = document.getElementById('editPersonEmploymentType').value;
        const newAvailability = parseInt(document.getElementById('editPersonAvailability').value) || 100;
        const newAvailabilityFrom = document.getElementById('editPersonAvailabilityFrom').value || '';
        const newAvailabilityTo = document.getElementById('editPersonAvailabilityTo').value || '';
        const newNotes = document.getElementById('editPersonNotes').value.trim();

        // Validate
        if (newAvailability < 0 || newAvailability > 100) {
            alert('Dostępność musi być między 0% a 100%');
            return;
        }

        // Update person
        person.role = newRole;
        person.team = newTeam;
        person.employmentType = newEmploymentType;
        person.availability = newAvailability;
        person.availabilityFrom = newAvailabilityFrom;
        person.availabilityTo = newAvailabilityTo;
        person.notes = newNotes;
        
        // Update assigned teams (multi-select)
        const assignedTeamsSelect = document.getElementById('editPersonAssignedTeams');
        const selectedOptions = assignedTeamsSelect.selectedOptions;
        person.assignedTeams = Array.from(selectedOptions).map(opt => opt.value);

        savePeople();
        document.getElementById('editPersonModal').style.display = 'none';
        renderSettings();
        renderCapacityBars();
        renderTeams();
    });

    // Add company day off
    container.querySelector('#settings-add-co-btn').addEventListener('click', () => {
        const val = document.getElementById('settings-new-co-date').value;
        if (val && !companyDaysOff.includes(val)) {
            companyDaysOff.push(val);
            companyDaysOff.sort();
            saveTeamsData();
            renderSettings();
        }
    });

    // Remove company day off
    container.querySelectorAll('.remove-co-settings').forEach(btn => {
        btn.addEventListener('click', () => {
            companyDaysOff.splice(parseInt(btn.dataset.idx), 1);
            saveTeamsData();
            renderSettings();
        });
    });

    // --- PUBLIC HOLIDAYS MANAGEMENT ---
    
    // Remove holiday
    container.querySelectorAll('.remove-holiday-settings').forEach(btn => {
        btn.addEventListener('click', () => {
            const dateToRemove = btn.dataset.date;
            for (const year in publicHolidays) {
                publicHolidays[year] = publicHolidays[year].filter(h => h.date !== dateToRemove);
            }
            saveTeamsData();
            renderSettings();
        });
    });

    // Import holidays for specific year
    container.querySelectorAll('.import-holidays-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const year = btn.dataset.year;
            if (DEFAULT_PUBLIC_HOLIDAYS[year]) {
                publicHolidays[year] = JSON.parse(JSON.stringify(DEFAULT_PUBLIC_HOLIDAYS[year]));
                saveTeamsData();
                renderSettings();
            }
        });
    });

    // Add custom holiday
    const addHolidayBtn = container.querySelector('#settings-add-holiday-btn');
    if (addHolidayBtn) {
        addHolidayBtn.addEventListener('click', () => {
            const dateInput = container.querySelector('#settings-new-holiday-date');
            const namePlInput = container.querySelector('#settings-new-holiday-name-pl');
            const nameEnInput = container.querySelector('#settings-new-holiday-name-en');

            const date = dateInput.value;
            const name_pl = namePlInput.value.trim();
            const name_en = nameEnInput.value.trim();

            if (!date) {
                alert('Podaj datę.');
                return;
            }
            if (!name_pl || !name_en) {
                alert('Podaj nazwę w PL i EN.');
                return;
            }

            const year = date.substring(0, 4);
            if (!publicHolidays[year]) {
                publicHolidays[year] = [];
            }

            // Check for duplicates
            if (publicHolidays[year].some(h => h.date === date)) {
                alert('Święto w tej dacie już istnieje.');
                return;
            }

            publicHolidays[year].push({ date, name_pl, name_en });
            publicHolidays[year].sort((a, b) => new Date(a.date) - new Date(b.date));

            saveTeamsData();
            dateInput.value = '';
            namePlInput.value = '';
            nameEnInput.value = '';
            renderSettings();
        });
    }

    // --- TRAININGS MANAGEMENT ---

    // Add training
    const addTrainingBtn = container.querySelector('#settings-add-training-btn');
    if (addTrainingBtn) {
        addTrainingBtn.addEventListener('click', () => {
            const personSelect = container.querySelector('#settings-new-training-person');
            const dateFromInput = container.querySelector('#settings-new-training-dateFrom');
            const dateToInput = container.querySelector('#settings-new-training-dateTo');
            const hoursInput = container.querySelector('#settings-new-training-hours');
            const typeSelect = container.querySelector('#settings-new-training-type');
            const descInput = container.querySelector('#settings-new-training-desc');

            const personName = personSelect.value.trim();
            const dateFrom = dateFromInput.value;
            const dateTo = dateToInput.value;
            const hoursPerDay = parseFloat(hoursInput.value);
            const trainingType = typeSelect.value.trim();
            const description = descInput.value.trim();

            if (!personName) {
                alert('Wybierz osobę');
                return;
            }
            if (!dateFrom || !dateTo) {
                alert('Podaj daty początkową i końcową');
                return;
            }
            if (isNaN(hoursPerDay) || hoursPerDay < 0 || hoursPerDay > 8) {
                alert('Podaj godziny dziennie (0-8)');
                return;
            }
            if (!trainingType) {
                alert('Wybierz typ szkolenia');
                return;
            }

            const newId = 'tr_' + Date.now();
            trainings.push({
                id: newId,
                personName,
                dateFrom,
                dateTo,
                hoursPerDay,
                trainingType,
                description,
                status: 'scheduled'
            });

            saveTeamsData();
            personSelect.value = '';
            dateFromInput.value = '';
            dateToInput.value = '';
            hoursInput.value = '';
            typeSelect.value = '';
            descInput.value = '';
            renderSettings();
            renderCapacityBars();
            renderTeams();
        });
    }

    // Delete training
    container.querySelectorAll('.delete-training-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trainingId = btn.dataset.trainingId;
            trainings = trainings.filter(t => t.id !== trainingId);
            saveTeamsData();
            renderSettings();
            renderCapacityBars();
            renderTeams();
        });
    });

    // Edit training (TODO: implement edit modal if needed)
    container.querySelectorAll('.edit-training-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trainingId = btn.dataset.trainingId;
            // For now, just show a simple edit prompt
            // TODO: Implement full edit modal similar to edit person modal
            alert('Edycja szkoleń - wkrótce dostępne');
        });
    });

    // Add company day off
    const fridayBtn = container.querySelector('#save-friday-factor');
    if (fridayBtn) {
        fridayBtn.addEventListener('click', () => {
            const val = parseInt(document.getElementById('settings-friday-factor').value);
            if (!isNaN(val) && val >= 0 && val <= 100) {
                FRIDAY_FACTOR = val / 100;
                saveSettings();
                renderSettings();
                renderCapacityBars();
                renderActionNeeded();
                renderSprintAvailability();
                renderTimeline();
            }
        });
    }

    // Save capacity params
    const paramsBtn = container.querySelector('#save-capacity-params');
    if (paramsBtn) {
        paramsBtn.addEventListener('click', () => {
            // Collect values per team
            const teamValues = {};
            container.querySelectorAll('.param-input').forEach(input => {
                const teamId = input.dataset.team;
                const field = input.dataset.field;
                const val = parseInt(input.value) || 0;
                if (!teamValues[teamId]) teamValues[teamId] = {};
                teamValues[teamId][field] = val;
            });

            // Validate: check if any team exceeds 100%
            const errors = [];
            Object.entries(teamValues).forEach(([teamId, vals]) => {
                const sum = (vals.overhead || 0) + (vals.scrum || 0) + (vals.maintenance || 0) + (vals.bau || 0) + (vals.projects || 0);
                if (sum > 100) {
                    const team = TEAMS.find(t => t.id === teamId);
                    errors.push(`${team ? team.name : teamId}: ${sum}%`);
                }
            });

            if (errors.length > 0) {
                alert(`Suma parametrów przekracza 100% dla:\n\n${errors.join('\n')}\n\nPopraw wartości przed zapisem.`);
                return;
            }

            // Apply values
            Object.entries(teamValues).forEach(([teamId, vals]) => {
                if (!CAPACITY_PARAMS[teamId]) CAPACITY_PARAMS[teamId] = {};
                Object.assign(CAPACITY_PARAMS[teamId], vals);
            });

            saveSettings();
            renderSettings();
            renderCapacityBars();
            renderActionNeeded();
            renderSprintAvailability();
            renderTimeline();
            renderWorkloadGrid();
        });
    }

    // Live validation — update sum cell on input change
    container.querySelectorAll('.param-input').forEach(input => {
        input.addEventListener('input', () => {
            const teamId = input.dataset.team;
            const inputs = container.querySelectorAll(`.param-input[data-team="${teamId}"]`);
            let sum = 0;
            inputs.forEach(inp => { sum += parseInt(inp.value) || 0; });
            const sumCell = container.querySelector(`.param-sum-cell[data-sum-team="${teamId}"]`);
            if (sumCell) {
                sumCell.textContent = sum + '%';
                sumCell.style.color = sum > 100 ? 'var(--accent-red)' : sum === 100 ? 'var(--accent-green)' : 'var(--accent-yellow)';
            }
        });
    });

    // ===== JIRA IMPORT HANDLERS =====
    // Use localStorage to persist preview data across renderSettings calls
    const getJiraPreviewData = () => {
        try {
            const data = localStorage.getItem('jira_preview_data');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    };
    
    const setJiraPreviewData = (data) => {
        try {
            localStorage.setItem('jira_preview_data', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save jira_preview_data:', e);
        }
    };
    
    // Test Jira connection
    const testConnBtn = container.querySelector('#jira-test-connection');
    if (testConnBtn) {
        testConnBtn.addEventListener('click', async () => {
            const btn = container.querySelector('#jira-test-connection');
            const statusDiv = container.querySelector('#jira-status-message');
            const backendUrl = container.querySelector('#jira-backend-url').value.trim();
            
            btn.textContent = '⏳ Testuję...';
            btn.disabled = true;
            statusDiv.textContent = '';
            
            try {
                const resp = await fetch(`${backendUrl}/api/test-jira-connection`);
                const result = await resp.json();
                if (result.success) {
                    statusDiv.style.color = 'var(--accent-green)';
                    statusDiv.textContent = `✓ ${result.message}`;
                } else {
                    statusDiv.style.color = 'var(--accent-red)';
                    statusDiv.textContent = `✗ Błąd: ${result.message}`;
                }
            } catch (err) {
                statusDiv.style.color = 'var(--accent-red)';
                statusDiv.textContent = `✗ Błąd połączenia: ${err.message}`;
            } finally {
                btn.textContent = '🔗 Test połączenia';
                btn.disabled = false;
            }
        });
    }
    
    // Fetch Jira preview
    const fetchPreviewBtn = container.querySelector('#jira-fetch-preview');
    if (fetchPreviewBtn) {
        fetchPreviewBtn.addEventListener('click', async () => {
            const btn = container.querySelector('#jira-fetch-preview');
            const previewDiv = container.querySelector('#jira-preview-container');
            const statusDiv = container.querySelector('#jira-status-message');
            const project = container.querySelector('#jira-project').value.trim();
            const jql = container.querySelector('#jira-jql').value.trim();
            const backendUrl = container.querySelector('#jira-backend-url').value.trim();
            
            btn.textContent = '⏳ Pobbieram...';
            btn.disabled = true;
            statusDiv.textContent = '';
            previewDiv.style.display = 'none';
            previewDiv.innerHTML = '';
            
            try {
                const payload = {
                    project: project || 'LSG',
                    jql: jql || `project=${project || 'LSG'}`,
                    fields: ['key', 'summary', 'assignee', 'status', 'timeoriginalestimate', 'cf[10695]', 'customfield_10270']
                };
                
                const resp = await fetch(`${backendUrl}/api/jira/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await resp.json();
                
                if (result.success && result.issues && result.issues.length > 0) {
                    setJiraPreviewData(result);
                    
                    // Render preview table
                    let html = `<div style="border:1px solid var(--bt-grey-200);border-radius:4px;overflow:auto;max-height:300px;margin-bottom:12px;">`;
                    html += `<table style="width:100%;border-collapse:collapse;font-size:11px;">`;
                    html += `<thead style="background:var(--bt-navy);color:white;position:sticky;top:0;">`;
                    html += `<tr>`;
                    html += `<th style="padding:8px;text-align:left;border-right:1px solid var(--bt-grey-300);">Key</th>`;
                    html += `<th style="padding:8px;text-align:left;border-right:1px solid var(--bt-grey-300);">Osoba</th>`;
                    html += `<th style="padding:8px;text-align:center;border-right:1px solid var(--bt-grey-300);">Dev MD</th>`;
                    html += `<th style="padding:8px;text-align:center;border-right:1px solid var(--bt-grey-300);">QA MD</th>`;
                    html += `<th style="padding:8px;text-align:left;">Status</th>`;
                    html += `</tr>`;
                    html += `</thead>`;
                    html += `<tbody>`;
                    
                    result.issues.forEach((issue, idx) => {
                        const bgColor = idx % 2 === 0 ? 'white' : 'var(--bt-grey-50)';
                        html += `<tr style="background:${bgColor};border-bottom:1px solid var(--bt-grey-200);">`;
                        html += `<td style="padding:8px;border-right:1px solid var(--bt-grey-300);font-weight:600;color:var(--bt-cyan);">${issue.key}</td>`;
                        html += `<td style="padding:8px;border-right:1px solid var(--bt-grey-300);">${issue.assignee || '—'}</td>`;
                        html += `<td style="padding:8px;text-align:center;border-right:1px solid var(--bt-grey-300);">${issue.dev_estimate_md || '—'}</td>`;
                        html += `<td style="padding:8px;text-align:center;border-right:1px solid var(--bt-grey-300);">${issue.qa_estimate_md || '—'}</td>`;
                        html += `<td style="padding:8px;">${issue.status || '—'}</td>`;
                        html += `</tr>`;
                    });
                    
                    html += `</tbody></table></div>`;
                    previewDiv.innerHTML = html;
                    previewDiv.style.display = 'block';
                    
                    statusDiv.style.color = 'var(--accent-green)';
                    statusDiv.textContent = `✓ Znaleziono ${result.issues.length} zadań. Kliknij "Potwierdź import" aby dodać do alokacji.`;
                    
                    // Show import button
                    container.querySelector('#jira-import-confirm').style.display = 'block';
                } else {
                    statusDiv.style.color = 'var(--accent-red)';
                    statusDiv.textContent = `✗ ${result.message || 'Brak zadań lub błąd importu'}`;
                }
            } catch (err) {
                statusDiv.style.color = 'var(--accent-red)';
                statusDiv.textContent = `✗ Błąd: ${err.message}`;
            } finally {
                btn.textContent = '👁️ Podgląd';
                btn.disabled = false;
            }
        });
    }
    
    // Confirm Jira import
    const confirmBtn = container.querySelector('#jira-import-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const jiraData = getJiraPreviewData();
            if (!jiraData || !jiraData.issues) {
                alert('Brak danych do importu. Kliknij "Podgląd" najpierw.');
                return;
            }
            
            const btn = container.querySelector('#jira-import-confirm');
            const statusDiv = container.querySelector('#jira-status-message');
            
            btn.textContent = '⏳ Importuję...';
            btn.disabled = true;
            
            try {
                // Merge Jira issues into PROJECTS
                let addedCount = 0;
                
                console.log('🔍 Import START - jiraData:', jiraData);
                console.log('🔍 Issues count:', jiraData?.issues?.length);
                console.log('🔍 Current PROJECTS.length:', PROJECTS.length);
                console.log('🔍 SPRINTS available:', SPRINTS.length, 'first sprint:', SPRINTS[0]);
                
                if (!jiraData?.issues || jiraData.issues.length === 0) {
                    throw new Error('Brak zadań do importu');
                }
                
                console.log('🔍 First issue sample:', JSON.stringify(jiraData.issues[0]));
                
                jiraData.issues.forEach((issue, idx) => {
                    console.log(`📦 [${idx}] Processing:`, issue.key, issue.summary, 'assignee:', issue.assignee);
                    // Find or create project for this issue
                    let existingProject = PROJECTS.find(p => p.name === issue.key);
                    console.log(`   🔍 Looking for project with name="${issue.key}" - found:`, existingProject ? 'YES' : 'NO');
                    
                    let project;
                    if (!existingProject) {
                        project = {
                            id: `jira-${issue.key}`,
                            name: issue.key,
                            category: 'backlog',
                            responsible: issue.assignee || '—',
                            shortName: issue.key,
                            status: 'not_started',
                            health: 'green',
                            budget: 100,
                            spent: 0,
                            description: issue.summary || '',
                            notes: [],
                            risks: [],
                            allocations: {},
                            jira_key: issue.key,
                            jira_status: issue.status
                        };
                        PROJECTS.push(project);
                        console.log('   ✅ CREATED & ADDED project:', issue.key);
                        addedCount++;
                    } else {
                        project = existingProject;
                        console.log('   ℹ️ Project already exists, skipping creation');
                    }
                    
                    // Try to add allocations to next sprint
                    const sprint = getNextSprint();
                    console.log('🔍 Sprint lookup - sprint:', sprint, 'has id:', sprint?.id, 'assignee:', issue.assignee);
                    
                    // If we have an assignee, add them to allocations
                    if (issue.assignee) {
                        let person = PEOPLE.find(p => p.name === issue.assignee);
                        
                        // If person doesn't exist, create with default team (ALF)
                        if (!person) {
                            person = {
                                name: issue.assignee,
                                role: 'Developer',
                                team: 'ALF',
                                projects: [],
                                employmentType: 'full-time',
                                availability: 100,
                                assignedTeams: []
                            };
                            PEOPLE.push(person);
                            console.log('✅ Created person:', issue.assignee);
                        }
                        
                        // Add to backlog sprint (sprint 0 or use sprint ID if available)
                        const sprintId = sprint?.id || 'backlog';
                        if (!project.allocations[sprintId]) {
                            project.allocations[sprintId] = {};
                        }
                        project.allocations[sprintId][person.name] = {
                            dev_md: issue.dev_estimate_md || 0,
                            qa_md: issue.qa_estimate_md || 0,
                            notes: `Jira: ${issue.key}`
                        };
                        console.log('✅ Added allocation for', person.name, 'to', issue.key, 'sprint:', sprintId);
                    } else {
                        console.warn('⚠️ No assignee for', issue.key);
                    }
                });
                
                console.log('✅ Import loop FINISHED - addedCount:', addedCount, 'PROJECTS.length now:', PROJECTS.length);
                
                saveProjects();
                savePeople();  // Save newly created people from Jira import
                saveAllocations();
                
                statusDiv.style.color = 'var(--accent-green)';
                // Show both new projects AND updated allocations
                const sprintForMsg = SPRINTS.find(s => s.id === 269) || SPRINTS[0];
                statusDiv.textContent = `✓ Przetworzono ${jiraData.issues.length} zadań - ${addedCount > 0 ? `dodano ${addedCount} nowych projektów` : 'zaktualizowano istniejące'} z alokacjami do ${sprintForMsg?.name || 'sprintu'}!`;
                
                // Re-render UI
                renderProjectsTable();
                renderWorkloadGrid();
                renderCapacityBars();
                
                // Hide preview and reset form
                setTimeout(() => {
                    container.querySelector('#jira-preview-container').style.display = 'none';
                    container.querySelector('#jira-import-confirm').style.display = 'none';
                    container.querySelector('#jira-jql').value = '';
                }, 2000);
            } catch (err) {
                statusDiv.style.color = 'var(--accent-red)';
                statusDiv.textContent = `✗ Błąd importu: ${err.message}`;
            } finally {
                btn.textContent = '✓ Potwierdź import';
                btn.disabled = false;
            }
        });
    }

    // Reimport Excel
    container.querySelector('#reimport-excel-btn').addEventListener('click', async () => {
        const btn = container.querySelector('#reimport-excel-btn');
        btn.textContent = 'Importuję...';
        btn.disabled = true;
        const success = await fetchAndParseExcel();
        if (success) {
            applyExcelToCalendar();
            renderCapacityBars();
            renderActionNeeded();
            renderSprintAvailability();
            renderTimeline();
            renderWorkloadGrid();
            renderTeams();
            alert(t('settings.importSuccess', { people: Object.keys(excelAvailability).length, weeks: excelWeekDates.length }));
        } else {
            alert(t('settings.importError'));
        }
        renderSettings();
    });

    // Reset all data
    container.querySelector('#reset-all-data').addEventListener('click', () => {
        if (!confirm(t('settings.resetConfirm'))) return;
        localStorage.removeItem('cp_projects');
        localStorage.removeItem('cp_allocations');
        localStorage.removeItem('cp_archived_projects');
        localStorage.removeItem('cp_sprints_custom');
        localStorage.removeItem('cp_sprint_goals');
        localStorage.removeItem('cp_person_assignments');
        localStorage.removeItem('cp_people');
        localStorage.removeItem('cp_company_days_off');
        localStorage.removeItem('cp_person_time_off');
        localStorage.removeItem('cp_settings');
        location.reload();
    });

    // Alert toggles
    container.querySelectorAll('.alert-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const alertType = e.target.dataset.alertType;
            const isEnabled = e.target.checked;
            if (isEnabled) {
                localStorage.removeItem(`alert_${alertType}`);
            } else {
                localStorage.setItem(`alert_${alertType}`, 'disabled');
            }
            // Update the label
            const label = e.target.parentElement.querySelector('span:last-of-type');
            if (label) {
                label.textContent = isEnabled ? '✓ Włączony' : '✗ Wyłączony';
            }
            // Re-render dashboard to reflect changes
            renderActionNeeded();
        });
    });

    // Alert configuration buttons — changed to open edit modal
    container.querySelectorAll('.alert-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alertType = e.target.dataset.alertType;
            openEditAlertModal(alertType);
        });
    });

    // Alert toggle switches
    container.querySelectorAll('.alert-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const alertType = e.target.dataset.alertType;
            const isChecked = e.target.checked;
            
            const config = getAlertConfig();
            config[alertType].enabled = isChecked;
            saveAlertConfig(config);
            
            // Trigger re-render of alerts
            renderActionNeeded();
            renderSettings();
        });

        // Update toggle visual on checkbox change
        checkbox.addEventListener('change', () => {
            const toggleDiv = checkbox.parentElement.querySelector('div[style*="border-radius:13px"]');
            const toggleBall = toggleDiv?.querySelector('div');
            if (checkbox.checked) {
                toggleDiv.style.background = '#10b981';
                if (toggleBall) {
                    toggleBall.style.right = '3px';
                    toggleBall.style.left = 'auto';
                }
            } else {
                toggleDiv.style.background = '#cbd5e1';
                if (toggleBall) {
                    toggleBall.style.left = '3px';
                    toggleBall.style.right = 'auto';
                }
            }
        });

        // Initial state sync
        const alertType = checkbox.dataset.alertType;
        const config = getAlertConfig();
        const isEnabled = config[alertType]?.enabled !== false;
        checkbox.checked = isEnabled;
    });

    // Custom alerts
    const bindCustomAlerts = () => {
        // Load custom alerts
        let customAlerts = [];
        try {
            const saved = localStorage.getItem('cp_custom_alerts');
            if (saved) customAlerts = JSON.parse(saved);
        } catch (e) { }

        // Add new custom alert
        const addBtn = container.querySelector('#add-custom-alert-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const name = container.querySelector('#custom-alert-name').value.trim();
                const type = container.querySelector('#custom-alert-type').value;
                const params = container.querySelector('#custom-alert-params').value.trim();
                const desc = container.querySelector('#custom-alert-desc').value.trim();
                
                if (!name || !type || !params) {
                    alert('Podaj: nazwę, typ warunku i parametry');
                    return;
                }

                const conditionLabel = {
                    'project-field': `Pole puste: ${params}`,
                    'project-status': `Status równy: ${params}`,
                    'team-allocation': `Brak alokacji dla: ${params}`,
                    'deadline-days': `Termin za ${params} dni`,
                    'health-status': `Zdrowie równe: ${params}`
                };

                customAlerts.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: name,
                    type: type,
                    condition: conditionLabel[type] || type,
                    params: params,
                    description: desc,
                    enabled: true,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('cp_custom_alerts', JSON.stringify(customAlerts));
                
                // Clear form
                container.querySelector('#custom-alert-name').value = '';
                container.querySelector('#custom-alert-type').value = 'project-field';
                container.querySelector('#custom-alert-params').value = '';
                container.querySelector('#custom-alert-desc').value = '';
                
                renderSettings();
                alert('Alert dodany! Pojawia się na dashboardzie jeśli jest włączony.');
            });
        }

        // Toggle custom alert
        container.querySelectorAll('.custom-alert-toggle').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (customAlerts[idx]) {
                    customAlerts[idx].enabled = e.target.checked;
                    localStorage.setItem('cp_custom_alerts', JSON.stringify(customAlerts));
                    renderActionNeeded();
                }
            });
        });

        // Edit custom alert
        container.querySelectorAll('.custom-alert-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const alert = customAlerts[idx];
                if (!alert) return;
                
                openCustomAlertEditModal(alert, idx, (updated) => {
                    customAlerts[idx] = updated;
                    localStorage.setItem('cp_custom_alerts', JSON.stringify(customAlerts));
                    renderSettings();
                });
            });
        });

        // Delete custom alert
        container.querySelectorAll('.custom-alert-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (!confirm('Usunąć ten alert?')) return;
                customAlerts.splice(idx, 1);
                localStorage.setItem('cp_custom_alerts', JSON.stringify(customAlerts));
                renderSettings();
            });
        });
    };

    bindCustomAlerts();
}

function saveSettings() {
    localStorage.setItem('cp_settings', JSON.stringify({
        teams: TEAMS,
        roles: ROLES,
        roleSortOrder: ROLE_SORT_ORDER,
        capacityParams: CAPACITY_PARAMS,
        fridayFactor: FRIDAY_FACTOR
    }));
}

function loadSettings() {
    const saved = localStorage.getItem('cp_settings');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.teams && Array.isArray(data.teams)) {
                TEAMS.length = 0;
                data.teams.forEach(t => TEAMS.push(t));
            }
            if (data.roles && Array.isArray(data.roles)) {
                ROLES.length = 0;
                data.roles.forEach(r => ROLES.push(r));
            }
            if (data.roleSortOrder) {
                Object.keys(ROLE_SORT_ORDER).forEach(k => delete ROLE_SORT_ORDER[k]);
                Object.assign(ROLE_SORT_ORDER, data.roleSortOrder);
            }
            if (data.capacityParams) {
                Object.assign(CAPACITY_PARAMS, data.capacityParams);
            }
            if (data.fridayFactor !== undefined) {
                FRIDAY_FACTOR = data.fridayFactor;
            }
        } catch (e) { /* use defaults */ }
    }
}

// ============================================================
// EXCEL IMPORT — Fetch capacity.xlsx and parse availability
// ============================================================

const EXCEL_URL = 'https://bolttech-kamilamolas.github.io/alfinator/data/capacity.xlsx';

// Parsed Excel data stored here
let excelAvailability = {}; // { 'PersonName': { '2026-07-28': 1.0, '2026-08-04': 0.65, ... } }
let excelWeekDates = [];    // [Date, Date, ...] — Monday of each week from Excel

async function fetchAndParseExcel() {
    try {
        const response = await fetch(EXCEL_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Find the capacity sheet (first sheet or one containing 'capacity')
        const sheetName = workbook.SheetNames.find(
            n => n.toLowerCase().includes('capacity')
        ) || workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        parseCapacitySheet(rows);

        // Also try to parse PARAMS sheet
        const paramsSheet = workbook.SheetNames.find(
            n => n.toLowerCase().includes('param')
        );
        if (paramsSheet) {
            const pRows = XLSX.utils.sheet_to_json(workbook.Sheets[paramsSheet], { header: 1, defval: '' });
            parseParamsSheet(pRows);
        }

        return true;
    } catch (err) {
        console.error('Excel import failed:', err);
        return false;
    }
}

function parseCapacitySheet(rows) {
    // Find header row with NAME, SURNAME, TEAM columns
    let headerRowIndex = -1;
    let nameCol = -1, surnameCol = -1, teamCol = -1, dateStartCol = -1;

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i].map(c => String(c).trim().toUpperCase());
        const ni = row.indexOf('NAME');
        const si = row.indexOf('SURNAME');
        const ti = row.findIndex(c => c === 'TEAM');

        if (ni !== -1 && si !== -1 && ti !== -1) {
            headerRowIndex = i;
            nameCol = ni;
            surnameCol = si;
            teamCol = ti;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.warn('Excel: cannot find header row with NAME/SURNAME/TEAM');
        return;
    }

    const headerRow = rows[headerRowIndex];

    // Find DATE column — week dates start after it
    const dateColIdx = headerRow.findIndex(c => String(c).trim().toUpperCase() === 'DATE');
    dateStartCol = dateColIdx !== -1 ? dateColIdx + 1 : teamCol + 1;

    // Parse week column dates
    excelWeekDates = [];
    const weekColIndices = [];

    for (let c = dateStartCol; c < headerRow.length; c++) {
        const val = headerRow[c];
        if (val === '' || val === undefined || val === null) continue;

        let weekDate = null;
        if (typeof val === 'number' && val > 40000) {
            // Excel serial date
            weekDate = excelSerialToDate(val);
        } else {
            const str = String(val).trim();
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                weekDate = parsed;
            }
        }

        if (weekDate) {
            excelWeekDates.push(weekDate);
            weekColIndices.push(c);
        }
    }

    // Parse person rows
    excelAvailability = {};

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row[nameCol] || '').trim();
        const surname = String(row[surnameCol] || '').trim();
        const team = String(row[teamCol] || '').trim().toUpperCase();

        if (!name || !team) continue;

        const fullName = `${name} ${surname}`;

        // Parse availability per week
        const weekData = {};
        weekColIndices.forEach((colIdx, wIdx) => {
            const cellVal = row[colIdx];
            const availability = parseAvailabilityValue(cellVal);
            const dateKey = formatDateKey(excelWeekDates[wIdx]);
            weekData[dateKey] = availability;
        });

        excelAvailability[fullName] = { team, weeks: weekData };
    }

    console.log(`Excel parsed: ${Object.keys(excelAvailability).length} people, ${excelWeekDates.length} weeks`);
}

function parseParamsSheet(rows) {
    // Look for known parameters in the PARAMS sheet
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const label = String(row[0] || '').trim().toLowerCase();

        if (label.includes('friday') || label.includes('piątek') || label.includes('piatek')) {
            const val = parseFloat(row[1]);
            if (!isNaN(val) && val > 0 && val <= 1) {
                // Will be used in settings
                console.log(`PARAMS: Friday factor = ${val}`);
            }
        }
    }
}

function parseAvailabilityValue(cellValue) {
    if (cellValue === null || cellValue === undefined || cellValue === '') return 1.0;
    const str = String(cellValue).trim();
    if (str === '0' || str === '0%') return 0;
    if (str.endsWith('%')) return parseFloat(str) / 100;
    const num = parseFloat(str);
    if (!isNaN(num)) {
        if (num > 1) return num / 100; // e.g. 65 -> 0.65
        return num; // already 0-1
    }
    return 1.0;
}

function excelSerialToDate(serial) {
    const utcDays = Math.floor(serial - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    // Fix timezone offset — ensure we get the correct local date
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Apply Excel data to the app: clear calendar and populate from Excel availability
function applyExcelToCalendar() {
    if (Object.keys(excelAvailability).length === 0) return;

    // Clear all personTimeOff
    personTimeOff = {};

    // For each person in Excel, mark days as off where availability = 0
    Object.entries(excelAvailability).forEach(([fullName, data]) => {
        const person = PEOPLE.find(p => p.name === fullName);
        if (!person) return;

        Object.entries(data.weeks).forEach(([weekDateKey, availability]) => {
            if (availability >= 1) return; // fully available, skip

            const weekStart = new Date(weekDateKey);
            if (isNaN(weekStart.getTime())) return;

            // Generate working days for this week (Mon-Fri)
            for (let d = 0; d < 5; d++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + d);
                const dayKey = formatDateKey(day);

                if (isWeekend(day) || isHoliday(dayKey) || isCompanyOff(dayKey)) continue;

                if (availability === 0) {
                    // Fully off this week
                    if (!personTimeOff[fullName]) personTimeOff[fullName] = [];
                    if (!personTimeOff[fullName].includes(dayKey)) {
                        personTimeOff[fullName].push(dayKey);
                    }
                }
            }
        });
    });

    saveTeamsData();
    console.log(`Calendar cleared and repopulated from Excel: ${Object.keys(personTimeOff).length} people with time-off`);
}

// Calculate capacity dynamically per team per week index
function calculateCapacity(teamId, weekIdx) {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return 0;

    const weekStart = new Date(BASE_DATE);
    weekStart.setDate(BASE_DATE.getDate() + weekIdx * 7);

    // Get all team members
    const members = PEOPLE.filter(p => p.team === team.name);
    let totalMD = 0;

    members.forEach(person => {
        // Check if we have Excel data for this person and this week
        const weekKey = formatDateKey(weekStart);
        const excelData = excelAvailability[person.name];

        if (excelData && excelData.weeks[weekKey] !== undefined) {
            // Use Excel availability × working days in week
            const availability = excelData.weeks[weekKey];
            const workDays = countWorkDaysInWeek(weekStart);
            totalMD += availability * workDays;
        } else {
            // Fallback: calculate from calendar (personTimeOff, holidays, etc.)
            for (let d = 0; d < 7; d++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + d);
                const { factor } = getDayStatus(person.name, day);
                totalMD += factor;
            }
        }
    });

    // Apply project allocation factor (only project % of total capacity is available for project work)
    const params = CAPACITY_PARAMS[teamId];
    const projectFactor = params ? params.projects / 100 : 1;

    return totalMD * projectFactor;
}

function countWorkDaysInWeek(weekStart) {
    let count = 0;
    for (let d = 0; d < 5; d++) { // Mon-Fri
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + d);
        const dayKey = formatDateKey(day);
        if (!isHoliday(dayKey) && !isCompanyOff(dayKey)) {
            if (isFriday(day)) {
                count += FRIDAY_FACTOR;
            } else {
                count += 1;
            }
        }
    }
    return count;
}

// Get capacity for a team at a given week index (replaces CAPACITY[teamId][weekIdx])
function getCapacity(teamId, weekIdx) {
    // Check for custom capacity override first
    const customCapacities = JSON.parse(localStorage.getItem('cp_custom_capacities') || '{}');
    if (customCapacities[teamId] && customCapacities[teamId].overrides && customCapacities[teamId].overrides[weekIdx] !== undefined) {
        return customCapacities[teamId].overrides[weekIdx];
    }
    
    // Fall back to dynamic calculation
    return calculateCapacity(teamId, weekIdx);
}

// --- COLUMN REORDER (temporary tool) ---

function enableColumnReorder() {
    const tables = document.querySelectorAll('#page-projects table');
    tables.forEach(table => {
        const headers = table.querySelectorAll('thead th');
        if (headers.length === 0) return;

        headers.forEach((th, idx) => {
            th.classList.add('draggable', 'resizable');
            th.setAttribute('draggable', 'true');
            th.dataset.colIdx = idx;

            // Drag to reorder
            th.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', idx);
                th.style.opacity = '0.5';
            });

            th.addEventListener('dragend', () => {
                th.style.opacity = '1';
                headers.forEach(h => h.classList.remove('drag-over'));
            });

            th.addEventListener('dragover', (e) => {
                e.preventDefault();
                th.classList.add('drag-over');
            });

            th.addEventListener('dragleave', () => {
                th.classList.remove('drag-over');
            });

            th.addEventListener('drop', (e) => {
                e.preventDefault();
                th.classList.remove('drag-over');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = idx;
                if (fromIdx === toIdx) return;
                reorderColumns(table, fromIdx, toIdx);
                logColumnOrder(table);
            });

            // Resize handle
            const handle = document.createElement('div');
            handle.className = 'col-resize-handle';
            th.appendChild(handle);

            let startX, startWidth;
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startX = e.pageX;
                startWidth = th.offsetWidth;
                handle.classList.add('dragging');

                const onMouseMove = (ev) => {
                    const diff = ev.pageX - startX;
                    th.style.width = Math.max(30, startWidth + diff) + 'px';
                };

                const onMouseUp = () => {
                    handle.classList.remove('dragging');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    logColumnOrder(table);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    });
}

function reorderColumns(table, fromIdx, toIdx) {
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = Array.from(row.children);
        if (cells.length <= Math.max(fromIdx, toIdx)) return;
        const cell = cells[fromIdx];
        const target = cells[toIdx];
        if (fromIdx < toIdx) {
            target.after(cell);
        } else {
            target.before(cell);
        }
    });
}

function logColumnOrder(table) {
    const headers = table.querySelectorAll('thead th');
    const order = Array.from(headers).map(th => th.textContent.trim() + ' (' + th.offsetWidth + 'px)');
    console.log('Column order:', order.join(' | '));
}

// --- PROJECT DETAIL PAGE ---

let currentDetailProjectId = null;

function openProjectDetail(projectId) {
    currentDetailProjectId = projectId;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-project-detail').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    renderProjectDetail(projectId);
}

function renderProjectDetail(projectId) {
    const container = document.getElementById('project-detail-content');
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) { container.innerHTML = '<p>Projekt nie znaleziony</p>'; return; }

    if (!project.shortName) project.shortName = '';
    if (!project.partner) project.partner = '';
    if (!project.jiraProject) project.jiraProject = '';
    if (!project.decisions) project.decisions = [];
    if (!project.estimation) project.estimation = {};

    const risksArr = Array.isArray(project.risks) ? project.risks : (project.risks ? [project.risks] : []);
    const notesArr = project.notes || [];
    const decisionsArr = project.decisions || [];

    const normPrio = normalizePriority(project.priority, project.category);
    const displayPrio = (normPrio === 'N/A') ? 'N/A' : normPrio;
    let prioClass = 'pna';
    if (normPrio !== 'N/A') {
        const prioNum = parseInt(normPrio);
        if (!isNaN(prioNum)) {
            if (prioNum <= 3) prioClass = 'p0';
            else if (prioNum <= 10) prioClass = 'p1';
            else if (prioNum <= 20) prioClass = 'p2';
            else if (prioNum <= 30) prioClass = 'p3';
            else prioClass = 'p4';
        }
    }

    let html = '';

    // Back button
    html += `<div style="margin-bottom:16px;">`;
    html += `<button class="edit-btn" id="back-to-projects" style="padding:5px 14px;">← Wróć do listy</button>`;
    html += `</div>`;

    // Header
    html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">`;
    html += `<span class="prio-dot ${prioClass}" style="width:28px;height:28px;font-size:13px;">${displayPrio}</span>`;
    html += `<h2 style="font-size:20px;font-weight:700;color:var(--bt-navy);margin:0;">${project.name}</h2>`;
    html += `<span class="status-chip ${normalizeStatus(project.status)}" style="font-size:12px;">${getStatusLabel(normalizeStatus(project.status), getLang())}</span>`;
    html += `</div>`;

    // Info grid - 2 columns
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">`;

    // Left: info fields
    html += `<div class="settings-section" style="margin-bottom:0;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">INFORMACJE</h4>`;
    html += `<div class="settings-items" style="gap:6px;">`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Nazwa pełna</span><input class="inline-edit detail-field" data-field="name" value="${project.name}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Nazwa skrócona</span><input class="inline-edit detail-field" data-field="shortName" value="${project.shortName}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Status</span><select class="inline-edit detail-field" data-field="status" style="flex:1;font-size:12px;">
        ${getStatusValues(false).map(s => `<option value="${s}" ${project.status === s ? 'selected' : ''}>${getStatusLabel(s, getLang())}</option>`).join('')}
    </select></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Zdrowie</span><select class="inline-edit detail-field" data-field="health" style="flex:1;font-size:12px;">
        ${getHealthValues().map(h => `<option value="${h}" ${project.health === h ? 'selected' : ''}>${getHealthLabel(h, getLang())}</option>`).join('')}
    </select></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Partner</span><input class="inline-edit detail-field" data-field="partner" value="${project.partner}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Jira Project</span><input class="inline-edit detail-field" data-field="jiraProject" value="${project.jiraProject}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Business Owner</span><input class="inline-edit detail-field" data-field="businessOwner" value="${project.businessOwner || ''}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">IT Lead</span><input class="inline-edit detail-field" data-field="lead" value="${project.lead || ''}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Termin</span><input class="inline-edit detail-field" type="date" data-field="delivery" value="${project.delivery || ''}" style="flex:1;font-size:12px;" /></div>`;
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Zespoły</span><span style="font-size:12px;">${(project.teams || []).join(', ') || '—'}</span></div>`;
    const currentCat = project.category || 'project';
    html += `<div class="settings-item"><span style="font-size:11px;color:var(--bt-grey-400);min-width:120px;">Kategoria</span><select class="inline-edit detail-field" data-field="category" style="flex:1;font-size:12px;">
        <option value="project" ${currentCat === 'project' ? 'selected' : ''}>Projekt</option>
        <option value="bau" ${currentCat === 'bau' ? 'selected' : ''}>BAU</option>
        <option value="overhead" ${currentCat === 'overhead' ? 'selected' : ''}>Overhead</option>
        <option value="scrum" ${currentCat === 'scrum' ? 'selected' : ''}>Scrum</option>
        <option value="maintenance" ${currentCat === 'maintenance' ? 'selected' : ''}>Maintenance</option>
    </select></div>`;
    html += `</div>`;
    html += `<button class="edit-btn" id="save-detail-info" style="margin-top:10px;padding:4px 12px;font-size:11px;">Zapisz</button>`;
    html += `</div>`;

    // Right: estimation per team
    html += `<div class="settings-section" style="margin-bottom:0;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">WYCENA (MD per zespół)</h4>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
    html += `<thead><tr style="border-bottom:1px solid var(--bt-grey-200);">`;
    html += `<th style="text-align:left;padding:4px 8px;font-size:10px;color:var(--bt-grey-400);">Zespół</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Szacunek</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Faktycznie</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Δ</th>`;
    html += `</tr></thead><tbody>`;

    (project.teams || []).forEach(teamName => {
        const team = TEAMS.find(t => t.name === teamName);
        const tid = team ? team.id : teamName.toLowerCase().replace(/\s+/g, '_');
        const est = project.estimation[tid] || 0;
        const actual = Object.values(project.allocations[tid] || {}).reduce((s, v) => s + (v || 0), 0);
        const delta = actual - est;
        const deltaColor = delta > 0 ? 'var(--accent-red)' : delta < 0 ? 'var(--accent-green)' : 'var(--bt-grey-400)';

        html += `<tr style="border-bottom:1px solid var(--bt-grey-100);">`;
        html += `<td style="padding:6px 8px;font-weight:600;color:${team ? team.color : 'var(--bt-navy)'};">${teamName}</td>`;
        html += `<td style="text-align:center;padding:4px;"><input type="number" class="wl-input estimation-input" data-team="${tid}" value="${est || ''}" min="0" step="0.5" style="width:60px;" /></td>`;
        html += `<td style="text-align:center;padding:4px;font-weight:600;">${actual.toFixed(1)}</td>`;
        html += `<td style="text-align:center;padding:4px;font-weight:700;color:${deltaColor};">${delta > 0 ? '+' : ''}${delta.toFixed(1)}</td>`;
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<button class="edit-btn" id="save-estimation" style="margin-top:10px;padding:4px 12px;font-size:11px;">Zapisz wycenę</button>`;
    html += `</div>`;

    html += `</div>`; // close 2-col grid

    // Deployment dates and status per team
    if (!project.teamDeployments) project.teamDeployments = {};
    html += `<div class="settings-section" style="margin-bottom:24px;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">WDROŻENIA PER ZESPÓŁ</h4>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
    html += `<thead><tr style="border-bottom:1px solid var(--bt-grey-200);">`;
    html += `<th style="text-align:left;padding:4px 8px;font-size:10px;color:var(--bt-grey-400);">Zespół</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Status</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Planowana data</th>`;
    html += `<th style="text-align:center;padding:4px;font-size:10px;color:var(--bt-grey-400);">Faktyczna data</th>`;
    html += `</tr></thead><tbody>`;

    const DEPLOY_STATUSES = ['—', 'Analiza', 'DEV', 'SIT', 'UAT', 'Go live', 'Done'];

    (project.teams || []).forEach(teamName => {
        const team = TEAMS.find(t => t.name === teamName);
        const tid = team ? team.id : teamName.toLowerCase().replace(/\s+/g, '_');
        const dep = project.teamDeployments[tid] || { status: '—', plannedDate: '', actualDate: '' };

        html += `<tr style="border-bottom:1px solid var(--bt-grey-100);">`;
        html += `<td style="padding:6px 8px;font-weight:600;color:${team ? team.color : 'var(--bt-navy)'};">${teamName}</td>`;
        html += `<td style="text-align:center;padding:4px;"><select class="inline-edit deploy-status-input" data-team="${tid}" style="font-size:11px;padding:2px 4px;">`;
        DEPLOY_STATUSES.forEach(s => {
            html += `<option value="${s}" ${dep.status === s ? 'selected' : ''}>${s}</option>`;
        });
        html += `</select></td>`;
        html += `<td style="text-align:center;padding:4px;"><input type="date" class="inline-edit deploy-planned-input" data-team="${tid}" value="${dep.plannedDate}" style="font-size:11px;padding:2px 4px;" /></td>`;
        html += `<td style="text-align:center;padding:4px;"><input type="date" class="inline-edit deploy-actual-input" data-team="${tid}" value="${dep.actualDate}" style="font-size:11px;padding:2px 4px;" /></td>`;
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    html += `<button class="edit-btn" id="save-deployments" style="margin-top:10px;padding:4px 12px;font-size:11px;">Zapisz wdrożenia</button>`;
    html += `</div>`;

    // Risks, Decisions, Notes in 3 columns
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">`;

    // Risks
    html += `<div class="settings-section" style="margin-bottom:0;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">RYZYKA</h4>`;
    html += `<div style="max-height:300px;overflow-y:auto;margin-bottom:8px;">`;
    risksArr.forEach(r => {
        const riskText = typeof r === 'object' 
            ? `${r.description} (${r.owner}, ${r.status})`
            : r;
        html += `<div class="note-entry" style="padding:6px;border:1px solid var(--bt-grey-200);border-radius:3px;margin-bottom:4px;font-size:11px;">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
                <div style="flex:1;">
                    <strong>${typeof r === 'object' ? r.description : r}</strong>
                    ${typeof r === 'object' ? `<div style="font-size:10px;color:var(--bt-grey-500);margin-top:2px;">Owner: ${r.owner} | Status: ${r.status} | Impact: ${r.impact}</div>` : ''}
                </div>
                <button class="delete-btn" data-risk-id="${typeof r === 'object' ? r.id : ''}" style="padding:2px 6px;font-size:9px;">×</button>
            </div>
        </div>`;
    });
    if (risksArr.length === 0) html += `<span style="font-size:11px;color:var(--bt-grey-400);">Brak</span>`;
    html += `</div>`;
    html += `<button class="edit-btn add-risk-detail-btn" data-id="${projectId}" style="padding:4px 8px;font-size:11px;width:100%;">+ Dodaj ryzyko</button>`;
    html += `</div>`;

    // Decisions
    html += `<div class="settings-section" style="margin-bottom:0;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">DECYZJE</h4>`;
    html += `<div style="max-height:200px;overflow-y:auto;margin-bottom:8px;">`;
    decisionsArr.forEach(d => { html += `<div class="note-entry" style="padding:4px 0;">${d}</div>`; });
    if (decisionsArr.length === 0) html += `<span style="font-size:11px;color:var(--bt-grey-400);">Brak</span>`;
    html += `</div>`;
    html += `<div class="settings-add-row"><input type="text" class="inline-edit" id="detail-new-decision" placeholder="Nowa decyzja..." style="flex:1;font-size:11px;" /><button class="edit-btn" id="add-detail-decision" style="padding:3px 8px;font-size:10px;">+</button></div>`;
    html += `</div>`;

    // Notes (including workload notes)
    html += `<div class="settings-section" style="margin-bottom:0;">`;
    html += `<h4 style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--bt-grey-400);">NOTATKI</h4>`;
    html += `<div style="max-height:300px;overflow-y:auto;margin-bottom:8px;">`;

    // Regular notes
    notesArr.forEach(n => {
        const noteText = typeof n === 'object'
            ? `${n.content} (${n.author}, ${n.type})`
            : n;
        const noteIcon = typeof n === 'object' ? NOTE_TYPES[n.type]?.icon || '📝' : '📝';
        html += `<div class="note-entry" style="padding:6px;border:1px solid var(--bt-grey-200);border-radius:3px;margin-bottom:4px;font-size:11px;">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
                <div style="flex:1;">
                    <div>${noteIcon} ${typeof n === 'object' ? n.content : n}</div>
                    ${typeof n === 'object' ? `<div style="font-size:10px;color:var(--bt-grey-500);margin-top:2px;">Autor: ${n.author} | Typ: ${n.type}</div>` : ''}
                </div>
                <button class="delete-btn" data-note-id="${typeof n === 'object' ? n.id : ''}" style="padding:2px 6px;font-size:9px;">×</button>
            </div>
        </div>`;
    });

    // Workload notes
    if (project.workloadNotes && Object.keys(project.workloadNotes).length > 0) {
        html += `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--bt-grey-200);">`;
        html += `<span style="font-size:9px;font-weight:700;color:var(--bt-grey-400);text-transform:uppercase;">Z obciążenia:</span>`;
        Object.entries(project.workloadNotes).forEach(([key, note]) => {
            const [tid, weekIdx] = key.split('_');
            const team = TEAMS.find(t => t.id === tid);
            const teamName = team ? team.name : tid;
            const weekLabel = ALL_WEEKS[parseInt(weekIdx)] ? ALL_WEEKS[parseInt(weekIdx)].label : `tydz. ${weekIdx}`;
            html += `<div class="note-entry" style="padding:3px 0;font-size:10px;"><span style="color:${team ? team.color : 'var(--bt-grey-400)'};font-weight:600;">${teamName}</span> <span style="color:var(--bt-grey-400);">(${weekLabel})</span>: ${note}</div>`;
        });
        html += `</div>`;
    }

    if (notesArr.length === 0 && (!project.workloadNotes || Object.keys(project.workloadNotes).length === 0)) {
        html += `<span style="font-size:11px;color:var(--bt-grey-400);">Brak</span>`;
    }
    html += `</div>`;
    html += `<button class="edit-btn add-note-detail-btn" data-id="${projectId}" style="padding:4px 8px;font-size:11px;width:100%;">+ Dodaj notatkę</button>`;
    html += `</div>`;

    html += `</div>`; // close 3-col grid

    container.innerHTML = html;

    // --- Bindings ---
    const backBtn = container.querySelector('#back-to-projects');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('page-project-detail').classList.remove('active');
            document.getElementById('page-projects').classList.add('active');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelector('.nav-item[data-page="projects"]').classList.add('active');
            renderProjectsTable();
        });
    }

    const saveInfoBtn = container.querySelector('#save-detail-info');
    if (saveInfoBtn) {
        saveInfoBtn.addEventListener('click', () => {
            container.querySelectorAll('.detail-field').forEach(input => {
                const field = input.dataset.field;
                const val = input.value;
                if (field === 'category') {
                    if (val === 'project') {
                        delete project.category;
                    } else {
                        project.category = val;
                    }
                } else {
                    project[field] = val;
                }
            });
            saveProjects();
            renderProjectDetail(projectId);
        });
    }

    const saveEstBtn = container.querySelector('#save-estimation');
    if (saveEstBtn) {
        saveEstBtn.addEventListener('click', () => {
            container.querySelectorAll('.estimation-input').forEach(input => {
                const tid = input.dataset.team;
                const val = parseFloat(input.value) || 0;
                if (!project.estimation) project.estimation = {};
                project.estimation[tid] = val;
            });
            saveProjects();
            renderProjectDetail(projectId);
        });
    }

    const saveDepBtn = container.querySelector('#save-deployments');
    if (saveDepBtn) {
        saveDepBtn.addEventListener('click', () => {
            if (!project.teamDeployments) project.teamDeployments = {};
            container.querySelectorAll('.deploy-status-input').forEach(input => {
                const tid = input.dataset.team;
                if (!project.teamDeployments[tid]) project.teamDeployments[tid] = {};
                project.teamDeployments[tid].status = input.value;
            });
            container.querySelectorAll('.deploy-planned-input').forEach(input => {
                const tid = input.dataset.team;
                if (!project.teamDeployments[tid]) project.teamDeployments[tid] = {};
                project.teamDeployments[tid].plannedDate = input.value;
            });
            container.querySelectorAll('.deploy-actual-input').forEach(input => {
                const tid = input.dataset.team;
                if (!project.teamDeployments[tid]) project.teamDeployments[tid] = {};
                project.teamDeployments[tid].actualDate = input.value;
            });
            saveProjects();
            renderProjectDetail(projectId);
        });
    }

    const addRiskBtn = container.querySelector('#add-detail-risk');
    if (addRiskBtn) {
        addRiskBtn.addEventListener('click', () => {
            const btn = container.querySelector('.add-risk-detail-btn');
            openAddRisk(projectId, btn);
        });
    }

    const addDecisionBtn = container.querySelector('#add-detail-decision');
    if (addDecisionBtn) {
        addDecisionBtn.addEventListener('click', () => {
            const text = document.getElementById('detail-new-decision').value.trim();
            if (!text) return;
            if (!project.decisions) project.decisions = [];
            const now = new Date();
            const user = getCurrentUser();
            const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
            project.decisions.push(`${dateStr} [${user}]: ${text}`);
            saveProjects();
            renderProjectDetail(projectId);
        });
    }

    const addNoteBtn = container.querySelector('#add-detail-note');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const btn = container.querySelector('.add-note-detail-btn');
            openAddNote(projectId, btn);
        });
    }

    // Bind new popup buttons
    if (container.querySelector('.add-risk-detail-btn')) {
        container.querySelector('.add-risk-detail-btn').addEventListener('click', () => {
            openAddRisk(projectId, event.target);
        });
    }

    if (container.querySelector('.add-note-detail-btn')) {
        container.querySelector('.add-note-detail-btn').addEventListener('click', () => {
            openAddNote(projectId, event.target);
        });
    }

    // Bind delete buttons for risks
    container.querySelectorAll('.settings-section').forEach(section => {
        const riskDeleteBtns = section.querySelectorAll('button.delete-btn[data-risk-id]');
        riskDeleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const riskId = e.target.dataset.riskId;
                if (riskId && Array.isArray(project.risks)) {
                    project.risks = project.risks.filter(r => typeof r === 'object' ? r.id !== riskId : true);
                    saveProjects();
                    renderProjectDetail(projectId);
                }
            });
        });

        // Bind delete buttons for notes
        const noteDeleteBtns = section.querySelectorAll('button.delete-btn[data-note-id]');
        noteDeleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.target.dataset.noteId;
                if (noteId && Array.isArray(project.notes)) {
                    project.notes = project.notes.filter(n => typeof n === 'object' ? n.id !== noteId : true);
                    saveProjects();
                    renderProjectDetail(projectId);
                }
            });
        });
    });
}

// ============================================================
// RENDERING FUNCTIONS (Placeholders for missing renders)
// ============================================================

// --- ACTION CENTER (for leaders) ---

function renderActionCenter() {
    const container = document.getElementById('action-center-content');
    if (!container) return;

    const actions = [];
    const today = new Date();

    // 1. Red or Amber projects
    PROJECTS.filter(p => p.status === 'in-progress' && (p.health === 'red' || p.health === 'amber')).forEach(p => {
        actions.push({
            priority: p.health === 'red' ? 1 : 2,
            icon: p.health === 'red' ? '🔴' : '🟠',
            title: p.name,
            type: 'Projekt zagrożony',
            detail: `Zdrowie: ${p.health === 'red' ? 'Krytyczne' : 'Ostrzeżenie'} | Lead: ${p.lead || 'brak'}`,
            action: `Przejdź`,
            onclick: `openProjectDetail(${p.id})`
        });
    });

    // 2. Blocked projects
    PROJECTS.filter(p => p.status === 'blocked').forEach(p => {
        actions.push({
            priority: 1,
            icon: '🚫',
            title: p.name,
            type: 'Projekt zablokowany',
            detail: `Status: Zablokowany | Lead: ${p.lead || 'brak'}`,
            action: `Przejdź`,
            onclick: `openProjectDetail(${p.id})`
        });
    });

    // 3. Overloaded teams (next 2 weeks)
    const next2Weeks = [];
    for (let i = 0; i < TOTAL_WEEKS && next2Weeks.length < 2; i++) {
        const ws = new Date(BASE_DATE);
        ws.setDate(BASE_DATE.getDate() + i * 7);
        if (ws >= today) next2Weeks.push(i);
    }

    TEAMS.forEach(team => {
        let totalCap = 0, totalAlloc = 0;
        next2Weeks.forEach(wi => {
            totalCap += getCapacity(team.id, wi);
            totalAlloc += PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[wi] || 0), 0);
        });
        const pct = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
        if (pct > 100) {
            actions.push({
                priority: 1,
                icon: '⚡',
                title: team.name,
                type: 'Przeciążony zespół',
                detail: `Obciążenie: ${pct}% w następne 2 tygodnie (limit: 100%)`,
                action: `Obciążenie`,
                onclick: `showPage('workload')`
            });
        }
    });


    // 5. High-risk items due in 7 days
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    PROJECTS.forEach(p => {
        const risks = Array.isArray(p.risks) ? p.risks : (p.risks ? [p.risks] : []);
        risks.forEach(r => {
            if (r && typeof r === 'object' && r.status !== 'closed' && r.dueDate) {
                const dueDate = new Date(r.dueDate);
                if (dueDate >= today && dueDate <= sevenDaysFromNow && r.impact === 'high') {
                    actions.push({
                        priority: 1,
                        icon: '⚠️',
                        title: `${p.name}: ${r.description}`,
                        type: 'Wysokie ryzyko (7 dni)',
                        detail: `Owner: ${r.owner || 'brak'} | Impact: ${r.impact} | Termin: ${r.dueDate}`,
                        action: `Przejdź`,
                        onclick: `openProjectDetail(${p.id})`
                    });
                }
            }
        });
    });

    // 6. Decisions without owner
    PROJECTS.forEach(p => {
        const notes = Array.isArray(p.notes) ? p.notes : [];
        notes.filter(n => typeof n === 'object' && n.type === 'decision' && !n.author).forEach(n => {
            actions.push({
                priority: 2,
                icon: '📋',
                title: `${p.name}: ${n.content}`,
                type: 'Decyzja bez właściciela',
                detail: `Data: ${n.createdAt} | Status: Niejasny`,
                action: `Projekt`,
                onclick: `openProjectDetail(${p.id})`
            });
        });
    });

    // 7. Projects without delivery date
    PROJECTS.filter(p => p.status === 'in-progress' && (!p.delivery || p.delivery.trim() === '') && (!p.category || p.category === 'project')).forEach(p => {
        actions.push({
            priority: 3,
            icon: '📅',
            title: p.name,
            type: 'Brak terminu realizacji',
            detail: `Lead: ${p.lead || 'brak'} | Status: ${p.status}`,
            action: `Edytuj`,
            onclick: `openProjectDetail(${p.id})`
        });
    });

    // 8. Projects with capacity but no lead
    PROJECTS.filter(p => p.status === 'in-progress' && (!p.lead || p.lead.trim() === '') && (p.teams || []).length > 0 && (!p.category || p.category === 'project')).forEach(p => {
        actions.push({
            priority: 2,
            icon: '👥',
            title: p.name,
            type: 'Brak lidera projektu',
            detail: `Zespoły: ${(p.teams || []).join(', ')} | Status: ${p.status}`,
            action: `Projekt`,
            onclick: `openProjectDetail(${p.id})`
        });
    });

    // Sort by priority (1 highest)
    actions.sort((a, b) => a.priority - b.priority);

    if (actions.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--bt-grey-400);">
            <div style="font-size:48px; margin-bottom:12px;">✅</div>
            <div style="font-size:14px; font-weight:600;">Brak pilnych spraw</div>
            <div style="font-size:12px; margin-top:6px;">Wszystko jest pod kontrolą</div>
        </div>`;
        return;
    }

    let html = `<div style="display:flex; flex-direction:column; gap:12px;">`;
    
    actions.forEach((action, idx) => {
        const priorityColor = action.priority === 1 ? '#ef4444' : action.priority === 2 ? '#f59e0b' : '#3b82f6';
        html += `<div style="display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:12px; background:var(--bt-white); border-left:4px solid ${priorityColor}; border-radius:4px; border:1px solid var(--bt-grey-200);">
            <div style="font-size:24px;">${action.icon}</div>
            <div style="min-width:0;">
                <div style="font-size:12px; font-weight:600; color:var(--bt-navy);">${action.title}</div>
                <div style="font-size:11px; color:var(--bt-grey-600); margin-top:2px;">${action.type}</div>
                <div style="font-size:11px; color:var(--bt-grey-500); margin-top:4px; line-height:1.4;">${action.detail}</div>
            </div>
            <button onclick="${action.onclick}" style="padding:6px 12px; background:var(--bt-cyan); color:white; border:none; border-radius:3px; cursor:pointer; font-size:11px; font-weight:600; white-space:nowrap;">▶ ${action.action}</button>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// --- WORKLOAD HEATMAP ---

function renderWorkloadHeatmap() {
    const container = document.getElementById('heatmap-content');
    if (!container) return;

    const weeks = [];
    
    // Generate next 12 weeks
    for (let i = 0; i < 12; i++) {
        const weekStart = new Date(BASE_DATE);
        weekStart.setDate(BASE_DATE.getDate() + i * 7);
        weeks.push({
            index: i,
            start: weekStart,
            label: `W${i + 1} (${(weekStart.getDate() + '').padStart(2, '0')}.${(weekStart.getMonth() + 1 + '').padStart(2, '0')})`
        });
    }

    // Color mapping
    const getHeatmapColor = (percentage) => {
        if (percentage > 100) return '#ef4444';  // red
        if (percentage >= 80) return '#f59e0b';  // yellow
        if (percentage > 0) return '#10b981';    // green
        return '#e5e7eb';                        // gray (no data)
    };

    const getHeatmapLabel = (percentage) => {
        if (percentage > 100) return '🔴 Przeciążony';
        if (percentage >= 80) return '🟠 Wysoki';
        if (percentage > 0) return '🟢 Ok';
        return '⚪ Brak';
    };

    // Build heatmap table
    let html = `<table style="border-collapse:collapse; width:100%; font-size:11px;">
        <thead style="position:sticky; top:0; background:var(--bt-white); z-index:10;">
            <tr style="border-bottom:2px solid var(--bt-grey-200);">
                <th style="text-align:left; padding:8px; font-weight:600; background:var(--bt-grey-50); width:120px;">Zespół</th>
                ${weeks.map(w => `<th style="text-align:center; padding:6px 4px; font-weight:600; background:var(--bt-grey-50); min-width:50px;">${w.label}</th>`).join('')}
            </tr>
        </thead>
        <tbody>`;

    TEAMS.forEach(team => {
        html += `<tr style="border-bottom:1px solid var(--bt-grey-200);">
            <td style="padding:8px; font-weight:600; color:var(--bt-navy); background:var(--bt-grey-50);">${team.name}</td>`;

        weeks.forEach(week => {
            const capacity = getCapacity(team.id, week.index);
            const allocation = PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[week.index] || 0), 0);
            const percentage = capacity > 0 ? Math.round((allocation / capacity) * 100) : 0;
            const color = getHeatmapColor(percentage);

            html += `<td style="text-align:center; padding:4px; background:${color}15; border:1px solid ${color}30; cursor:pointer;" title="${getHeatmapLabel(percentage)} - ${percentage}%">
                <div style="background:${color}; color:white; padding:2px 4px; border-radius:3px; font-weight:600; font-size:10px;">${percentage}%</div>
            </td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table>`;

    // Add legend
    html += `<div style="display:flex; gap:20px; margin-top:20px; padding:12px; background:var(--bt-grey-50); border-radius:4px; border:1px solid var(--bt-grey-200); flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
            <div style="width:20px; height:20px; background:#10b981; border-radius:3px;"></div>
            <span><strong>Zielony</strong> - poniżej 80%</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
            <div style="width:20px; height:20px; background:#f59e0b; border-radius:3px;"></div>
            <span><strong>Żółty</strong> - 80-100%</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
            <div style="width:20px; height:20px; background:#ef4444; border-radius:3px;"></div>
            <span><strong>Czerwony</strong> - powyżej 100%</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
            <div style="width:20px; height:20px; background:#e5e7eb; border-radius:3px;"></div>
            <span><strong>Szary</strong> - brak danych</span>
        </div>
    </div>`;

    container.innerHTML = html;
}


// ============================================================
// NAVIGATION & PAGE MANAGEMENT
// ============================================================
// PLACEHOLDER RENDER FUNCTIONS (to be implemented)

function renderSquadLead() {
    const container = document.getElementById('squadlead-content');
    if (!container) {
        console.error('squadlead-content container not found');
        return;
    }

    console.log('renderSquadLead: starting render');
    
    let html = `<div style="padding:20px;">`;
    
    // Title
    html += `<h1 style="font-size:24px; font-weight:700; color:var(--bt-navy); margin-bottom:24px;">${t('squadlead.title')}</h1>`;

    // Get current sprint info with dates
    const currentSprintWeekIndices = getSprintWeekIndices();
    let currentSprintLabel = 'Bieżący sprint';
    
    if (SPRINTS && SPRINTS.length > 0) {
        const today = new Date();
        const currentSprint = SPRINTS.find(s => {
            const d = parseSprintDates(s.dates);
            return d && today >= d.start && today <= d.end;
        });
        if (currentSprint) {
            const d = parseSprintDates(currentSprint.dates);
            const startStr = d.start.toLocaleDateString('pl-PL');
            const endStr = d.end.toLocaleDateString('pl-PL');
            currentSprintLabel = `${currentSprint.name} (${startStr} - ${endStr})`;
        }
    }

    // ============ CAPACITY OVERVIEW ============
    html += `<div style="background:var(--bt-white); border-radius:8px; padding:20px; margin-bottom:24px; border:1px solid var(--bt-grey-200);">`;
    html += `<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:16px;">`;
    html += `<h2 style="font-size:16px; font-weight:600; color:var(--bt-navy); margin:0;">${t('squadlead.capacityOverview')}</h2>`;
    html += `<span style="font-size:11px; color:var(--bt-grey-600); background:var(--bt-grey-100); padding:4px 10px; border-radius:4px;">${currentSprintLabel}</span>`;
    html += `</div>`;
    
    // Capacity table
    html += `<table style="width:100%; border-collapse:collapse; font-size:12px;">`;
    html += `<thead style="background:var(--bt-grey-50); border-bottom:2px solid var(--bt-grey-200);">`;
    html += `<tr>`;
    html += `<th style="text-align:left; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.team')}</th>`;
    html += `<th style="text-align:center; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.capacity')} %</th>`;
    html += `<th style="text-align:center; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.utilization')} %</th>`;
    html += `<th style="text-align:center; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.status')}</th>`;
    html += `<th style="text-align:center; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.fte')}</th>`;
    html += `<th style="text-align:center; padding:10px; font-weight:600; color:var(--bt-navy);">${t('squadlead.edit')}</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;

    // Get current sprint week indices for capacity table
    const capacityOverviewIndices = getSprintWeekIndices();
    
    TEAMS.forEach(team => {
        let totalCap = 0, totalAlloc = 0;
        
        capacityOverviewIndices.forEach(wi => {
            totalCap += getCapacity(team.id, wi);
            totalAlloc += PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[wi] || 0), 0);
        });

        const capacityPct = totalCap > 0 ? Math.round((totalCap / (totalCap + 5)) * 100) : 50; // Planned capacity (example)
        const utilizationPct = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
        
        let statusIcon, statusColor;
        if (utilizationPct > 100) {
            statusIcon = '🔴';
            statusColor = '#ef4444';
        } else if (utilizationPct >= 85) {
            statusIcon = '🟠';
            statusColor = '#f59e0b';
        } else {
            statusIcon = '🟢';
            statusColor = '#10b981';
        }

        // Calculate FTE (simplified: capacity / 40 MD per week)
        const fte = (totalCap / 40).toFixed(1);

        html += `<tr style="border-bottom:1px solid var(--bt-grey-100); hover:background var(--bt-grey-50);">`;
        html += `<td style="padding:10px; font-weight:600; color:${team.color};">${team.name}</td>`;
        html += `<td style="text-align:center; padding:10px;">
            <div style="background:#e0f2fe; border-radius:4px; padding:4px; font-weight:600; color:#0369a1;">80%</div>
        </td>`;
        html += `<td style="text-align:center; padding:10px;">
            <div style="background:${statusColor}15; border-radius:4px; padding:4px; font-weight:600; color:${statusColor}; border:1px solid ${statusColor}30;">${utilizationPct}%</div>
        </td>`;
        html += `<td style="text-align:center; padding:10px; font-size:16px;">${statusIcon}</td>`;
        html += `<td style="text-align:center; padding:10px; font-weight:600;">${fte}</td>`;
        html += `<td style="text-align:center; padding:10px;">
            <button class="edit-btn" data-team-id="${team.id}" style="padding:4px 8px; font-size:10px;">✎</button>
        </td>`;
        html += `</tr>`;
    });

    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;

    // ============ SPRINT CAPACITY ============
    html += `<div style="background:var(--bt-white); border-radius:8px; padding:20px; border:1px solid var(--bt-grey-200);">`;
    html += `<h2 style="font-size:16px; font-weight:600; color:var(--bt-navy); margin-bottom:16px;">${t('squadlead.sprintCapacity')}</h2>`;
    
    // Render sprint tabs - show current sprint and next 2 sprints
    let sprintTabs = [];
    if (SPRINTS && SPRINTS.length > 0) {
        const today = new Date();
        
        // Find current sprint index
        let currentSprintIdx = 0;
        SPRINTS.forEach((s, idx) => {
            const d = parseSprintDates(s.dates);
            if (d && today >= d.start && today <= d.end) {
                currentSprintIdx = idx;
            }
        });
        
        // Get current + next 2 sprints
        for (let i = 0; i < 3 && currentSprintIdx + i < SPRINTS.length; i++) {
            const s = SPRINTS[currentSprintIdx + i];
            const d = parseSprintDates(s.dates);
            if (d) {
                const startStr = d.start.toLocaleDateString('pl-PL');
                const endStr = d.end.toLocaleDateString('pl-PL');
                const label = i === 0 ? `${s.name} (bieżący)` : s.name;
                sprintTabs.push({
                    name: label,
                    dates: `${startStr} - ${endStr}`,
                    sprintId: s.id
                });
            }
        }
    }
    
    // Sprint tabs
    html += `<div style="display:flex; gap:8px; margin-bottom:16px; border-bottom:2px solid var(--bt-grey-200); overflow-x:auto;">`;
    sprintTabs.forEach((sprint, idx) => {
        const isActive = idx === 0 ? 'background:var(--bt-cyan); color:var(--bt-navy);' : 'background:var(--bt-grey-50); color:var(--bt-grey-600);';
        html += `<div class="sprint-tab" data-sprint-idx="${idx}" style="padding:8px 14px; border-radius:4px 4px 0 0; cursor:pointer; font-size:11px; font-weight:600; white-space:nowrap; border-bottom:3px solid transparent; ${isActive}">`;
        html += `<div>${sprint.name}</div>`;
        html += `<div style="font-size:9px; opacity:0.7; margin-top:2px;">${sprint.dates}</div>`;
        html += `</div>`;
    });
    html += `</div>`;
    
    // Sprint Summary Cards
    html += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">`;
    
    // Example sprint data (can be replaced with actual data)
    const sprintData = [
        { label: t('squadlead.spAvailable'), value: 120, color: '#3b82f6' },
        { label: t('squadlead.spCommitted'), value: 100, color: '#8b5cf6' },
        { label: t('squadlead.spDelivered'), value: 85, color: '#10b981' }
    ];

    sprintData.forEach(data => {
        html += `<div style="background:var(--bt-grey-50); border-radius:6px; padding:16px; border:1px solid var(--bt-grey-200);">`;
        html += `<div style="font-size:11px; color:var(--bt-grey-600); margin-bottom:8px;">${data.label}</div>`;
        html += `<div style="font-size:24px; font-weight:700; color:${data.color};">${data.value}</div>`;
        html += `<div style="margin-top:8px; height:6px; background:var(--bt-grey-200); border-radius:3px; overflow:hidden;">`;
        html += `<div style="height:100%; width:${Math.min(data.value, 120) / 120 * 100}%; background:${data.color};"></div>`;
        html += `</div>`;
        html += `</div>`;
    });

    html += `</div>`;

    // Velocity trend
    html += `<div style="background:var(--bt-grey-50); border-radius:6px; padding:16px; border:1px solid var(--bt-grey-200);">`;
    html += `<h3 style="font-size:13px; font-weight:600; color:var(--bt-navy); margin-bottom:12px;">${t('squadlead.velocityTrend')}</h3>`;
    html += `<div style="font-size:11px; color:var(--bt-grey-500); text-align:center; padding:40px;">📊 Trend velocity - średnia z ostatnich 6 sprintów</div>`;
    html += `</div>`;

    html += `</div>`; // close sprint capacity
    html += `</div>`; // close main container

    try {
        container.innerHTML = html;
        console.log('renderSquadLead: HTML rendered successfully');
    } catch (e) {
        console.error('renderSquadLead: Error rendering HTML', e);
        container.innerHTML = `<div style="padding:20px; color:red;">Error: ${e.message}</div>`;
        return;
    }

    // Bind edit buttons
    const editBtns = container.querySelectorAll('.edit-btn[data-team-id]');
    console.log('renderSquadLead: found', editBtns.length, 'edit buttons');
    editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const teamId = e.target.dataset.teamId;
            const team = TEAMS.find(t => t.id === teamId);
            if (team) {
                openTeamCapacityEditor(teamId, team);
            }
        });
    });

    // Bind sprint tabs
    const sprintTabElements = container.querySelectorAll('.sprint-tab');
    console.log('renderSquadLead: found', sprintTabElements.length, 'sprint tabs');
    sprintTabElements.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const sprintIdx = parseInt(e.currentTarget.dataset.sprintIdx);
            console.log('Sprint tab clicked:', sprintIdx);
            
            // Update active tab styling - remove active state from all
            sprintTabElements.forEach(t => {
                t.style.background = '#f3f4f6'; // var(--bt-grey-50)
                t.style.color = '#4b5563'; // var(--bt-grey-600)
                t.style.borderBottom = '3px solid transparent';
            });
            
            // Add active state to clicked tab
            e.currentTarget.style.background = '#00bac7'; // var(--bt-cyan)
            e.currentTarget.style.color = '#170f4f'; // var(--bt-navy)
            e.currentTarget.style.borderBottom = '3px solid #00bac7';
            
            // TODO: Update sprint capacity cards to show data for selected sprint
            console.log('TODO: Load sprint data for sprint index', sprintIdx);
        });
    });
}

// Modal for editing team capacity
function openTeamCapacityEditor(teamId, team) {
    const existing = document.getElementById('team-capacity-modal');
    if (existing) existing.remove();

    // Get current sprint week indices
    const sprintIndices = getSprintWeekIndices();
    
    // Calculate current allocations
    let totalCap = 0, totalAlloc = 0;
    sprintIndices.forEach(wi => {
        totalCap += getCapacity(team.id, wi);
        totalAlloc += PROJECTS.reduce((sum, p) => sum + (p.allocations[team.id]?.[wi] || 0), 0);
    });

    const utilizationPct = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;

    const modal = document.createElement('div');
    modal.id = 'team-capacity-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.2);">
            <h2 style="font-size: 18px; font-weight: 700; color: var(--bt-navy); margin-bottom: 20px;">
                ${t('squadlead.edit')} - ${team.name}
            </h2>

            <div style="display: grid; gap: 16px; margin-bottom: 24px;">
                <!-- Team Info -->
                <div style="background: var(--bt-grey-50); border-radius: 6px; padding: 12px; border: 1px solid var(--bt-grey-200);">
                    <div style="font-size: 11px; color: var(--bt-grey-600); font-weight: 600; margin-bottom: 8px;">INFORMACJE O ZESPOLE</div>
                    <div style="display: grid; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span style="color: var(--bt-grey-600);">Członkowie:</span>
                            <span style="font-weight: 600; color: var(--bt-navy);">${PEOPLE.filter(p => p.team === team.name).length} osób</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span style="color: var(--bt-grey-600);">Łącznie MD:</span>
                            <span style="font-weight: 600; color: var(--bt-navy);">${totalCap.toFixed(1)} MD</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span style="color: var(--bt-grey-600);">Wykorzystanie:</span>
                            <span style="font-weight: 600; color: var(--bt-navy);">${utilizationPct}%</span>
                        </div>
                    </div>
                </div>

                <!-- Capacity Adjustment per Sprint -->
                <div style="background: var(--bt-grey-50); border-radius: 6px; padding: 12px; border: 1px solid var(--bt-grey-200);">
                    <div style="font-size: 11px; color: var(--bt-grey-600); font-weight: 600; margin-bottom: 12px;">DOSTĘPNOŚĆ NA SPRINT</div>
                    <div style="display: grid; gap: 10px;">
                        ${sprintIndices.slice(0, 3).map((wi, idx) => {
                            const sprint = idx === 0 ? 'Bieżący' : idx === 1 ? 'Następny' : 'Za 2 tygodnie';
                            const cap = getCapacity(team.id, wi);
                            return `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <label style="font-size: 11px; color: var(--bt-grey-600); width: 100px; font-weight: 600;">${sprint} Sprint:</label>
                                    <input type="number" class="team-cap-input" data-week="${wi}" value="${cap}" min="0" step="0.5" 
                                        style="width: 80px; padding: 6px; border: 1px solid var(--bt-grey-300); border-radius: 4px; font-size: 12px;" />
                                    <span style="font-size: 11px; color: var(--bt-grey-500); width: 50px;">MD</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Notes -->
                <div style="background: var(--bt-grey-50); border-radius: 6px; padding: 12px; border: 1px solid var(--bt-grey-200);">
                    <label style="font-size: 11px; color: var(--bt-grey-600); font-weight: 600; display: block; margin-bottom: 8px;">NOTATKI</label>
                    <textarea id="team-capacity-notes" placeholder="Np. Urlop, szkolenie, zmiana dostępności..." 
                        style="width: 100%; min-height: 70px; padding: 8px; border: 1px solid var(--bt-grey-300); border-radius: 4px; font-size: 11px; font-family: inherit; resize: vertical;"></textarea>
                </div>
            </div>

            <!-- Buttons -->
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-capacity-edit" style="padding: 8px 16px; background: var(--bt-grey-200); color: var(--bt-navy); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                    ${t('generic.cancel')}
                </button>
                <button id="save-capacity-edit" style="padding: 8px 16px; background: var(--bt-cyan); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                    ${t('generic.save')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Bindings
    document.getElementById('cancel-capacity-edit').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('save-capacity-edit').addEventListener('click', () => {
        // Save capacity updates
        const updates = {};
        const inputs = modal.querySelectorAll('.team-cap-input');
        inputs.forEach(input => {
            const week = parseInt(input.dataset.week);
            const val = parseFloat(input.value) || 0;
            updates[week] = val;
        });
        
        // Save custom capacity overrides to localStorage
        const customCapacities = JSON.parse(localStorage.getItem('cp_custom_capacities') || '{}');
        customCapacities[teamId] = {
            overrides: updates,
            notes: document.getElementById('team-capacity-notes').value,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('cp_custom_capacities', JSON.stringify(customCapacities));
        
        modal.remove();
        renderSquadLead(); // Re-render to show updates
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// PLACEHOLDER RENDER FUNCTIONS (to be implemented)

function renderProjects() {
    // Render projects table - the container is page-projects
    renderProjectsTable();
}

function renderWorkload() {
    // Render workload grid
    renderWorkloadGrid();
}

function renderSprintsList() {
    const container = document.getElementById('sprints-list');
    if (!container) return;
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--bt-grey-500);">Sprinty — sekcja przygotowywana</div>';
}




// ============================================================
// INITIALIZATION & NAVIGATION
// ============================================================

// Current active page
let currentPage = 'template';

// Initialize app on page load
function initializeApp() {
    console.log('🚀 initializeApp: START');
    
    // Load persisted data
    console.log('🚀 initializeApp: Ładuję projekty...');
    loadProjects();
    
    console.log('🚀 initializeApp: Ładuję osoby...');
    loadPeople();
    
    console.log('🚀 initializeApp: Ładuję przypisania osób...');
    loadPersonAssignments();
    
    // Clean old assignments for sprint 271 to avoid old project names interfering
    console.log('🚀 initializeApp: Czyszczę stare przypisania sprintu 271...');
    clearSprintAssignments(271);
    
    console.log('🚀 initializeApp: Ładuję sprinty...');
    loadCustomSprints();
    
    console.log('🚀 initializeApp: Bindję nawigację...');
    bindNavigation();
    
    console.log('🚀 initializeApp: Bindję sidebar toggle...');
    bindSidebarToggle();
    
    console.log('🚀 initializeApp: Pokazuję stronę template...');
    showPage('template');
    
    console.log('🚀 initializeApp: KONIEC');
}

function bindNavigation() {
    console.log('📍 bindNavigation: Szukam [data-page] itemów...');
    const navItems = document.querySelectorAll('[data-page]');
    console.log(`📍 bindNavigation: Znaleziono ${navItems.length} nav itemów`);
    
    navItems.forEach(navItem => {
        const page = navItem.dataset.page;
        console.log(`📍 bindNavigation: Bindowanie click na data-page="${page}"`);
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = navItem.dataset.page;
            console.log(`🔵 NAV CLICK: ${pageName}`);
            showPage(pageName);
        });
    });
}

function bindSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.app').classList.toggle('sidebar-collapsed');
        });
    }
}

function showPage(pageName) {
    console.log(`🟡 showPage("${pageName}"): Rozpoczęcie...`);
    
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    console.log(`🟡 showPage: Znaleziono ${allPages.length} page elementów`);
    allPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Map page names to IDs (handle calendar->teams mapping)
    const pageIdMap = {
        'template': 'page-template',
        'actioncenter': 'page-actioncenter',
        'heatmap': 'page-heatmap',
        'projects': 'page-projects',
        'workload': 'page-workload',
        'people': 'page-people',
        'sprints': 'page-sprints',
        'calendar': 'page-teams',  // Calendar tab uses teams page ID
        'teams': 'page-teams',
        'squadlead': 'page-squadlead',
        'settings': 'page-settings'
    };
    
    // Show selected page
    const pageId = pageIdMap[pageName] || `page-${pageName}`;
    console.log(`🟡 showPage: Szukam elementu id="${pageId}"`);
    
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        console.log(`✅ showPage: ZNALEZIONO! Dodaję klasę 'active'`);
        pageElement.classList.add('active');
        currentPage = pageName;
        
        // Update nav active state
        document.querySelectorAll('[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Render page content based on page name
        console.log(`🟡 showPage: Renderuję stronę...`);
        switch(pageName) {
            case 'template':
                console.log(`🟡 showPage: Renderuję TEMPLATE`);
                renderCapacityBars();
                break;
            case 'actioncenter':
                console.log(`🟡 showPage: Renderuję ACTION CENTER`);
                renderActionNeeded();
                break;
            case 'heatmap':
                console.log(`🟡 showPage: Renderuję HEATMAP`);
                renderWorkloadGrid();
                break;
            case 'projects':
                console.log(`🟡 showPage: Renderuję PROJECTS`);
                renderProjectsTable();
                break;
            case 'workload':
                console.log(`🟡 showPage: Renderuję WORKLOAD`);
                renderWorkloadGrid();
                break;
            case 'people':
                console.log(`🟡 showPage: Renderuję PEOPLE`);
                renderPeople();
                break;
            case 'sprints':
                console.log(`🟡 showPage: Renderuję SPRINTS`);
                renderSprints();
                break;
            case 'calendar':
            case 'teams':
                console.log(`🟡 showPage: Renderuję CALENDAR`);
                renderTeams();
                break;
            case 'squadlead':
                console.log(`🟡 showPage: Renderuję SQUADLEAD`);
                // Initialize and render Module 09 Squad Lead
                if (typeof init === 'function') {
                    init(); // Call Module 09 init()
                } else {
                    console.error('🟡 showPage: init() not found from squadlead.js');
                }
                break;
            case 'settings':
                console.log(`🟡 showPage: Renderuję SETTINGS`);
                renderSettings();
                break;
            default:
                console.log(`⚠️ showPage: Nieznana strona "${pageName}"`);
        }
    } else {
        console.error(`❌ showPage: NIE ZNALEZIONO elementu id="${pageId}"`);
    }
}


// --- Load/Save Projects ---
function loadProjects() {
    const saved = localStorage.getItem('cp_projects');
    if (saved) {
        try {
            PROJECTS = JSON.parse(saved);
        } catch (e) { }
    }
    const savedArchived = localStorage.getItem('cp_archived_projects');
    if (savedArchived) {
        try {
            ARCHIVED_PROJECTS = JSON.parse(savedArchived);
        } catch (e) { }
    }
}

function saveProjects() {
    console.log('💾 saveProjects() called - saving', PROJECTS.length, 'projects to localStorage');
    try {
        localStorage.setItem('cp_projects', JSON.stringify(PROJECTS));
        localStorage.setItem('cp_archived_projects', JSON.stringify(ARCHIVED_PROJECTS));
        console.log('✅ Projects saved successfully');
    } catch (e) {
        console.error('❌ Error saving projects:', e);
    }
}

function savePeople() {
    console.log('💾 savePeople() called - saving', PEOPLE.length, 'people to localStorage');
    try {
        localStorage.setItem('cp_people', JSON.stringify(PEOPLE));
        console.log('✅ People saved successfully');
    } catch (e) {
        console.error('❌ Error saving people:', e);
    }
}

function loadPeople() {
    const saved = localStorage.getItem('cp_people');
    if (saved) {
        try {
            PEOPLE = JSON.parse(saved);
        } catch (e) { }
    }
}

function saveAllocations() {
    // Allocations are stored in project.allocations, so just save projects
    saveProjects();
}

function loadAllocations() {
    // Allocations are loaded with projects
    loadProjects();
}

// --- Stub render functions (to be implemented) ---
function renderProjectsTable() {
    console.log('⚠️ renderProjectsTable() stub - not implemented yet');
    const container = document.getElementById('page-projects');
    if (!container) return;
    container.innerHTML = '<div style="padding: 20px;"><p>🚧 Projects view - coming soon</p></div>';
}

function renderCapacityBars() {
    console.log('⚠️ renderCapacityBars() stub - not implemented yet');
}

function renderActionNeeded() {
    console.log('⚠️ renderActionNeeded() stub - not implemented yet');
}

function renderWorkloadGrid() {
    console.log('⚠️ renderWorkloadGrid() stub - not implemented yet');
}

function renderPeople() {
    console.log('⚠️ renderPeople() stub - not implemented yet');
}

function renderSprints() {
    console.log('⚠️ renderSprints() stub - not implemented yet');
}

function renderTeams() {
    console.log('⚠️ renderTeams() stub - not implemented yet');
}

function renderSprintAvailability() {
    console.log('⚠️ renderSprintAvailability() stub - not implemented yet');
}



// ============================================================
// EDIT PERSON MODAL - OBSŁUGA EDYCJI OSÓB
// ============================================================

function openEditPersonModal(personName) {
    const person = PEOPLE.find(p => p.name === personName);
    if (!person) return;

    const modal = document.getElementById('editPersonModal');
    if (!modal) return;

    // Wypełnij tytuł
    document.getElementById('editPersonTitle').textContent = `Edytuj: ${person.name}`;

    // Wypełnij Role
    const roleSelect = document.getElementById('editPersonRole');
    roleSelect.innerHTML = ROLES.map(r => `<option value="${r}" ${person.role === r ? 'selected' : ''}>${r}</option>`).join('');

    // Wypełnij Zespół
    const teamSelect = document.getElementById('editPersonTeam');
    teamSelect.innerHTML = TEAMS.map(t => `<option value="${t.name}" ${person.team === t.name ? 'selected' : ''}>${t.name}</option>`).join('');

    // Wypełnij Zespół projektowy (multi-select)
    const assignedTeamsSelect = document.getElementById('editPersonAssignedTeams');
    assignedTeamsSelect.innerHTML = TEAMS.map(t => `<option value="${t.name}" ${person.assignedTeams && person.assignedTeams.includes(t.name) ? 'selected' : ''}>${t.name}</option>`).join('');

    // Wypełnij pozostałe pola
    document.getElementById('editPersonEmploymentType').value = person.employmentType || 'full-time';
    document.getElementById('editPersonAvailability').value = person.availability || 100;
    document.getElementById('editPersonAvailabilityFrom').value = person.availabilityFrom || '';
    document.getElementById('editPersonAvailabilityTo').value = person.availabilityTo || '';
    document.getElementById('editPersonNotes').value = person.notes || '';

    // Pokaż modal
    modal.style.display = 'flex';

    // Bind przycisków
    const saveBtn = document.getElementById('saveEditPersonBtn');
    const cancelBtn = document.getElementById('cancelEditPersonBtn');
    const closeBtn = document.getElementById('closeEditPersonBtn');

    const handleSave = () => {
        person.role = document.getElementById('editPersonRole').value;
        person.team = document.getElementById('editPersonTeam').value;
        person.assignedTeams = Array.from(document.getElementById('editPersonAssignedTeams').selectedOptions).map(opt => opt.value);
        person.employmentType = document.getElementById('editPersonEmploymentType').value;
        person.availability = parseInt(document.getElementById('editPersonAvailability').value) || 100;
        person.availabilityFrom = document.getElementById('editPersonAvailabilityFrom').value;
        person.availabilityTo = document.getElementById('editPersonAvailabilityTo').value;
        person.notes = document.getElementById('editPersonNotes').value;
        
        savePeople();
        modal.style.display = 'none';
        renderPeople(); // Re-render jeśli na tab Osoby
        // lub renderSettings() jeśli na Ustawienia
    };

    const handleClose = () => {
        modal.style.display = 'none';
        saveBtn.removeEventListener('click', handleSave);
        cancelBtn.removeEventListener('click', handleClose);
        closeBtn.removeEventListener('click', handleClose);
    };

    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleClose);
    closeBtn.addEventListener('click', handleClose);
}

// ============================================================
// INITIALIZATION - RUN ON PAGE LOAD
// ============================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded (e.g., script loaded after DOM ready)
    initializeApp();
}

console.log('✅ app.js LOADED - initialization handler registered');



// ============================================================
// EDIT PERSON MODAL - HANDLER
// ============================================================

let editingPersonName = null;

function openEditPersonModal(personName) {
    editingPersonName = personName;
    const person = PEOPLE.find(p => p.name === personName);
    if (!person) return;

    const modal = document.getElementById('editPersonModal');
    if (!modal) return;

    // Wypełnij select#editPersonRole opcjami z ROLES array
    const roleSelect = document.getElementById('editPersonRole');
    roleSelect.innerHTML = '';
    ROLES.forEach(role => {
        const opt = document.createElement('option');
        opt.value = role;
        opt.textContent = role;
        opt.selected = (role === person.role);
        roleSelect.appendChild(opt);
    });

    // Wypełnij select#editPersonTeam opcjami z TEAMS array
    const teamSelect = document.getElementById('editPersonTeam');
    teamSelect.innerHTML = '';
    TEAMS.forEach(team => {
        const opt = document.createElement('option');
        opt.value = team.name;
        opt.textContent = team.name;
        opt.selected = (team.name === person.team);
        teamSelect.appendChild(opt);
    });

    // Wypełnij select#editPersonAssignedTeams opcjami z TEAMS array (multi-select!)
    const assignedTeamsSelect = document.getElementById('editPersonAssignedTeams');
    assignedTeamsSelect.innerHTML = '';
    TEAMS.forEach(team => {
        const opt = document.createElement('option');
        opt.value = team.name;
        opt.textContent = team.name;
        opt.selected = (person.assignedTeams && person.assignedTeams.includes(team.name));
        assignedTeamsSelect.appendChild(opt);
    });

    // Wypełnij input#editPersonEmploymentType
    const employmentTypeSelect = document.getElementById('editPersonEmploymentType');
    if (employmentTypeSelect) {
        employmentTypeSelect.value = person.employmentType || 'full-time';
    }

    // Wypełnij input#editPersonAvailability
    const availabilityInput = document.getElementById('editPersonAvailability');
    if (availabilityInput) {
        availabilityInput.value = person.availability || 100;
    }

    // Wypełnij input#editPersonAvailabilityFrom
    const availabilityFromInput = document.getElementById('editPersonAvailabilityFrom');
    if (availabilityFromInput) {
        availabilityFromInput.value = person.availabilityFrom || '';
    }

    // Wypełnij input#editPersonAvailabilityTo
    const availabilityToInput = document.getElementById('editPersonAvailabilityTo');
    if (availabilityToInput) {
        availabilityToInput.value = person.availabilityTo || '';
    }

    // Wypełnij textarea#editPersonNotes
    const notesTextarea = document.getElementById('editPersonNotes');
    if (notesTextarea) {
        notesTextarea.value = (person.notes && Array.isArray(person.notes) && person.notes.length > 0) 
            ? person.notes.map(n => typeof n === 'object' ? n.content : n).join('\n')
            : '';
    }

    // Pokaż modal
    modal.style.display = 'flex';
}

function closeEditPersonModal() {
    const modal = document.getElementById('editPersonModal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingPersonName = null;
}

function saveEditPerson() {
    if (!editingPersonName) return;

    const person = PEOPLE.find(p => p.name === editingPersonName);
    if (!person) return;

    // Pobierz wartości z formularza
    const roleSelect = document.getElementById('editPersonRole');
    const teamSelect = document.getElementById('editPersonTeam');
    const assignedTeamsSelect = document.getElementById('editPersonAssignedTeams');
    const employmentTypeSelect = document.getElementById('editPersonEmploymentType');
    const availabilityInput = document.getElementById('editPersonAvailability');
    const availabilityFromInput = document.getElementById('editPersonAvailabilityFrom');
    const availabilityToInput = document.getElementById('editPersonAvailabilityTo');
    const notesTextarea = document.getElementById('editPersonNotes');

    // Aktualizuj dane osoby
    person.role = roleSelect.value;
    person.team = teamSelect.value;
    person.employmentType = employmentTypeSelect.value;
    person.availability = parseInt(availabilityInput.value) || 100;
    person.availabilityFrom = availabilityFromInput.value;
    person.availabilityTo = availabilityToInput.value;

    // Dla assignedTeams użyj Array.from(select.selectedOptions).map(opt => opt.value)
    person.assignedTeams = Array.from(assignedTeamsSelect.selectedOptions).map(opt => opt.value);

    // Notatki
    if (notesTextarea.value.trim()) {
        person.notes = [{
            content: notesTextarea.value,
            author: getCurrentUser(),
            createdAt: new Date().toISOString()
        }];
    }

    // Zapisz zmiany do PEOPLE array i localStorage
    savePeople();

    // Zamknij modal
    closeEditPersonModal();

    // Odśwież rendering strony people jeśli jest aktywna
    renderPeople();
}

// Bind event listeners dla editPersonModal
function bindEditPersonModal() {
    const modal = document.getElementById('editPersonModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeEditPersonBtn');
    const cancelBtn = document.getElementById('cancelEditPersonBtn');
    const saveBtn = document.getElementById('saveEditPersonBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditPersonModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditPersonModal);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveEditPerson);
    }

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditPersonModal();
        }
    });
}


// Initialize edit person modal on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEditPersonModal);
} else {
    bindEditPersonModal();
}


// ============================================================
// EVENT DELEGATION FOR EDIT PERSON BUTTONS
// ============================================================

// Setup event delegation for edit person buttons
document.addEventListener('click', (e) => {
    // Check if clicked element or its parent is an edit person button
    const editBtn = e.target.closest('[data-edit-person]');
    if (editBtn) {
        const personName = editBtn.dataset.editPerson;
        openEditPersonModal(personName);
    }
});

