# Teams Calendar Enhancements — Specification

**Status**: Design Phase  
**Affected Pages**: Settings (Days Off, People tabs), Teams Calendar page  
**i18n Required**: Yes (PL/EN)  
**Storage**: localStorage (`cp_teams_data`, `cp_people`)  

---

## Overview

Enhance the Teams Calendar to be a key leadership tool by adding:
1. **Public holidays import** (Poland 2026+)
2. **Partial availability/employment type** (100%, 50%, part-time)
3. **Planned trainings** (date ranges, daily hours reduction)
4. **"Availability per Role" view** (aggregated capacity by role across teams)

---

## 1. Public Holidays Management

### Current State
- Hardcoded `POLISH_HOLIDAYS_2026` array in `app.js` (line 3087)
- Holidays treated as "off" with gray background in calendar

### Enhancement: Settings → Days Off Tab

**New UI Section: "Święta publiczne" (Public Holidays)**

```
┌─────────────────────────────────────────────────────┐
│ Święta publiczne [Importuj 2026] [Importuj 2027]   │
├─────────────────────────────────────────────────────┤
│ ✓ 2026-01-01 — Nowy Rok                        [×]  │
│ ✓ 2026-01-06 — Trzech Króli                    [×]  │
│ ✓ 2026-04-05 — Wielkanoc                       [×]  │
│ ...                                                  │
│ [Dodaj nowe święto]                                │
│ Data: [YYYY-MM-DD] Nazwa: [_______________] [+]    │
└─────────────────────────────────────────────────────┘
```

**Data Model**:
```javascript
publicHolidays: {
  '2026': [
    { date: '2026-01-01', name_pl: 'Nowy Rok', name_en: 'New Year' },
    { date: '2026-01-06', name_pl: 'Trzech Króli', name_en: 'Epiphany' },
    // ...
  ],
  '2027': [ /* similar */ ]
}
```

**Storage**: `cp_public_holidays` in localStorage (merge with `cp_teams_data`)

**Functionality**:
- Load predefined holidays for Poland 2026-2028 on Settings open
- User can add custom holidays (e.g., company-specific)
- Remove button to delete holidays
- Import button pre-fills from constants

**Updated getDayStatus()**:
```javascript
function getDayStatus(personName, date) {
  // ... existing checks ...
  if (isPublicHoliday(date)) return { status: 'holiday', factor: 0 };
  // ... rest of logic
}
```

---

## 2. Partial Availability / Employment Type

### Current State
- PEOPLE objects have: `name`, `role`, `team`, `projects`
- No employment type or availability percentage

### Enhancement: Settings → People Tab

**New Fields in PEOPLE Object**:
```javascript
{
  name: string,
  role: string,
  team: string,
  projects: string[],
  // NEW FIELDS:
  employmentType: 'full-time' | 'half-time' | 'part-time' | 'contractor',
  availability: number,  // 0-100 (percentage, default 100)
  availabilityFrom?: date,  // Optional: when partial availability starts
  availabilityTo?: date    // Optional: when it ends
}
```

**Predefined Types**:
```javascript
const EMPLOYMENT_TYPES = {
  'full-time': { value: 'full-time', label_pl: 'Pełna zatrudnienie', label_en: 'Full-time', availability: 100 },
  'half-time': { value: 'half-time', label_pl: 'Pół etatu', label_en: 'Half-time', availability: 50 },
  'part-time': { value: 'part-time', label_pl: 'Część etatu', label_en: 'Part-time', availability: 25 },
  'contractor': { value: 'contractor', label_pl: 'Kontraktor', label_en: 'Contractor', availability: 100 }
};
```

**Settings UI: People Tab Enhancement**

When editing person (click edit icon), show modal:
```
┌──────────────────────────────────────────────┐
│ Edytuj: Kamila Molas                         │
├──────────────────────────────────────────────┤
│ Rola:         [Squad Lead               ▼]  │
│ Zespół:       [ALF                      ▼]  │
│ Typ zatrudnienia: [Pełna zatrudnienie   ▼]  │
│ Dostępność:   [100] %                        │
│ Od:           [YYYY-MM-DD]  Do: [YYYY-MM-DD]│
│ Uwagi:        [________________________...]   │
├──────────────────────────────────────────────┤
│         [Anuluj] [Zapisz]                    │
└──────────────────────────────────────────────┘
```

**Functionality**:
- Default `availability: 100` for all new people
- When employment type changes, auto-set availability % (but allow override)
- Optional date range (if empty = applies permanently)
- Note field for context (e.g., "Macierz projekt ends 2026-09-30")

**Updated getDayStatus()**:
```javascript
function getDayStatus(personName, date) {
  const person = PEOPLE.find(p => p.name === personName);
  let baseFactor = 1.0;  // 100%
  
  // Apply partial availability for date range
  if (person.availabilityFrom && person.availabilityTo) {
    const d = new Date(date);
    const from = new Date(person.availabilityFrom);
    const to = new Date(person.availabilityTo);
    if (d >= from && d <= to) {
      baseFactor = (person.availability || 100) / 100;
    }
  } else if (person.availability && person.availability !== 100) {
    baseFactor = person.availability / 100;  // Permanent
  }
  
  // Then apply day status multipliers (Friday, off, etc.)
  // ...existing logic...
  return { status, factor: baseFactor * dayMultiplier };
}
```

---

## 3. Planned Trainings Management

### Current State
- Trainings/workshops treated as generic "off" in personTimeOff
- No way to specify daily hours or type of training

### Enhancement: Settings → Days Off Tab

**New UI Section: "Planowane szkolenia" (Planned Trainings)**

```
┌─────────────────────────────────────────────────────┐
│ Planowane szkolenia                                 │
├─────────────────────────────────────────────────────┤
│ Osoba:     [All Team Members         ▼]            │
│ Od:        [YYYY-MM-DD]  Do: [YYYY-MM-DD]         │
│ Godziny/dzień: [8] h  Typ: [Internal  ▼]          │
│ Opis:      [________________________________________]│
│                         [+ Dodaj szkolenie]        │
│                                                     │
│ Szkolenia na liście:                               │
│ • Kamila Molas — Python Advanced (2026-09-01 to   │
│   2026-09-05, 6h/day) [Edytuj] [×]                │
└─────────────────────────────────────────────────────┘
```

**Data Model**:
```javascript
trainings: [
  {
    id: string,
    personName: string,
    dateFrom: '2026-09-01',
    dateTo: '2026-09-05',
    hoursPerDay: 6,        // How many hours away from work
    trainingType: 'internal' | 'external' | 'conference',
    description: 'Python Advanced',
    status: 'planned' | 'completed' | 'cancelled'
  }
]
```

**Storage**: `cp_trainings` in localStorage

**Calculation Impact**:
When training is active, reduce availability by (hoursPerDay / 8) or (hoursPerDay / standard_work_hours):
```javascript
const availabilityFactor = 1.0 - (training.hoursPerDay / 8.0);
// Example: 6h training → factor = 0.25 (person has 2h available)
```

**Updated getDayStatus()**:
```javascript
function getDayStatus(personName, date) {
  // ... existing checks ...
  
  // Check for active training
  const training = trainings.find(t => 
    t.personName === personName &&
    new Date(date) >= new Date(t.dateFrom) &&
    new Date(date) <= new Date(t.dateTo)
  );
  if (training) {
    const trainingFactor = 1.0 - (training.hoursPerDay / 8.0);
    return { status: 'training', factor: trainingFactor };
  }
  
  // ... rest of logic
}
```

**Calendar Legend Update**:
Add new color for trainings (e.g., light blue):
```
┌──────────────────────────────────────┐
│ ◾ Dostępny                           │
│ ◾ Piątek (65%)                       │
│ ◾ Nieobecność                        │
│ ◾ Dzień wolny firmy                  │
│ ◾ Święto                             │
│ ◾ Szkolenie (XX% dostępu)  ← NEW    │
│ ◾ Weekend                            │
└──────────────────────────────────────┘
```

---

## 4. Availability Per Role View

### Current State
- Teams Calendar shows: All Teams Overview (grid by person) OR Single Team (grid by person)
- No aggregated view by role

### Enhancement: Teams Calendar → New Tab/View

**New Navigation in renderTeams()**:
```
Teams Calendar
├─ All Teams (current)
├─ Single Team  [ALF ▼]
└─ By Role      ← NEW: Shows aggregated capacity by role across all teams
```

**UI Layout: "Dostępność per rola"**

```
┌─────────────────────────────────────────────────────────┐
│ Mapa dostępności per rola | (sierpień 2026)           │
├─────────────────────────────────────────────────────────┤
│                    Lp  Wt  Śr  Cz  Pt  So  Nd  RAZEM   │
├─────────────────────────────────────────────────────────┤
│ Squad Lead        5   5   5   5   3   0   0    28 MD   │
│ BE Developer     15  15  15  15   9   0   0    84 MD   │
│ FE Developer      8   8   8   8   5   0   0    45 MD   │
│ System Analyst    6   6   6   6   4   0   0    32 MD   │
│ QA                12  12  12  12   8   0   0    68 MD  │
│ TSM               3   3   3   3   2   0   0    16 MD   │
│ Engineering Mgr   1   1   1   1   1   0   0     5 MD   │
├─────────────────────────────────────────────────────────┤
│ RAZEM             50  50  50  50  32   0   0   278 MD  │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
```javascript
function renderTeamsCalendarByRole(days, dayNames, year, month) {
  const roles = [...new Set(PEOPLE.map(p => p.role))].sort(
    (a, b) => (ROLE_SORT_ORDER[a] || 99) - (ROLE_SORT_ORDER[b] || 99)
  );
  
  let html = '<table class="cal-table"><thead><tr>';
  html += '<th>Rola</th>';
  days.forEach(d => {
    html += `<th>${d.getDate()}<br>${dayNames[d.getDay()]}</th>`;
  });
  html += '<th>MD</th></tr></thead><tbody>';
  
  let totalByDay = days.map(() => 0);
  
  // For each role
  roles.forEach(role => {
    const people = PEOPLE.filter(p => p.role === role);
    let roleTotal = 0;
    
    html += `<tr class="role-row"><td>${role}</td>`;
    
    days.forEach((d, i) => {
      let dayTotal = 0;
      people.forEach(p => {
        const { factor } = getDayStatus(p.name, d);
        dayTotal += factor;
      });
      totalByDay[i] += dayTotal;
      roleTotal += dayTotal;
      html += `<td><span class="cap-value">${dayTotal.toFixed(1)}</span></td>`;
    });
    
    html += `<td><span class="cap-value">${roleTotal.toFixed(1)}</span></td>`;
    html += '</tr>';
  });
  
  // Totals row
  html += `<tr class="cal-capacity-row"><td>RAZEM</td>`;
  let grandTotal = 0;
  totalByDay.forEach(t => {
    grandTotal += t;
    html += `<td><span class="cap-value">${t.toFixed(1)}</span></td>`;
  });
  html += `<td><span class="cap-value">${grandTotal.toFixed(1)}</span></td></tr>`;
  html += '</tbody></table>';
  
  return html;
}
```

**Navigation**: Add radio buttons or tabs:
```
┌─────────────────────────────────┐
│ ○ Wszystkie zespoły             │
│ ○ Zespół: [ALF ▼]              │
│ ◉ Per rola                      │
│ Miesiąc: [Sierpień 2026 ◄ ►]  │
└─────────────────────────────────┘
```

---

## 5. Implementation Priority & Dependencies

### Phase 1: Public Holidays Import (1-2h)
- Add predefined holidays for 2026-2028
- Update Settings → Days Off tab
- Update getDayStatus() to check holidays
- **No blocking dependencies**

### Phase 2: Partial Availability (2-3h)
- Extend PEOPLE model with `employmentType`, `availability`, date range
- Create edit person modal in Settings
- Update getDayStatus() for availability multiplier
- Update calendar display (optional: show availability % in person row)
- **Depends on**: Phase 1 logic in getDayStatus()

### Phase 3: Planned Trainings (2-3h)
- Create trainings management UI in Settings → Days Off
- Extend getDayStatus() for training factor calculation
- Update calendar legend
- **Depends on**: Phase 2 (uses getDayStatus() which includes partial availability)

### Phase 4: Availability Per Role View (1-2h)
- Add new rendering function: renderTeamsCalendarByRole()
- Update renderTeams() to support 3 view modes
- Add navigation tabs/radio in renderTeams()
- **Depends on**: Phase 1-3 (uses updated getDayStatus())

---

## 6. i18n Translation Keys (New)

### Settings → Days Off Tab
```javascript
'settings.publicHolidays': { pl: 'Święta publiczne', en: 'Public Holidays' },
'settings.importHolidays': { pl: 'Importuj 2026', en: 'Import 2026' },
'settings.addHoliday': { pl: 'Dodaj nowe święto', en: 'Add holiday' },
'settings.holidayDate': { pl: 'Data', en: 'Date' },
'settings.holidayName': { pl: 'Nazwa', en: 'Name' },

'settings.plannedTrainings': { pl: 'Planowane szkolenia', en: 'Planned Trainings' },
'settings.trainingPerson': { pl: 'Osoba', en: 'Person' },
'settings.trainingDateRange': { pl: 'Od – Do', en: 'From – To' },
'settings.trainingHoursPerDay': { pl: 'Godzin dziennie', en: 'Hours per day' },
'settings.trainingType': { pl: 'Typ', en: 'Type' },
'settings.trainingDescription': { pl: 'Opis', en: 'Description' },
'settings.addTraining': { pl: 'Dodaj szkolenie', en: 'Add training' },

'settings.employmentType': { pl: 'Typ zatrudnienia', en: 'Employment Type' },
'settings.availability': { pl: 'Dostępność (%)', en: 'Availability (%)' },
'settings.availabilityRange': { pl: 'Dostępność w okresie:', en: 'Availability in period:' },

'emptype.fulltime': { pl: 'Pełna zatrudnienie', en: 'Full-time' },
'emptype.halftime': { pl: 'Pół etatu', en: 'Half-time' },
'emptype.parttime': { pl: 'Część etatu', en: 'Part-time' },
'emptype.contractor': { pl: 'Kontraktor', en: 'Contractor' },

'trainingtype.internal': { pl: 'Wewnętrzne', en: 'Internal' },
'trainingtype.external': { pl: 'Zewnętrzne', en: 'External' },
'trainingtype.conference': { pl: 'Konferencja', en: 'Conference' },
```

### Calendar Legend
```javascript
'cal.training': { pl: 'Szkolenie', en: 'Training' },
'cal.holiday': { pl: 'Święto', en: 'Holiday' },
```

### Teams Calendar View Mode
```javascript
'cal.viewAllTeams': { pl: 'Wszystkie zespoły', en: 'All Teams' },
'cal.viewSingleTeam': { pl: 'Zespół', en: 'Team' },
'cal.viewByRole': { pl: 'Per rola', en: 'By Role' },
'cal.availabilityPerRole': { pl: 'Dostępność per rola', en: 'Availability Per Role' },
```

---

## 7. File Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `app.js` | Add EMPLOYMENT_TYPES, POLISH_HOLIDAYS_2026+ constants; extend PEOPLE model; update getDayStatus(); enhance renderTeams() for 3 views; add renderTeamsCalendarByRole(); add trainings management functions | ~400-500 |
| `project-constants.js` | Add EMPLOYMENT_TYPES constant (optional, can stay in app.js) | ~10 |
| `i18n.js` | Add 20+ new translation keys (see section 6) | ~30 |
| `index.html` | Add modals for editing person (employment type), editing training | ~50 |

---

## 8. Testing Checklist

- [ ] Public holidays display gray in all calendar views
- [ ] Can add/remove/import holidays via Settings
- [ ] Person with 50% availability shows 4 MD/day instead of 8
- [ ] Training period shows blue/training color, reduces availability by hours/8
- [ ] "By Role" view aggregates all people by role across teams correctly
- [ ] Monday-Thursday = 100%, Friday = 65% (FRIDAY_FACTOR), Weekend = 0%
- [ ] All calculations work for partial + training overlaps
- [ ] i18n switches translate all new UI strings
- [ ] localStorage persists all new data across page reloads

---

## Next Steps

1. **User Confirmation**: Validate this spec matches intended behavior
2. **Phase 1 Implementation**: Public holidays (lowest risk, high value)
3. **Phase 2-4**: Sequential implementation with testing between each phase
4. **UAT**: Test with real team data (actual holidays, trainings, partial staff)

