# MODUŁY - Architektura Capacity Planner

## 📁 Struktura Modułów

```
capacity-planner/
├── modules/
│   ├── 01-template/              # Dashboard + Capacity Bars
│   │   ├── template.html         # Standalone view
│   │   ├── template.js           # Logic + Mock data
│   │   └── README.md             # Dokumentacja
│   │
│   ├── 02-projects/              # Projects Table & Detail
│   │   ├── projects.html
│   │   ├── projects.js
│   │   └── README.md
│   │
│   ├── 03-workload/              # Workload Grid (Allocation Table)
│   │   ├── workload.html
│   │   ├── workload.js
│   │   └── README.md
│   │
│   ├── 04-actioncenter/          # 🔴 NIEKOMPLETNE - Akcje do zrobienia
│   │   ├── actioncenter.html     # ← BUDUJEMY
│   │   ├── actioncenter.js       # ← BUDUJEMY
│   │   └── README.md
│   │
│   ├── 05-heatmap/               # Workload Heatmap (12-week)
│   │   ├── heatmap.html
│   │   ├── heatmap.js
│   │   └── README.md
│   │
│   ├── 06-people/                # People Assignments
│   │   ├── people.html
│   │   ├── people.js
│   │   └── README.md
│   │
│   ├── 07-sprints/               # Sprint Planning
│   │   ├── sprints.html
│   │   ├── sprints.js
│   │   └── README.md
│   │
│   ├── 08-calendar/              # Calendar + Teams Availability
│   │   ├── calendar.html
│   │   ├── calendar.js
│   │   └── README.md
│   │
│   ├── 09-squadlead/             # 🟡 NIEKOMPLETNE - Squad Lead View
│   │   ├── squadlead.html        # ← BUDUJEMY
│   │   ├── squadlead.js          # ← BUDUJEMY
│   │   └── README.md
│   │
│   ├── 10-settings/              # Configuration
│   │   ├── settings.html
│   │   ├── settings.js
│   │   └── README.md
│   │
│   └── shared/                   # Udostępnione
│       ├── constants.js          # TEAMS, ROLES, BASE_DATE, itp
│       ├── mock-data.js          # Mock projects, people, allocations
│       ├── utils.js              # Helper functions
│       └── styles.css            # Shared styling
│
├── index.html                    # MAIN - integracja wszystkich
├── app.js                        # Main coordinator
└── [inne pliki]
```

---

## 🎯 PROCES BUDOWY

### Dla każdego modułu (niekompletnego):

1. **Stwórz plik**: `modules/0X-name/`
2. **Mock-data**: Kopiuj dane z głównego app.js
3. **Standalone HTML**: `<html>` + `<script src="shared/constants.js">` + `<script src="name.js">`
4. **Testy**: Otwórz w przeglądarce, sprawdź czy renderuje
5. **README**: Dokumentuj API, zależności, eventy
6. **Iteruj**: Doprecyzuj aż będzie idealne
7. **Merge**: Wciągnij do głównego app.js

---

## 📊 STATUS MODUŁÓW

| # | Moduł | Status | Priorytet | Notes |
|---|-------|--------|-----------|-------|
| 01 | Template | ✅ Pełny | - | Capacity bars + timeline |
| 02 | Projects | ✅ Pełny | - | Table + detail view |
| 03 | Workload | ✅ Pełny | - | Allocation grid |
| 04 | **Action Center** | 🔴 TODO | 🔴 P1 | Akcje do zrobienia |
| 05 | Heatmap | ✅ Pełny | - | 12-week heatmap |
| 06 | People | ✅ Pełny | - | Sprint assignments |
| 07 | Sprints | ✅ Pełny | - | Sprint planning |
| 08 | Calendar | ✅ Pełny | - | Teams availability |
| 09 | **Squad Lead** | 🟡 PARTIAL | 🟡 P2 | Niekompletna |
| 10 | Settings | ✅ Pełny | - | Configuration |

---

## 🔗 ZALEŻNOŚCI

### Action Center (04) zależy od:
```
- PROJECTS (from shared/mock-data)
- TEAMS (from shared/constants)
- getCapacity() function (from shared/utils)
- Alert config (from localStorage cp_alert_config)
```

### Squad Lead (09) zależy od:
```
- TEAMS (from shared/constants)
- PEOPLE (from shared/mock-data)
- PROJECTS (from shared/mock-data)
- getCapacity() function
- Sprint allocation data
- Team capacity parameters
```

### Każdy moduł zależy od:
```
Shared:
- constants.js: TEAMS[], ROLES[], BASE_DATE, TOTAL_WEEKS
- mock-data.js: PROJECTS[], PEOPLE[], allocations, personAssignments
- utils.js: Helper functions (parseSprintDates, calcCapacity, isFriday, etc)
- styles.css: Bolttech brand colors + component styles
```

---

## 📝 CHECKLIST INTEGRACJI

Na końcu, zanim wciągniesz do main:

- [ ] **Standalone HTML** - otwiera się i renderuje bez błędów
- [ ] **Mock-data** - zawiera realistyczne dane
- [ ] **Event handlers** - wszystkie klikalne elementy działają
- [ ] **Responsive** - wygląda dobrze na mobile/tablet/desktop
- [ ] **Accessibility** - WCAG AA (focus states, keyboard nav)
- [ ] **Console clear** - brak błędów JS
- [ ] **localStorage** - jeśli używa, to z prefixem `cp_`
- [ ] **README** - dokumentacja API
- [ ] **Dependencies** - jasne które funkcje/dane są potrzebne

---

## 🚀 KOLEJNOŚĆ PRACY

1. **Action Center** (04) - najkrótszy, najwyższa wartość
2. **Squad Lead** (09) - dłuższy, ale ważny
3. **Custom Alerts** - integracja z obu powyższych
4. **Integracja** - łączenie do main index.html

---

## 📌 RULES

✅ **Każdy moduł to plik HTML możliwy do otwarcia w przeglądarce**
✅ **Brak zależności od innego kodu modułu (poza shared/)**
✅ **Mock-data zamiast localStorage (początkowa)**
✅ **Dokumentacja przed integracją**
✅ **Jedna zmiana = jeden moduł = jedna sesja**

Gdy będzie gotowy moduł → integrujemy, a inne pozostają nienaruszone.
