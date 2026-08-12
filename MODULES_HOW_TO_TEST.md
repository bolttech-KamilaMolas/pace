# 🧪 MODUŁY - JAK TESTOWAĆ

## 🚀 TESTOWANIE ACTION CENTER (Moduł 04)

### 1. Otwórz w przeglądarce

**Adres:**
```
http://localhost:8000/modules/04-actioncenter/actioncenter.html
```

### 2. Co powinieneś zobaczyć

#### Header
```
🎯 Action Center
Wszystkie pilne akcje dla leadership, pogrupowane wg kategorii
```

#### Summary (4 liczniki)
```
3 Red Projects
1 Blocked
1 Overloaded  
2 Risks
```

#### Akcje (posortowane wg priorytetu)
```
🔴 Critical: ALF Lease Portal at Risk
   Status: At-Risk | Health: Red | Lead: John Doe
   Action needed: Review project, replan scope
   Due: 2026-01-15 | Assigned to: John Doe
   [ VIEW PROJECT ]  [ ASSIGN TO ME ]

🚫 Decision Needed: OCS Integration
   Waiting for OCS API specification
   Due: 2026-01-14
   [ DECISION ]

👥 Overloaded: ALF Team at 150%
   ALF team has 42 MD allocated vs 28 MD capacity
   [ VIEW WORKLOAD ]

⚠️  Risk: DB Performance...
   Project: ALF Lease Portal | Owner: Jane Smith
   Due: 2026-01-15
   [ VIEW RISK ]  [ ASSIGN TO ME ]

🔴 Critical: Security Audit...
   [Kolejna akcja]
```

### 3. Testy interaktywne

#### Test 1: Filtry
1. Kliknij **"Tylko P0-P1"** → powinny zostać tylko krytyczne akcje
2. Kliknij **"Wszystkie"** → powinny wrócić wszystkie
3. Kliknij **"Tylko overdue"** → akcje z datą < dzisiaj
4. Kliknij **"Dla mnie"** → akcje przydzielone dla "Current User"

**Oczekiwane:** Liczniki w summary powinny się zmienić

#### Test 2: Przydziel sobie akcję
1. Kliknij **"Przydziel sobie"** na dowolnej akcji
2. Przycisk powinien zniknąć
3. Akcja powinna zostać przypisana dla "Current User"

**Oczekiwane:** Przycisk "Przydziel sobie" znika, pojawia się toast "Przydzielono akcję!"

#### Test 3: Akcja
1. Kliknij **"VIEW PROJECT"** → alert z ID projektu
2. Kliknij **"DECISION"** → alert z opisem decyzji
3. Kliknij **"VIEW WORKLOAD"** → alert z ID zespołu

**Oczekiwane:** Alerty pojawiają się z danymi

#### Test 4: Responsive
1. Zmień rozmiar okna na mobile (375px)
2. Zmień na tablet (768px)

**Oczekiwane:** Layout powinien się automatycznie dostosować

### 4. Sprawdź console

Otwórz **Developer Tools (F12)** → **Console**

Powinieneś zobaczyć:
```
Generated 5 actions
Array(5) [
  {id: "red-project-1", type: "red-project", ...},
  {id: "blocked-decision-2", type: "owner-decision", ...},
  ...
]
```

Nie powinno być czerwonych błędów!

---

## 🏗️ STRUKTURA MODUŁÓW - REFERENCE

```
modules/
├── 04-actioncenter/
│   ├── actioncenter.html      ← Otwórz w przeglądarce
│   ├── actioncenter.js        ← Logika renderowania + event handlers
│   ├── mock-data.js           ← Test data (PROJECTS, ALERT_CONFIG)
│   └── README.md              ← Dokumentacja
│
└── shared/
    ├── constants.js           ← TEAMS, ROLES, BASE_DATE, itp
    ├── utils.js               ← Helper functions (getCapacity, etc)
    ├── styles.css             ← Common styling (Bolttech brand)
    └── mock-data.js           ← Global mock data (jeśli potrzebne)
```

---

## ✅ CHECKLIST PRZED INTEGRACJĄ

- [ ] **Standalone HTML** - otwiera się bez błędów
- [ ] **Console clean** - brak błędów JS
- [ ] **All filters work** - P0-P1, overdue, dla mnie, wszystkie
- [ ] **Assign to me works** - przydzielenie akcji działa
- [ ] **Action buttons respond** - alert z datą
- [ ] **Responsive** - wygląda dobrze na mobile/tablet
- [ ] **Accessibility** - tab navigation, focus visible
- [ ] **Data looks realistic** - mock data reprezentuje rzeczywiste scenariusze

---

## 🔗 ZALEŻNOŚCI - CO IMPORT'OWAĆ?

Gdy moduł będzie integrowany z `app.js`, będzie potrzebować:

```javascript
// Z shared
import { TEAMS, BASE_DATE, TOTAL_WEEKS } from './modules/shared/constants.js';
import { getCapacity, ... } from './modules/shared/utils.js';

// Z main app.js (już istnieje)
const PROJECTS = JSON.parse(localStorage.getItem('cp_projects')) || [];
const alert_config = JSON.parse(localStorage.getItem('cp_alert_config')) || {};

// Funkcje
function generateActions(projects, teams, alertConfig) { ... }
function renderActionCenter() { ... }
```

---

## 🐛 JEŚLI COŚ SIĘ PSUJE

### Błąd: "Cannot read property 'innerHTML' of null"
→ Element `#actions-list` nie istnieje w HTML
→ Sprawdź czy HTML zawiera `<div id="actions-list"></div>`

### Błąd: "TEAMS is not defined"
→ constants.js nie załadował się
→ Sprawdź ścieżkę: `<script src="../shared/constants.js"></script>`

### Brak danych w akcjach
→ MOCK_PROJECTS nie załadował się
→ Sprawdź `mock-data.js`

### Console: "generateActions is not a function"
→ actioncenter.js nie załadował się poprawnie
→ Sprawdź kolejność scriptów w HTML

---

## 📝 NOTATKI DLA KAŻDEGO MODUŁU

### Moduł 01 - Template ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 02 - Projects ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 03 - Workload ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 04 - Action Center 🔄 (AKTUALNIE)
- Status: BUDUJEMY
- Standalone: `modules/04-actioncenter/actioncenter.html`
- Expected output: Lista akcji pogrupowana wg kategorii

### Moduł 05 - Heatmap ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 06 - People ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 07 - Sprints ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 08 - Calendar ✅
- Status: PEŁNY
- Nie wymaga zmian

### Moduł 09 - Squad Lead 🟡 (NASTĘPNY)
- Status: NIEKOMPLETNY
- TODO: Dokończyć implementację
- Standalone będzie: `modules/09-squadlead/squadlead.html`

### Moduł 10 - Settings ✅
- Status: PEŁNY
- Nie wymaga zmian

---

## 🎯 WORKFLOW

1. **Test Modułu 04** (Action Center) - teraz
   - [ ] Otwórz w przeglądarce
   - [ ] Przejdź przez wszystkie testy
   - [ ] Potwierdź że działa

2. **Commit** - zapisz working version
   - `git add modules/04-actioncenter/`
   - `git commit -m "feat: Action Center module - standalone version"`

3. **Buduj Moduł 09** (Squad Lead) - następnie
   - Powtórz ten proces

4. **Integracja** - gdy oba moduły będą gotowe
   - Wciągnij kod z modułów do `app.js`
   - Updatej `showPage()` mappingi
   - Testuj główną aplikację

---

## 📞 PYTANIA?

Jak coś nie działa:
1. Sprawdź console (F12)
2. Sprawdź HTML (szukaj ID containerów)
3. Sprawdź script imports (order matters!)
4. Sprawdź mock-data (czy zawiera dane?)

Jeśli wciąż nie działa → otwórz tego doc w Kiro i pytaj!
