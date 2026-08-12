# SQUAD LEAD MODULE

## 📌 PRZEGLĄD

**Squad Lead** to dashboard dla liderów technicznych - pokazuje:

1. **Capacity Overview** 🎯 - Pojemność każdego zespołu (FTE, utilization %)
2. **Team Health** 💚 - Status zdrowotny zespołu (Green/Amber/Red)
3. **Sprint Goals** 🏁 - Cele dla obecnego sprintu per team
4. **Risk Panel** ⚠️ - Otwarte ryzyka per team
5. **People Availability** 👥 - Kto jest dostępny / niedostępny
6. **Team Capacity Editor** ⚙️ - Edycja parametrów pojemności

---

## 🎯 FUNKCJONALNOŚĆ

### Sekcja 0: Sprint Selector 🎯
```
┌─────────────────────────────────────────┐
│  👨‍💼 Squad Lead Dashboard                 │
│                                         │
│  [📌 Current Sprint] [⏭️ Next Sprint]   │
│                                         │
│  📌 Current Sprint: Sprint 277          │
│  (01.12 - 12.12)                        │
└─────────────────────────────────────────┘
```

**Funkcjonalność:**
- Klikni "Current Sprint" → Wyświetla metryki dla bieżącego sprintu
- Klikni "Next Sprint" → Wyświetla metryki dla następnego sprintu
- Przyciski się zmieniają (active/inactive style)
- Sprint info poniżej pokazuje wybrany sprint + daty

**Zmiana sprintu:**
1. Regeneruje metryki dla nowego sprintu
2. Przelicza utilization dla wybranego sprintu
3. Odświeża tabelę capacity
4. Zmienia informacje o celach, ludziach, ryzykach per sprint
Tabela: Team | FTE Available | Allocated | Utilization | Status

```
Team       | FTE Avail | Allocated | Util% | Status
-----------|-----------|-----------|-------|--------
ALF        | 32 MD     | 28 MD     | 88%   | 🟢 OK
QA         | 16 MD     | 18 MD     | 113%  | 🔴 OVER
Backend    | 24 MD     | 20 MD     | 83%   | 🟢 OK
Frontend   | 24 MD     | 24 MD     | 100%  | 🟠 HIGH
DevOps     | 8 MD      | 6 MD      | 75%   | 🟢 OK
```

**Każdy row clickable** → ekspanduje Team Details

---

### Sekcja 1.5: Work Breakdown by Category 📊
```
WORK BREAKDOWN BY CATEGORY

┌──────────────────────────────────┐
│ ALF (32 MD)                      │
├──────────────────────────────────┤
│ 🎯 Projects   [██████░░] 56% 17.9 MD
│ 🔧 BAU        [████░░░░] 21%  6.7 MD
│ 🛠️  Maintenance[███░░░░░]  9%  2.9 MD
│ 👥 Scrum      [██░░░░░░]  9%  2.9 MD
│ 📋 Overhead   [░░░░░░░░]  5%  1.6 MD
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ QA (16 MD)                       │
├──────────────────────────────────┤
│ 🎯 Projects   [███░░░░░░] 20%  3.2 MD
│ 🔧 BAU        [████████░] 40%  6.4 MD
│ 🛠️  Maintenance[████████░] 25%  4.0 MD
│ 👥 Scrum      [██░░░░░░]  10%  1.6 MD
│ 📋 Overhead   [░░░░░░░░]  5%  0.8 MD
└──────────────────────────────────┘

... (per team)
```

**Co widać:**
- Każdy zespół ma kartę z rozkładem pojemności
- % alokacji per kategoria + liczba MD
- Kolorowe paski: 🎯 Projekty (Blue), 🔧 BAU (Orange), 🛠️ Maintenance (Purple), 👥 Scrum (Teal), 📋 Overhead (Gray)
- Oparte na CAPACITY_PARAMS z app.js

**Kategorie:**
| Kategoria | Emoji | Kolor | Znaczenie |
|-----------|-------|-------|-----------|
| Projects | 🎯 | Blue | Prace projektowe |
| BAU | 🔧 | Orange | Business as Usual |
| Maintenance | 🛠️ | Purple | Utrzymanie systemów |
| Scrum | 👥 | Teal | Ceremonie scrumowe |
| Overhead | 📋 | Gray | Zarządzanie, admin |

---

### Sekcja 2: Team Details (Expandable)
```
▼ ALF Team Details
  Sprint: Sprint 1 (Jan 6-17)
  
  Goals this sprint:
  ✅ Complete ALF Portal MVP
  🔄 In Progress: DB migration
  ⏳ Blocked: API spec from OCS
  
  People:
  • John Doe (Senior) - Available
  • Jane Smith (Mid) - Off (Jan 13-15)
  • Bob Wilson (Junior) - Available
  
  Risks:
  ⚠️ DB Performance - Owner: Jane - Due: Jan 15
  ⚠️ Scope creep - Owner: John - Due: Jan 20
  
  [ EDIT CAPACITY ]  [ VIEW WORKLOAD ]  [ VIEW RISKS ]
```

---

### Sekcja 3: Sprint Goals (per team)
```
Current Sprint: Jan 6-17

ALF Team:
  ✅ ALF Portal MVP
  🔄 DB migration
  ⏳ Waiting on API spec

QA Team:
  ✅ Test automation
  🔄 Performance testing
  ⏳ Blocked by backend
```

---

### Sekcja 4: Risk Panel
```
Open Risks (sorted by priority)

🔴 Critical:
  DB Performance (ALF) - Owner: Jane - Due: Jan 15
  Auth vulnerability (Backend) - Owner: Alice - Due: Jan 12

🟠 High:
  Scope creep (ALF) - Owner: John - Due: Jan 20
  API performance (Backend) - Owner: Bob - Due: Jan 18
```

---

### Sekcja 5: People Availability
```
Current Sprint (Jan 6-17): 10 working days

ALF Team:
  John Doe    | ✅✅✅✅✅ ✅✅✅✅✅ | Available
  Jane Smith  | ✅✅✅🔴🔴 ✅✅✅✅✅ | -1 days
  Bob Wilson  | ✅✅✅✅✅ ✅✅✅✅✅ | Available

QA Team:
  [...]
```

---

## 📊 STRUKTURA DANYCH

### INPUT DATA:
```javascript
{
    teams: [
        {
            id: 'alf',
            name: 'ALF',
            base_capacity: 32,
            color: '#00BAC7',
            lead: 'John Doe'
        }
    ],
    
    projects: [
        {
            id: 1,
            teams: ['alf', 'qa'],
            allocations: { alf: { 0: 8, 1: 8 }, qa: { 0: 2, 1: 2 } }
        }
    ],
    
    people: [
        { name: 'John Doe', team: 'alf', role: 'lead' }
    ],
    
    sprints: [
        { id: 'sprint-1', dates: '2026-01-06 to 2026-01-17', name: 'Sprint 1' }
    ],
    
    sprint_goals: {
        'sprint-1': {
            'alf': ['Complete MVP', 'DB migration', 'Waiting on API']
        }
    },
    
    person_time_off: {
        'Jane Smith': { '2026-01-13': true, '2026-01-14': true }
    },
    
    capacity_params: {
        'alf': { overhead: 0.1, scrum: 0.1, maintenance: 0.15 }
    }
}
```

### OUTPUT (Squad Lead State):
```javascript
{
    teamMetrics: [
        {
            teamId: 'alf',
            teamName: 'ALF',
            fteAvailable: 32,
            allocated: 28,
            utilization: 0.875,  // 87.5%
            status: 'ok',  // ok, high, overloaded
            lead: 'John Doe'
        }
    ],
    
    sprintGoals: { ... },
    
    teamRisks: { ... },
    
    peopleAvailability: { ... }
}
```

---

## 🔗 ZALEŻNOŚCI

| Zależność | Skąd | Jak używamy |
|-----------|------|-----------|
| TEAMS | shared/constants.js | Nazwy, kolory, base_capacity |
| PEOPLE | mock-data.js | Lista osób per team |
| PROJECTS | mock-data.js | Alokacje |
| SPRINTS | mock-data.js | Bieżący sprint + daty |
| getCapacity() | shared/utils.js | Obliczenie pojemności |
| getDayStatus() | shared/utils.js | Status dostępności |
| sprint_goals | localStorage cp_sprint_goals | Cele per sprint per team |
| capacity_params | localStorage cp_settings | Parametry pojemności |

---

## 📝 FUNKCJE

### `generateTeamMetrics(projects, teams, capacityParams, currentSprintIdx)`
Oblicza metryki zdrowotności dla każdego zespołu.

**Returns:** `teamMetrics[]`

### `renderSquadLead(containerId, teamMetrics, teams, people, sprints, sprintGoals, risks)`
Renderuje HTML dashboardu.

### `expandTeamDetails(teamId, metrics)`
Ekspanduje szczegóły zespołu.

### `openTeamCapacityEditor(teamId, team)`
Otw Modal do edycji capacity parameters.

### `saveTeamCapacity(teamId, params)`
Zapisuje zmiany pojemności.

---

## 🎨 DESIGN

```
┌─────────────────────────────────────────────────────┐
│  SQUAD LEAD                                         │
│  Current Sprint: Sprint 1 (Jan 6-17)               │
├─────────────────────────────────────────────────────┤
│  CAPACITY OVERVIEW                                  │
├─────────────────────────────────────────────────────┤
│  Team       | FTE Avail | Allocated | Util% | Status│
│  ─────────────────────────────────────────────────  │
│  ▼ ALF      | 32 MD     | 28 MD     | 88%   | 🟢   │
│    └─ [DETAILS BELOW]                              │
│  QA         | 16 MD     | 18 MD     | 113%  | 🔴   │
│  Backend    | 24 MD     | 20 MD     | 83%   | 🟢   │
│  Frontend   | 24 MD     | 24 MD     | 100%  | 🟠   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ALF TEAM DETAILS                                   │
│                                                     │
│  Sprint Goals:                                      │
│  ✅ Complete MVP                                    │
│  🔄 DB migration                                    │
│  ⏳ Waiting on API spec                            │
│                                                     │
│  People:                                            │
│  • John Doe (Lead) - ✅ Available                   │
│  • Jane Smith (Mid) - 🔴 Off (Jan 13-15)           │
│  • Bob Wilson (Junior) - ✅ Available              │
│                                                     │
│  Risks:                                             │
│  🔴 DB Performance - Jane - Due: Jan 15             │
│  🟠 Scope creep - John - Due: Jan 20                │
│                                                     │
│  [ EDIT CAPACITY ]  [ VIEW WORKLOAD ]  [ RISKS ]   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [QA TEAM - similar collapsed]                      │
│  [BACKEND TEAM - similar]                           │
│  [FRONTEND TEAM - similar]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 STATUS

- [ ] **HTML Layout** - struktura gotowa
- [ ] **generateTeamMetrics()** - logika
- [ ] **renderSquadLead()** - rendering
- [ ] **Team expand/collapse** - toggle details
- [ ] **Edit capacity modal** - edycja
- [ ] **Mock data** - test data
- [ ] **Testing** - otwiera się bez błędów
- [ ] **Responsive** - wygląda dobrze
- [ ] **Accessibility** - WCAG AA

---

## 📦 PLIKI

- **squadlead.html** - Standalone view
- **squadlead.js** - Logic + rendering
- **mock-data.js** - Test data
- **README.md** - Ta dokumentacja

---

## 🔄 INTEGRACJA Z MAIN APP

Gdy moduł będzie gotowy, wciągnąć do `app.js`:

1. Import `generateTeamMetrics()` z modułu
2. W `showPage('squadlead')`: wywoła `renderSquadLead()`
3. Fix bug w showPage (linia 7196) - powinno być `renderSquadLead()` zamiast `renderSprintAvailability()`

---

## 📞 PYTANIA

- Czy capacity_params przechowywane są per team?
- Czy Sprint Goals przechowywane w localStorage?
- Czy risks pobierane z PROJECTS.risks?
