/**
 * MOCK DATA FOR ACTION CENTER
 * Test data dla standalone testing
 */

// ===== PROJECTS (Sample) =====
const MOCK_PROJECTS = [
    {
        id: 1,
        name: "ALF Lease Portal",
        category: "project",
        priority: 3,
        status: "at-risk",
        health: "red",
        lead: "John Doe",
        responsible: "John Doe",
        teams: ["alf", "backend"],
        budget: 100,
        spent: 85,
        description: "Main ALF system",
        allocations: {
            "alf": { 0: 8, 1: 8, 2: 8 },
            "backend": { 0: 6, 1: 6, 2: 4 }
        },
        notes: [
            { content: "Database migration pending", author: "John", type: "note", createdAt: "2026-01-10" }
        ],
        risks: [
            { 
                description: "DB performance degradation in production",
                owner: "Jane Smith",
                status: "open",
                impact: "critical",
                priority: 1,
                dueDate: "2026-01-15"
            },
            {
                description: "Third-party API unavailable during peak hours",
                owner: "Bob Wilson",
                status: "open",
                impact: "high",
                priority: 2,
                dueDate: "2026-01-20"
            }
        ],
        owner_decisions: [
            { description: "Should we reduce scope or extend timeline?", status: "open", dueDate: "2026-01-13" }
        ]
    },
    {
        id: 2,
        name: "OCS Integration",
        category: "project",
        priority: 5,
        status: "blocked",
        health: "red",
        lead: "Sarah Connor",
        responsible: "Sarah Connor",
        teams: ["backend", "qa"],
        budget: 50,
        spent: 10,
        description: "Integrate with OCS system",
        allocations: {
            "backend": { 0: 0, 1: 0, 2: 0 }
        },
        notes: [],
        risks: [],
        owner_decisions: [
            { description: "Waiting for OCS API specification", status: "open", dueDate: "2026-01-14" }
        ]
    },
    {
        id: 3,
        name: "Mobile App Refactor",
        category: "project",
        priority: 10,
        status: "in-progress",
        health: "green",
        lead: "Mike Johnson",
        responsible: "Mike Johnson",
        teams: ["frontend"],
        budget: 80,
        spent: 40,
        description: "React rewrite",
        allocations: {
            "frontend": { 0: 8, 1: 6, 2: 6 }
        },
        notes: [],
        risks: []
    },
    {
        id: 4,
        name: "Security Audit",
        category: "project",
        priority: 1,
        status: "in-progress",
        health: "amber",
        lead: "Alice Brown",
        responsible: "Alice Brown",
        teams: ["devops", "backend"],
        budget: 40,
        spent: 35,
        description: "Annual security assessment",
        allocations: {
            "devops": { 0: 8, 1: 8, 2: 8 },
            "backend": { 0: 4, 1: 4, 2: 4 }
        },
        notes: [],
        risks: [
            {
                description: "Critical vulnerability found in auth module",
                owner: "Alice Brown",
                status: "open",
                impact: "critical",
                priority: 0,
                dueDate: "2026-01-12"
            }
        ]
    },
    {
        id: 5,
        name: "Performance Optimization",
        category: "bau",
        priority: 15,
        status: "in-progress",
        health: "green",
        lead: "Charlie Davis",
        responsible: "Charlie Davis",
        teams: ["backend"],
        budget: 20,
        spent: 15,
        description: "DB query optimization",
        allocations: {
            "backend": { 0: 4, 1: 4, 2: 4 }
        },
        notes: [],
        risks: []
    }
];

// ===== ALERT CONFIG =====
const MOCK_ALERT_CONFIG = {
    show_red_projects: true,
    show_blocked_projects: true,
    show_overloaded_teams: true,
    show_high_risks: true,
    show_ownerless_actions: true,
    custom_alerts: [
        {
            type: 'custom',
            description: 'Team training scheduled for Q1',
            priority: 3,
            dueDate: '2026-03-15',
            owner: 'HR'
        }
    ]
};

// ===== CAPACITY PARAMS =====
const MOCK_CAPACITY_PARAMS = {
    overhead: 0.1,      // 10% overhead
    scrum: 0.1,         // 10% scrum activities
    maintenance: 0.15,  // 15% maintenance
    bau: 0.2,           // 20% BAU
    projects: 0.45      // 45% projects (remaining)
};

// ===== CURRENT SPRINT =====
const MOCK_CURRENT_SPRINT = {
    id: 'sprint-1',
    dates: '2026-01-06 to 2026-01-17',
    name: 'Sprint 1'
};

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOCK_PROJECTS,
        MOCK_ALERT_CONFIG,
        MOCK_CAPACITY_PARAMS,
        MOCK_CURRENT_SPRINT
    };
}
