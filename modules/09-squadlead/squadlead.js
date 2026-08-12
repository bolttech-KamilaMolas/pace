/**
 * SQUAD LEAD MODULE
 * Dashboard dla liderów - pojemność, zdrowie, ryzyka zespołów
 * Z selectorami: Current Sprint / Next Sprint
 */

// ===== STATE =====
let teamMetrics = [];
let expandedTeams = new Set();
let currentSprintIdx = 0;  // 0 = Current Sprint, 1 = Next Sprint
let sprints = [];

// ===== SPRINT MANAGEMENT =====
function getSprints() {
    // Get current sprint and next sprint from SPRINTS array (global from app.js)
    if (typeof SPRINTS !== 'undefined') {
        const today = new Date();
        let currentIdx = 0;
        
        // Find current sprint
        for (let i = 0; i < SPRINTS.length; i++) {
            const dates = parseSprintDatesForSort(SPRINTS[i].dates);
            if (dates && today >= dates.start && today <= dates.end) {
                currentIdx = i;
                break;
            }
            if (dates && today < dates.start) {
                currentIdx = Math.max(0, i - 1);
                break;
            }
            currentIdx = i;
        }
        
        // Return [current, next]
        return [
            SPRINTS[currentIdx],
            SPRINTS[currentIdx + 1] || SPRINTS[currentIdx]
        ];
    }
    
    // Fallback to mock data
    return [
        MOCK_CURRENT_SPRINT,
        {
            id: 'sprint-2',
            dates: '2026-01-20 to 2026-01-31',
            name: 'Sprint 2',
            index: 2
        }
    ];
}

function parseSprintDatesForSort(dateStr) {
    // Parse "DD.MM - DD.MM" format
    try {
        const parts = dateStr.split(' - ');
        if (parts.length !== 2) return null;
        
        const year = new Date().getFullYear();
        const [startDay, startMonth] = parts[0].trim().split('.');
        const [endDay, endMonth] = parts[1].trim().split('.');
        
        return {
            start: new Date(year, parseInt(startMonth) - 1, parseInt(startDay)),
            end: new Date(year, parseInt(endMonth) - 1, parseInt(endDay))
        };
    } catch (e) {
        return null;
    }
}

// ===== SWITCH SPRINT =====
function switchSprint(sprintIdx) {
    currentSprintIdx = sprintIdx;
    
    // Update button states
    document.querySelectorAll('.sprint-btn').forEach((btn, idx) => {
        if (idx === sprintIdx) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update sprint info
    const sprint = sprints[sprintIdx];
    if (sprint) {
        const sprintLabel = sprintIdx === 0 ? '📌 Current' : '⏭️ Next';
        document.getElementById('sprint-info').textContent = `${sprintLabel} Sprint: ${sprint.name} (${sprint.dates})`;
    }
    
    // Re-generate metrics for selected sprint
    regenerateMetrics();
}

// ===== REGENERATE METRICS FOR CURRENT SPRINT =====
function regenerateMetrics() {
    // The sprint index needs to map to weeks in allocations
    // For now, use currentSprintIdx as week offset
    teamMetrics = generateTeamMetrics(MOCK_PROJECTS, TEAMS, MOCK_CAPACITY_PARAMS, currentSprintIdx);
    
    console.log(`Switched to sprint ${currentSprintIdx}, regenerated ${teamMetrics.length} team metrics`);
    
    renderCapacityTable();
}
function generateTeamMetrics(projects, teams, capacityParams, sprintIdx = 0) {
    const metrics = [];
    const sprint = sprints[sprintIdx];
    
    teams.forEach(team => {
        // Get FTE available for this week
        const fteAvailable = getCapacity(team.id, sprintIdx);
        
        // Sum allocations for this week
        let totalAllocated = 0;
        projects.forEach(p => {
            if (p.allocations && p.allocations[team.id]) {
                totalAllocated += p.allocations[team.id][sprintIdx] || 0;
            }
        });
        
        // Calculate utilization
        const utilization = fteAvailable > 0 ? totalAllocated / fteAvailable : 0;
        
        // Determine status
        let status = 'ok';
        if (utilization > 1.05) {
            status = 'overloaded';
        } else if (utilization > 0.8) {
            status = 'high';
        }
        
        // Get goals for this sprint (use sprint ID as key)
        let goals = [];
        if (sprint && MOCK_SPRINT_GOALS) {
            const sprintKey = sprint.id || 'sprint-1';
            if (MOCK_SPRINT_GOALS[sprintKey] && MOCK_SPRINT_GOALS[sprintKey][team.id]) {
                goals = MOCK_SPRINT_GOALS[sprintKey][team.id];
            }
        }
        
        metrics.push({
            teamId: team.id,
            teamName: team.name,
            teamColor: team.color,
            fteAvailable: Math.round(fteAvailable * 10) / 10,  // 1 decimal
            allocated: Math.round(totalAllocated * 10) / 10,
            utilization: utilization,
            utilizationPercent: Math.round(utilization * 100),
            status: status,
            lead: team.name === 'ALF' ? 'Kamila Molas' : null,
            people: MOCK_PEOPLE.filter(p => p.team === team.id),
            risks: MOCK_RISKS.filter(r => r.team === team.id),
            goals: goals
        });
    });
    
    return metrics;
}

// ===== RENDER CAPACITY TABLE =====
function renderCapacityTable() {
    const tbody = document.getElementById('capacity-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by utilization descending (most loaded first)
    const sorted = [...teamMetrics].sort((a, b) => b.utilization - a.utilization);
    
    sorted.forEach(metric => {
        // Row 1: Team info + capacity
        const row = document.createElement('tr');
        row.className = metric.status === 'overloaded' ? 'expanded' : '';
        row.dataset.teamId = metric.teamId;
        
        const statusIcon = metric.status === 'ok' ? '🟢' : metric.status === 'high' ? '🟠' : '🔴';
        const chevron = expandedTeams.has(metric.teamId) ? '▼' : '▶';
        
        row.innerHTML = `
            <td>
                <div class="team-name-cell">
                    <span class="expand-icon" data-team-id="${metric.teamId}">${chevron}</span>
                    <div class="team-icon" style="background: ${metric.teamColor};"></div>
                    <strong style="color: ${metric.teamColor};">${metric.teamName}</strong>
                </div>
            </td>
            <td>${metric.fteAvailable} MD</td>
            <td>${metric.allocated} MD</td>
            <td>
                <div class="utilization-bar">
                    <div class="bar">
                        <div class="bar-fill ${metric.status}" style="width: ${Math.min(metric.utilizationPercent, 100)}%">
                            ${metric.utilizationPercent > 100 ? Math.round(metric.utilizationPercent) + '%' : ''}
                        </div>
                    </div>
                    <span>${metric.utilizationPercent}%</span>
                </div>
            </td>
            <td style="text-align: center;">
                <div class="status-badge ${metric.status}">
                    ${statusIcon}
                </div>
            </td>
        `;
        
        row.addEventListener('click', e => {
            if (e.target.closest('.expand-icon')) {
                toggleTeamDetails(metric.teamId);
            }
        });
        
        tbody.appendChild(row);
        
        // Row 2: Team details (hidden by default)
        if (expandedTeams.has(metric.teamId)) {
            const detailsRow = createTeamDetailsRow(metric);
            tbody.appendChild(detailsRow);
        }
    });
    
    // Work breakdown is now inside team details expansion
}

// ===== RENDER WORK BREAKDOWN =====
function renderWorkBreakdown(metrics) {
    const grid = document.getElementById('breakdown-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    metrics.forEach(metric => {
        // Get capacity params for this team
        const params = MOCK_CAPACITY_PARAMS[metric.teamId] || 
                       { overhead: 5, scrum: 10, maintenance: 15, bau: 15, projects: 55 };
        
        const totalCapacity = metric.fteAvailable;
        
        // Calculate MD per category
        const breakdown = {
            projects: Math.round((params.projects / 100) * totalCapacity * 10) / 10,
            bau: Math.round((params.bau / 100) * totalCapacity * 10) / 10,
            maintenance: Math.round((params.maintenance / 100) * totalCapacity * 10) / 10,
            scrum: Math.round((params.scrum / 100) * totalCapacity * 10) / 10,
            overhead: Math.round((params.overhead / 100) * totalCapacity * 10) / 10
        };
        
        // Create card
        const card = document.createElement('div');
        card.className = 'team-breakdown';
        
        const categoryOrder = ['projects', 'bau', 'maintenance', 'scrum', 'overhead'];
        const categoryLabels = {
            'projects': 'Projects',
            'bau': 'BAU',
            'maintenance': 'Maintenance',
            'scrum': 'Scrum',
            'overhead': 'Overhead'
        };
        
        const categoryEmoji = {
            'projects': '🎯',
            'bau': '🔧',
            'maintenance': '🛠️',
            'scrum': '👥',
            'overhead': '📋'
        };
        
        let html = `
            <div class="team-breakdown-header">
                <div class="team-breakdown-icon" style="background: ${metric.teamColor};"></div>
                <span>${metric.teamName}</span>
                <span style="color: var(--text-secondary); font-size: 12px; font-weight: normal;">
                    ${totalCapacity} MD
                </span>
            </div>
        `;
        
        // Calculate ACTUAL allocations from PROJECTS allocations
        const calculateActualAllocations = (teamId, sprintIdx) => {
            const actual = {
                projects: 0,
                bau: 0,
                maintenance: 0,
                scrum: 0,
                overhead: 0
            };
            
            // Sum allocations per category
            MOCK_PROJECTS.forEach(proj => {
                if (proj.allocations && proj.allocations[teamId] && proj.allocations[teamId][sprintIdx]) {
                    const md = proj.allocations[teamId][sprintIdx];
                    if (proj.category === 'project') actual.projects += md;
                    else if (proj.category === 'bau') actual.bau += md;
                    else if (proj.category === 'maintenance') actual.maintenance += md;
                    else if (proj.category === 'scrum') actual.scrum += md;
                    else if (proj.category === 'overhead') actual.overhead += md;
                }
            });
            
            return actual;
        };
        
        const actualMD = calculateActualAllocations(metric.teamId.toLowerCase(), currentSprintIdx);
        const totalCapacityMD = totalCapacity; // Total FTE for team in MD
        
        categoryOrder.forEach(category => {
            const plannedMD = breakdown[category];
            const actualMD_cat = actualMD[category] || 0;
            const plannedPercent = params[category];
            const actualPercent = totalCapacityMD > 0 ? Math.round((actualMD_cat / totalCapacityMD) * 100) : 0;
            
            html += `
                <div class="breakdown-item">
                    <span class="breakdown-label">
                        ${categoryEmoji[category]} ${categoryLabels[category]}
                    </span>
                    <div class="breakdown-bars-container">
                        <!-- Planned bar (light) -->
                        <div class="breakdown-bar">
                            <div class="breakdown-bar-fill ${category} planned" style="width: ${Math.min(plannedPercent, 100)}%;" title="Plan: ${plannedPercent}% (${plannedMD.toFixed(1)} MD)">
                                <span class="bar-label">${plannedPercent}%</span>
                            </div>
                        </div>
                        <!-- Actual bar (dark overlay) -->
                        ${actualMD_cat > 0 ? `
                        <div class="breakdown-bar">
                            <div class="breakdown-bar-fill ${category} actual" style="width: ${Math.min(actualPercent, 100)}%;" title="Actual: ${actualPercent}% (${actualMD_cat.toFixed(1)} MD)">
                                <span class="bar-label">${actualPercent}%</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <span class="breakdown-value">
                        Plan: ${plannedMD.toFixed(1)} MD | Actual: ${actualMD_cat.toFixed(1)} MD
                    </span>
                </div>
            `;
        });
        
        card.innerHTML = html;
        grid.appendChild(card);
    });
}
function createTeamDetailsRow(metric) {
    const row = document.createElement('tr');
    row.className = 'team-details expanded';
    row.dataset.teamId = metric.teamId;
    
    // Calculate people availability
    const peopleMarkup = metric.people.map(person => {
        const isOff = MOCK_PERSON_TIME_OFF[person.name];
        const offDays = isOff ? Object.keys(isOff).length : 0;
        const status = offDays > 0 ? `🔴 Off (${offDays} days)` : '✅ Available';
        const statusClass = offDays > 0 ? 'off' : 'available';
        
        return `
            <div class="person-item">
                <span>${person.name} (${person.role_display})</span>
                <span class="person-availability ${statusClass}">${status}</span>
            </div>
        `;
    }).join('');
    
    // Risks for this team
    const risksMarkup = metric.risks.map(risk => {
        const priorityIcon = risk.priority === 0 ? '🔴' : risk.priority === 1 ? '🟠' : '🟡';
        return `
            <div class="risk-item">
                <div class="risk-title">${priorityIcon} ${risk.description}</div>
                <div class="risk-meta">Owner: ${risk.owner} | Due: ${new Date(risk.dueDate).toLocaleDateString('pl-PL')}</div>
            </div>
        `;
    }).join('');
    
    // Goals for this team
    const goalsMarkup = metric.goals.map(goal => {
        const icons = {
            'completed': '✅',
            'in-progress': '🔄',
            'blocked': '⏳',
            'planned': '⏸️'
        };
        const icon = icons[goal.status] || '⏸️';
        return `
            <div class="goal-item">
                <span class="goal-status">${icon}</span>
                ${goal.text}
            </div>
        `;
    }).join('');
    
    // Work Breakdown by Category (Plans vs Actual)
    const params = MOCK_CAPACITY_PARAMS[metric.teamId.toLowerCase()] || 
                   { overhead: 5, scrum: 10, maintenance: 15, bau: 15, projects: 55 };
    const totalCapacity = metric.fteAvailable;
    
    const breakdown = {
        projects: Math.round((params.projects / 100) * totalCapacity * 10) / 10,
        bau: Math.round((params.bau / 100) * totalCapacity * 10) / 10,
        maintenance: Math.round((params.maintenance / 100) * totalCapacity * 10) / 10,
        scrum: Math.round((params.scrum / 100) * totalCapacity * 10) / 10,
        overhead: Math.round((params.overhead / 100) * totalCapacity * 10) / 10
    };
    
    // Calculate actual allocations
    const calculateActualAllocations = (teamId, sprintIdx) => {
        const actual = {
            projects: 0,
            bau: 0,
            maintenance: 0,
            scrum: 0,
            overhead: 0
        };
        
        MOCK_PROJECTS.forEach(proj => {
            if (proj.allocations && proj.allocations[teamId] && proj.allocations[teamId][sprintIdx]) {
                const md = proj.allocations[teamId][sprintIdx];
                if (proj.category === 'project') actual.projects += md;
                else if (proj.category === 'bau') actual.bau += md;
                else if (proj.category === 'maintenance') actual.maintenance += md;
                else if (proj.category === 'scrum') actual.scrum += md;
                else if (proj.category === 'overhead') actual.overhead += md;
            }
        });
        
        return actual;
    };
    
    const actualMD = calculateActualAllocations(metric.teamId.toLowerCase(), currentSprintIdx);
    
    const categoryOrder = ['projects', 'bau', 'maintenance', 'scrum', 'overhead'];
    const categoryLabels = {
        'projects': 'Projects',
        'bau': 'BAU',
        'maintenance': 'Maintenance',
        'scrum': 'Scrum',
        'overhead': 'Overhead'
    };
    const categoryEmoji = {
        'projects': '🎯',
        'bau': '🔧',
        'maintenance': '🛠️',
        'scrum': '👥',
        'overhead': '📋'
    };
    
    // Get active projects for this team in this sprint
    const getActiveProjects = (teamId, sprintIdx) => {
        const active = [];
        MOCK_PROJECTS.forEach(proj => {
            if (proj.allocations && proj.allocations[teamId] && proj.allocations[teamId][sprintIdx] && proj.allocations[teamId][sprintIdx] > 0) {
                active.push({
                    name: proj.name,
                    md: proj.allocations[teamId][sprintIdx],
                    category: proj.category
                });
            }
        });
        return active.sort((a, b) => b.md - a.md); // Sort by allocation descending
    };
    
    const activeProjects = getActiveProjects(metric.teamId.toLowerCase(), currentSprintIdx);
    
    let workBreakdownMarkup = `
        <div class="work-breakdown-header">
            <div class="work-breakdown-header-col">Category</div>
            <div class="work-breakdown-header-col">Plan %</div>
            <div class="work-breakdown-header-col">Plan MD</div>
            <div class="work-breakdown-header-col">Actual %</div>
            <div class="work-breakdown-header-col">Actual MD</div>
            <div class="work-breakdown-header-col">Variance</div>
        </div>
    `;
    
    workBreakdownMarkup += categoryOrder.map(category => {
        const plannedMD = breakdown[category];
        const actualMD_cat = actualMD[category] || 0;
        const plannedPercent = params[category];
        const actualPercent = totalCapacity > 0 ? Math.round((actualMD_cat / totalCapacity) * 100) : 0;
        
        // Oblicz delta %
        const delta = actualPercent - plannedPercent;
        const deltaLabel = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '';
        const warningBadge = delta > 0 ? `⚠️ ${deltaLabel}` : '';
        const hasWarningClass = delta > 0 ? 'has-warning' : '';
        
        return `
            <div class="work-breakdown-item ${hasWarningClass}">
                <!-- 1. Label Column -->
                <div class="work-breakdown-label">
                    <span>${categoryEmoji[category]}</span>
                    <span>${categoryLabels[category]}</span>
                </div>
                
                <!-- 2. Plan % Bar Column -->
                <div class="work-breakdown-bar">
                    ${plannedPercent > 0 ? `
                        <div class="work-breakdown-bar-fill ${category} plan" style="width: ${plannedPercent}%;"></div>
                    ` : ''}
                    <div class="work-breakdown-bar-label">${plannedPercent}%</div>
                </div>
                
                <!-- 3. Plan MD Column -->
                <div class="work-breakdown-value">
                    ${plannedMD.toFixed(1)} MD
                </div>
                
                <!-- 4. Actual % Bar Column -->
                <div class="work-breakdown-bar">
                    ${actualPercent > 0 ? `
                        ${delta >= 0 ? `
                            <!-- Gdy actual >= plan: plan (cyan) + overflow (red) -->
                            <div class="work-breakdown-bar-fill ${category} plan" style="width: ${Math.min(plannedPercent, 100)}%;"></div>
                            ${delta > 0 ? `
                                <div class="work-breakdown-bar-fill ${category} actual-overflow" style="width: ${Math.min(delta, 100 - plannedPercent)}%;" title="Over by ${delta}%"></div>
                            ` : ''}
                        ` : `
                            <!-- Gdy actual < plan: tylko actual (cyan) -->
                            <div class="work-breakdown-bar-fill ${category} plan" style="width: ${Math.min(actualPercent, 100)}%; opacity: 0.7;"></div>
                        `}
                        <div class="work-breakdown-bar-label">${actualPercent}%</div>
                    ` : `
                        <div class="work-breakdown-bar-label">0%</div>
                    `}
                </div>
                
                <!-- 5. Actual MD Column -->
                <div class="work-breakdown-value">
                    ${actualMD_cat.toFixed(1)} MD
                </div>
                
                <!-- 6. Variance Column -->
                <div class="work-breakdown-warning">
                    ${warningBadge}
                </div>
            </div>
        `;
    }).join('');
    
    row.innerHTML = `
        <td colspan="5">
            <div class="details-content">
                <div class="details-section">
                    <h3>📌 Open Projects</h3>
                    ${activeProjects.length > 0 
                        ? activeProjects.map(proj => {
                            const categoryIcon = categoryEmoji[proj.category] || '📦';
                            return `
                                <div class="goal-item">
                                    <span class="goal-status">${categoryIcon}</span>
                                    ${proj.name}
                                    <span style="color: var(--text-secondary); font-size: 11px; margin-left: auto;">
                                        ${proj.md.toFixed(1)} MD
                                    </span>
                                </div>
                            `;
                        }).join('')
                        : '<p style="color: var(--text-secondary); font-size: 12px;">No active projects</p>'
                    }
                </div>
                
                <div class="details-section">
                    <h3>📌 Sprint Goals</h3>
                    ${goalsMarkup || '<p style="color: var(--text-secondary); font-size: 12px;">No goals defined</p>'}
                </div>
                
                <div class="details-section">
                    <h3>⚠️ Open Risks (${metric.risks.length})</h3>
                    ${risksMarkup || '<p style="color: var(--text-secondary); font-size: 12px;">No open risks</p>'}
                </div>
                
                <div class="details-section">
                    <h3>📊 Work Breakdown</h3>
                    <div class="work-breakdown-section">
                        ${workBreakdownMarkup}
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>👥 People (${metric.people.length})</h3>
                    ${peopleMarkup}
                </div>
            </div>
            
            <div class="details-buttons">
                <button class="details-btn primary" onclick="editTeamCapacity('${metric.teamId}')">
                    ⚙️ Edit Capacity
                </button>
                <button class="details-btn" onclick="viewTeamWorkload('${metric.teamId}')">
                    📊 View Workload
                </button>
                <button class="details-btn" onclick="viewTeamRisks('${metric.teamId}')">
                    ⚠️ Risks
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// ===== TOGGLE TEAM DETAILS =====
function toggleTeamDetails(teamId) {
    if (expandedTeams.has(teamId)) {
        expandedTeams.delete(teamId);
    } else {
        expandedTeams.add(teamId);
    }
    
    renderCapacityTable();
}

// ===== EVENT HANDLERS =====
function editTeamCapacity(teamId) {
    alert(`Edycja capacity dla zespołu: ${teamId}\n\nDo zaimplementowania: Modal z parametrami pojemności`);
}

function viewTeamWorkload(teamId) {
    alert(`Widok obciążenia dla zespołu: ${teamId}\n\nDo zaimplementowania w głównej aplikacji`);
}

function viewTeamRisks(teamId) {
    alert(`Ryzyka dla zespołu: ${teamId}\n\nDo zaimplementowania w głównej aplikacji`);
}

// ===== UPDATE SPRINT INFO =====
function updateSprintInfo() {
    const sprintInfo = document.getElementById('sprint-info');
    if (sprintInfo && sprints && sprints.length > 0) {
        const sprint = sprints[currentSprintIdx];
        const label = currentSprintIdx === 0 ? '📌 Current' : '⏭️ Next';
        sprintInfo.textContent = `${label} Sprint: ${sprint.name} (${sprint.dates})`;
    }
}

// ===== INITIALIZE =====
function init() {
    console.log('Initializing Squad Lead Dashboard...');
    
    // Load sprints
    sprints = getSprints();
    console.log(`Loaded ${sprints.length} sprints:`, sprints);
    
    // Set initial sprint info
    updateSprintInfo();
    
    // Generate metrics for current sprint
    teamMetrics = generateTeamMetrics(MOCK_PROJECTS, TEAMS, MOCK_CAPACITY_PARAMS, currentSprintIdx);
    
    console.log(`Generated metrics for ${teamMetrics.length} teams:`);
    console.log(teamMetrics);
    
    // Render
    renderCapacityTable();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
