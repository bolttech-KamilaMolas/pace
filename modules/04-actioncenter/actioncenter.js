/**
 * ACTION CENTER MODULE
 * Automatycznie wyświetla pilne akcje do zrobienia
 */

// ===== STATE =====
let allActions = [];
let currentFilter = 'all';
const currentUser = localStorage.getItem('cp_current_user') || 'Current User';

// ===== GENERATE ACTIONS =====
function generateActions(projects, teams, alertConfig, capacityParams) {
    const actions = [];
    
    // 1. RED PROJECTS 🔴
    if (alertConfig.show_red_projects) {
        projects.forEach(p => {
            if (p.health === 'red' || (p.status === 'at-risk' && p.health !== 'green')) {
                actions.push({
                    id: `red-project-${p.id}`,
                    type: 'red-project',
                    icon: '🔴',
                    title: `Critical: ${p.name} at Risk`,
                    description: `Project has health=${p.health.toUpperCase()}, status=${p.status}. Immediate action needed.`,
                    owner: p.responsible || p.lead,
                    dueDate: null,
                    priority: 0,  // P0 = Critical
                    projectId: p.id,
                    action: 'VIEW_PROJECT'
                });
            }
        });
    }
    
    // 2. BLOCKED PROJECTS 🚫
    if (alertConfig.show_blocked_projects) {
        projects.forEach(p => {
            if (p.status === 'blocked') {
                // Look for owner decisions
                if (p.owner_decisions && p.owner_decisions.length > 0) {
                    p.owner_decisions.forEach(decision => {
                        if (decision.status === 'open') {
                            actions.push({
                                id: `blocked-decision-${p.id}-${decision.description.substring(0, 10)}`,
                                type: 'owner-decision',
                                icon: '🚫',
                                title: `Decision Needed: ${p.name}`,
                                description: decision.description,
                                owner: p.lead,
                                dueDate: decision.dueDate,
                                priority: 1,  // P1 = High
                                projectId: p.id,
                                action: 'OPEN_DECISION'
                            });
                        }
                    });
                }
            }
        });
    }
    
    // 3. OVERLOADED TEAMS 👥
    if (alertConfig.show_overloaded_teams) {
        teams.forEach(team => {
            // Calculate current week allocations
            const weekIdx = getWeeksSinceBase(new Date());
            const capacity = getCapacity(team.id, weekIdx);
            
            // Sum allocations for this week
            let totalAllocated = 0;
            projects.forEach(p => {
                if (p.allocations && p.allocations[team.id]) {
                    totalAllocated += p.allocations[team.id][weekIdx] || 0;
                }
            });
            
            const utilizationPercent = (totalAllocated / capacity) * 100;
            
            if (utilizationPercent > 100) {
                actions.push({
                    id: `overloaded-team-${team.id}`,
                    type: 'overloaded-team',
                    icon: '👥',
                    title: `Overloaded: ${team.name} Team at ${Math.round(utilizationPercent)}%`,
                    description: `${team.name} team has ${Math.round(totalAllocated)} MD allocated vs ${Math.round(capacity)} MD capacity. Need to rebalance or extend.`,
                    owner: null,
                    dueDate: null,
                    priority: 1,  // P1 = High
                    teamId: team.id,
                    action: 'VIEW_WORKLOAD'
                });
            }
        });
    }
    
    // 4. HIGH RISKS ⚠️
    if (alertConfig.show_high_risks) {
        projects.forEach(p => {
            if (p.risks && p.risks.length > 0) {
                p.risks.forEach(risk => {
                    if (risk.status === 'open' && (risk.priority === 0 || risk.priority === 1)) {
                        const priorityClass = risk.priority === 0 ? 0 : 1;
                        actions.push({
                            id: `risk-${p.id}-${risk.description.substring(0, 10)}`,
                            type: 'high-risk',
                            icon: '⚠️',
                            title: `Risk: ${risk.description}`,
                            description: `Project: ${p.name} | Owner: ${risk.owner} | Status: ${risk.status}`,
                            owner: risk.owner,
                            dueDate: risk.dueDate,
                            priority: priorityClass,
                            projectId: p.id,
                            action: 'VIEW_RISK'
                        });
                    }
                });
            }
        });
    }
    
    // 5. CUSTOM ALERTS 🔔
    if (alertConfig.custom_alerts && alertConfig.custom_alerts.length > 0) {
        alertConfig.custom_alerts.forEach((alert, idx) => {
            actions.push({
                id: `custom-alert-${idx}`,
                type: 'custom-alert',
                icon: '🔔',
                title: alert.description,
                description: `Custom alert | Owner: ${alert.owner || 'Unassigned'}`,
                owner: alert.owner,
                dueDate: alert.dueDate,
                priority: alert.priority || 2,
                action: 'ACKNOWLEDGE'
            });
        });
    }
    
    return actions;
}

// ===== FILTER ACTIONS =====
function filterActions(actions, filter) {
    let filtered = [...actions];
    
    switch(filter) {
        case 'critical':
            filtered = filtered.filter(a => a.priority <= 1);
            break;
        case 'overdue':
            const today = new Date();
            filtered = filtered.filter(a => {
                if (!a.dueDate) return false;
                return new Date(a.dueDate) < today;
            });
            break;
        case 'assigned-to-me':
            filtered = filtered.filter(a => a.owner === currentUser);
            break;
        case 'all':
        default:
            // No filter
            break;
    }
    
    return filtered;
}

// ===== RENDER ACTION CENTER =====
function renderActionCenter() {
    const container = document.getElementById('actions-list');
    if (!container) return;
    
    // Filter actions based on current filter
    const filtered = filterActions(allActions, currentFilter);
    
    // Clear container
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <h2>Wszystko w porządku!</h2>
                <p>Brak pilnych akcji do zrobienia.</p>
            </div>
        `;
        return;
    }
    
    // Render each action
    filtered.forEach(action => {
        const card = createActionCard(action);
        container.appendChild(card);
    });
}

// ===== CREATE ACTION CARD =====
function createActionCard(action) {
    const card = document.createElement('div');
    card.className = `action-card priority-${action.priority}`;
    card.dataset.actionId = action.id;
    
    const dueStr = action.dueDate ? `📅 ${formatShortDate(action.dueDate)}` : '';
    const ownerStr = action.owner ? `👤 ${action.owner}` : '👤 Unassigned';
    
    card.innerHTML = `
        <div class="action-icon">${action.icon}</div>
        
        <div class="action-content">
            <h3>${action.title}</h3>
            <p>${action.description}</p>
            <div class="action-meta">
                <span>${ownerStr}</span>
                ${dueStr ? `<span>${dueStr}</span>` : ''}
                <span class="priority-badge p${action.priority}">P${action.priority}</span>
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="action-btn primary" data-action="${action.action}" data-action-id="${action.id}">
                ${getActionButtonText(action.action)}
            </button>
            ${action.owner !== currentUser ? `
                <button class="action-btn assign-btn" data-action-id="${action.id}">
                    Przydziel sobie
                </button>
            ` : ''}
        </div>
    `;
    
    // Event listeners
    card.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', e => handleActionClick(e, action));
    });
    
    return card;
}

// ===== HANDLE ACTION CLICK =====
function handleActionClick(e, action) {
    const btn = e.target;
    
    if (btn.classList.contains('assign-btn')) {
        handleAssignToMe(action);
        return;
    }
    
    const actionType = btn.dataset.action;
    
    switch(actionType) {
        case 'VIEW_PROJECT':
            openProjectDetail(action.projectId);
            break;
        case 'OPEN_DECISION':
            alert(`Decyzja: ${action.description}\n\nDo zaimplementowania w głównej aplikacji`);
            break;
        case 'VIEW_WORKLOAD':
            alert(`Obciążenie zespołu ${action.teamId}\n\nDo zaimplementowania w głównej aplikacji`);
            break;
        case 'VIEW_RISK':
            alert(`Ryzyka dla projektu ${action.projectId}\n\nDo zaimplementowania w głównej aplikacji`);
            break;
        case 'ACKNOWLEDGE':
            handleAcknowledge(action);
            break;
        default:
            console.log('Action:', actionType, action);
    }
}

// ===== HANDLE ASSIGN TO ME =====
function handleAssignToMe(action) {
    // Mark as assigned to current user
    const idx = allActions.findIndex(a => a.id === action.id);
    if (idx !== -1) {
        allActions[idx].owner = currentUser;
    }
    
    console.log(`Przydzielono akcję ${action.id} dla ${currentUser}`);
    renderActionCenter();
    renderSummary();
    
    // Toast notification
    showNotification(`Przydzielono akcję!`);
}

// ===== HANDLE ACKNOWLEDGE =====
function handleAcknowledge(action) {
    console.log(`Acknowledge alert: ${action.id}`);
    showNotification('Alert potwierdzony!');
    
    // Remove from list
    allActions = allActions.filter(a => a.id !== action.id);
    renderActionCenter();
    renderSummary();
}

// ===== RENDER SUMMARY =====
function renderSummary() {
    const summary = document.getElementById('summary');
    if (!summary) return;
    
    const redProjects = allActions.filter(a => a.type === 'red-project').length;
    const blockedProjects = allActions.filter(a => a.type === 'owner-decision').length;
    const overloadedTeams = allActions.filter(a => a.type === 'overloaded-team').length;
    const risks = allActions.filter(a => a.type === 'high-risk').length;
    
    summary.innerHTML = `
        <div class="summary-card">
            <div class="number">${redProjects}</div>
            <div class="label">Red Projects</div>
        </div>
        <div class="summary-card">
            <div class="number">${blockedProjects}</div>
            <div class="label">Blocked</div>
        </div>
        <div class="summary-card">
            <div class="number">${overloadedTeams}</div>
            <div class="label">Overloaded</div>
        </div>
        <div class="summary-card">
            <div class="number">${risks}</div>
            <div class="label">Risks</div>
        </div>
    `;
}

// ===== FILTER BUTTONS =====
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderActionCenter();
        });
    });
}

// ===== UTILITIES =====
function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
}

function getActionButtonText(action) {
    switch(action) {
        case 'VIEW_PROJECT': return 'Otwórz projekt';
        case 'OPEN_DECISION': return 'Decyzja';
        case 'VIEW_WORKLOAD': return 'Widok obciążenia';
        case 'VIEW_RISK': return 'Ryzyka';
        case 'ACKNOWLEDGE': return 'Potwierdź';
        default: return 'Akcja';
    }
}

function getWeeksSinceBase(date) {
    const ms = date - BASE_DATE;
    return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

function openProjectDetail(projectId) {
    alert(`Otwieranie projektu #${projectId}\n\nDo zaimplementowania w głównej aplikacji`);
}

function showNotification(msg) {
    // Simple notification (replace with toast later)
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// ===== INITIALIZE =====
function init() {
    // Generate actions from mock data
    allActions = generateActions(MOCK_PROJECTS, TEAMS, MOCK_ALERT_CONFIG, MOCK_CAPACITY_PARAMS);
    
    // Sort by priority
    allActions.sort((a, b) => a.priority - b.priority);
    
    console.log(`Generated ${allActions.length} actions`);
    console.log(allActions);
    
    // Render
    renderSummary();
    renderActionCenter();
    initFilters();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
