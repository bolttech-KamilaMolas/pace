/**
 * SHARED UTILITIES
 * Funkcje helper dla wszystkich modułów
 */

// ===== CAPACITY CALCULATIONS =====
function getWorkingDaysInWeek(weekStart) {
    let workingDays = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        
        // Exclude weekends
        if (d.getDay() !== 0 && d.getDay() !== 6) {
            // Friday = 0.65 factor
            if (d.getDay() === 5) {
                workingDays += FRIDAY_FACTOR;
            } else {
                workingDays += 1;
            }
        }
    }
    return workingDays;
}

function getCapacity(teamId, weekIdx, excludePublicHolidays = true) {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return 0;
    
    const weekStart = getWeekStart(weekIdx);
    let capacity = getWorkingDaysInWeek(weekStart) * team.base_capacity / 5;
    
    // TODO: Subtract public holidays
    
    return capacity;
}

function countWorkDaysInRange(start, end) {
    let workDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
        if (current.getDay() !== 0 && current.getDay() !== 6) {
            if (current.getDay() === 5) {
                workDays += FRIDAY_FACTOR;
            } else {
                workDays += 1;
            }
        }
        current.setDate(current.getDate() + 1);
    }
    
    return workDays;
}

// ===== DATE HELPERS =====
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function isWeekend(d) {
    return d.getDay() === 0 || d.getDay() === 6;
}

function isFriday(d) {
    return d.getDay() === 5;
}

function isHoliday(dateKey) {
    for (const [year, holidays] of Object.entries(PUBLIC_HOLIDAYS)) {
        if (holidays.some(h => h.date === dateKey)) {
            return true;
        }
    }
    return false;
}

function isCompanyOff(dateKey, companyDaysOff = []) {
    return companyDaysOff.some(d => d.date === dateKey);
}

function isPersonOff(personName, dateKey, personTimeOff = {}) {
    if (!personTimeOff[personName]) return false;
    return personTimeOff[personName][dateKey] === true;
}

function getDayStatus(personName, d, companyDaysOff = [], personTimeOff = {}) {
    const dateKey = formatDateKey(d);
    
    if (isWeekend(d)) return 'weekend';
    if (isHoliday(dateKey)) return 'holiday';
    if (isCompanyOff(dateKey, companyDaysOff)) return 'company-off';
    if (isPersonOff(personName, dateKey, personTimeOff)) return 'person-off';
    if (isFriday(d)) return 'friday';
    
    return 'available';
}

// ===== CAPACITY CALCULATIONS (ADVANCED) =====
function calcCapacityForWeeks(teamId, weekIndices, capacityParams = {}) {
    let total = 0;
    for (const idx of weekIndices) {
        total += getCapacity(teamId, idx);
    }
    
    // Substract overhead/scrum/maintenance
    const overhead = capacityParams.overhead || 0.1;
    const scrum = capacityParams.scrum || 0.1;
    const maintenance = capacityParams.maintenance || 0.15;
    
    const deductible = total * (overhead + scrum + maintenance);
    return total - deductible;
}

function calcMonthCapacity(personName, year, month, capacityParams = {}) {
    const daysInMonth = getDaysInMonth(year, month);
    let capacity = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const status = getDayStatus(personName, d);
        
        if (status === 'available') {
            if (isFriday(d)) {
                capacity += FRIDAY_FACTOR;
            } else {
                capacity += 1;
            }
        }
    }
    
    return capacity * 8; // 8h per day
}

// ===== SPRINT UTILITIES =====
function parseSprintDatesForSort(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split(' to ');
    if (parts.length !== 2) return null;
    const startStr = parts[0].trim();
    const date = new Date(startStr);
    return date.getTime();
}

function getSprintWeekIndices(sprint, baseDate = BASE_DATE) {
    const { start, end } = parseSprintDates(sprint.dates);
    const startIdx = Math.floor((start - baseDate) / (7 * 24 * 60 * 60 * 1000));
    const endIdx = Math.floor((end - baseDate) / (7 * 24 * 60 * 60 * 1000));
    
    const indices = [];
    for (let i = startIdx; i <= endIdx; i++) {
        indices.push(i);
    }
    return indices;
}

function findSprintForDate(weekStart, sprints = []) {
    for (const sprint of sprints) {
        const { start, end } = parseSprintDates(sprint.dates);
        if (weekStart >= start && weekStart <= end) {
            return sprint;
        }
    }
    return null;
}

// ===== STRING UTILITIES =====
function truncate(str, maxLen = 30) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ===== DOM UTILITIES =====
function addClass(element, className) {
    element?.classList.add(className);
}

function removeClass(element, className) {
    element?.classList.remove(className);
}

function toggleClass(element, className) {
    element?.classList.toggle(className);
}

function setAttr(element, attr, value) {
    element?.setAttribute(attr, value);
}

function getAttr(element, attr) {
    return element?.getAttribute(attr);
}

// ===== RENDERING UTILITIES =====
function createElement(tag, className = '', html = '', attributes = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html) el.innerHTML = html;
    Object.entries(attributes).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });
    return el;
}

function renderCapacityBar(actual, capacity, teamName) {
    const percentage = capacity > 0 ? (actual / capacity) * 100 : 0;
    const status = percentage > 100 ? 'critical' : percentage > 80 ? 'warning' : 'ok';
    
    return `
        <div class="capacity-row">
            <div class="team-name">${teamName}</div>
            <div class="bar-track">
                <div class="bar-fill ${status}" style="width: ${Math.min(percentage, 100)}%">
                    <div class="bar-label">${Math.round(percentage)}%</div>
                </div>
            </div>
            <div class="pct">${Math.round(percentage)}%</div>
        </div>
    `;
}

function formatNumber(num, decimals = 0) {
    return num.toFixed(decimals);
}

function colorizeStatus(status) {
    const colors = {
        'in-progress': '#00BAC7',
        'done': '#10b981',
        'at-risk': '#ef4444',
        'on-hold': '#f59e0b',
        'blocked': '#ef4444',
        'planned': '#8b5cf6'
    };
    return colors[status] || '#94a3b8';
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getWorkingDaysInWeek, getCapacity, countWorkDaysInRange,
        getDaysInMonth, isWeekend, isFriday, isHoliday, isCompanyOff, isPersonOff, getDayStatus,
        calcCapacityForWeeks, calcMonthCapacity,
        parseSprintDatesForSort, getSprintWeekIndices, findSprintForDate,
        truncate, capitalize,
        addClass, removeClass, toggleClass, setAttr, getAttr,
        createElement, renderCapacityBar, formatNumber, colorizeStatus
    };
}
