# ACTION CENTER MODULE

## 📌 PRZEGLĄD

**Action Center** to pulpit poleceń dla leadership - automatycznie wyświetla pilne akcje do zrobienia, pogrupowane wg kategorii:

1. **Red Projects** 🔴 - Projekty w kryzysie (health: red lub at-risk)
2. **Blocked Projects** 🚫 - Zablokowane projekty czekające na decyzję
3. **Overloaded Teams** 👥 - Zespoły pracujące >100% capacity
4. **High Risks** ⚠️ - Otwarte ryzyka wysokiego priorytetu
5. **Owner-less** 👤 - Akcje bez wyznaczonego właściciela
6. **Custom Alerts** 🔔 - User-defined alerty

---

## 🎯 FUNKCJONALNOŚĆ

### Dla każdej akcji wyświetlamy:
- **Icon** + **Typ** - kategoria akcji
- **Opis** - co dokładnie trzeba zrobić
- **Owner** - komu przydzielić
- **Due Date** - deadline
- **Priority** - priorytet (P0-P4)
- **Action Button** - Otwórz projekt / Przydziel sobie

### Filtry (opcjonalne):
- Pokaż wszystko / Tylko P0-P1
- Pokaż wszystko / Tylko dla mnie
- Pokaż wszystko / Tylko overdue

---

## 📊 STRUKTURA DANYCH

### INPUT DATA (z localStorage lub mock):
```javascript
{
    projects: [
        {
            id: 1,
            name: "ALF Portal",
            status: "at-risk",  // not_started, in-progress, blocked, done
            health: "red",       // green, amber, red
            lead: "John Doe",
            risks: [
                { description: "DB performance", status: "open", priority: 1, dueDate: "2026-01-15", owner: "Jane" }
            ],
            notes: [],
            allocations: { team1: { 0: 8, 1: 8 }, team2: { 0: 4 } },
            owner_decisions: []  // open decisions
        }
    ],
    teams: [
        { id: 'alf', name: 'ALF', base_capacity: 32 }
    ],
    alert_config: {
        show_red_projects: true,
        show_blocked_projects: true,
        show_overloaded_teams: true,
        show_high_risks: true,
        show_ownerless_actions: true,
        custom_alerts: [
            { type: 'custom', description: '...', priority: 1, dueDate: '...' }
        ]
    }
}
```

### OUTPUT (Actions List):
```javascript
[
    {
        id: 'red-project-1',
        type: 'red-project',
        icon: '🔴',
        title: 'Critical: ALF Portal at Risk',
        description: 'Project ALF Portal has health=RED, status=at-risk',
        owner: 'John Doe',
        dueDate: '2026-01-15',
        priority: 0,  // P0 = Critical
        action: 'VIEW_PROJECT',
        projectId: 1
    },
    {
        id: 'overloaded-team-alf',
        type: 'overloaded-team',
        icon: '👥',
        title: 'Overloaded: ALF Team at 115%',
        description: 'ALF team utilization: 115% (36/32 MD). Need to rebalance or extend capacity.',
        owner: null,
        dueDate: null,
        priority: 1,
        action: 'VIEW_WORKLOAD'
    },
    // ...
]
```

---

## 🔗 ZALEŻNOŚCI

| Zależność | Skąd | Jak używamy |
|-----------|------|-----------|
| TEAMS | shared/constants.js | Nazwy zespołów, base_capacity |
| getCapacity() | shared/utils.js | Obliczenie pojemności per team |
| PROJECTS | mock-data.js | Listy projektów, health, status, ryzyka |
| alert_config | localStorage cp_alert_config | Które alerty pokazywać |
| BASE_DATE, TOTAL_WEEKS | shared/constants.js | Obliczenie capacity w bieżącym tygodniu |

---

## 📝 FUNKCJE

### `generateActions(projects, teams, alertConfig, capacityParams)`
Zbiera wszystkie akcje na podstawie konfiguracji alertów.

**Returns:** `actions[]`

### `filterActions(actions, filters)`
Filtruje akcje wg kryteriów (prioritet, owner, overdue).

**Returns:** `filtered_actions[]`

### `renderActionCenter(containerId, actions, callbacks)`
Renderuje HTML listę akcji do kontenera.

**Callbacks:**
- `onActionClick(action)` - obsłuż click na akcję
- `onAssignToMe(action)` - przydziel sobie akcję
- `onViewProject(projectId)` - otwórz projekt

### `handleActionClick(action, callbacks)`
Router dla różnych typów akcji - otwiera projekt, workload, ustawienia itp.

---

## 🎨 DESIGN

```
┌─────────────────────────────────────────────────────┐
│  ACTION CENTER                                      │
├─────────────────────────────────────────────────────┤
│  📊 Summary:                                        │
│  • 3 Red Projects  🔴                              │
│  • 2 Blocked Projects  🚫                          │
│  • 1 Overloaded Team  👥                           │
│  • 5 Open Risks  ⚠️                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🔴 Critical: ALF Portal at Risk                   │
│     Status: At-Risk | Health: Red | Lead: John     │
│     Action needed: Review project, replan scope    │
│     Due: 2026-01-15 | Assigned to: John Doe       │
│     [ VIEW PROJECT ]  [ ASSIGN TO ME ]              │
│                                                     │
│  🚫 Blocked: OCS Integration                       │
│     Status: Blocked | Reason: Waiting for API spec │
│     Owner decision needed: Scope reduction         │
│     [ OPEN DECISION ]  [ ASSIGN TO ME ]             │
│                                                     │
│  👥 Overloaded: ALF Team (115%)                    │
│     Current: 36 MD / 32 MD capacity                │
│     Action: Rebalance or extend                    │
│     [ VIEW WORKLOAD ]                               │
│                                                     │
│  ⚠️  High Risk: DB Performance                     │
│     Project: ALF Portal | Owner: Jane Smith        │
│     Status: Open | Due: 2026-01-20                 │
│     [ ACKNOWLEDGE ]  [ ASSIGN TO ME ]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 STATUS

- [ ] **HTML Layout** - struktura gotowa
- [ ] **generateActions()** - logika zbierania akcji
- [ ] **renderActionCenter()** - rendering HTML
- [ ] **Event handlers** - click, assign, view
- [ ] **Filters** - priorytet, owner, overdue
- [ ] **Mock data** - testowe dane
- [ ] **Testing** - otwiera się bez błędów
- [ ] **Responsive** - wygląda dobrze
- [ ] **Accessibility** - WCAG AA

---

## 📦 PLIKI

- **actioncenter.html** - Standalone view
- **actioncenter.js** - Logic + rendering
- **mock-data.js** - Test data
- **README.md** - Ta dokumentacja

---

## 🔄 INTEGRACJA Z MAIN APP

Gdy moduł będzie gotowy, wciągnąć do `app.js`:

1. Import `generateActions()` z modułu
2. W `showPage('actioncenter')`: wywoła `renderActionCenter()`
3. Event handlers będą routować do `openProjectDetail()`, `showPage()`, itp.

---

## 📞 PYTANIA

- Jaki format mają "owner decisions" w projektach?
- Custom alerty - jakie pola powinny mieć?
- Czy akcje mogą być dismiss-able (hide)?
- Czy potrzebny eksport/CSV?
