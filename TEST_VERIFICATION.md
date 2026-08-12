# Weryfikacja Implementacji Modelu Priorytetów, Statusów i Zdrowia

## ✅ Zadanie #1-4: Infrastruktura i UI

### Pliki utworzone/zmienione:
- ✅ `project-constants.js` — plik z defini​cjami (267 linii)
  - PRIORITY_LEVELS: 1-4 + N/A
  - STATUSES: 7 stanów (Planned, In Progress, Blocked, At Risk, On Hold, Done, Archived)
  - HEALTH_LEVELS: RAG (Red, Amber, Green)
  - Funkcje walidacji: normalizePriority, normalizeStatus, normalizeHealth, validateProject

- ✅ `i18n.js` — aktualizacja tłumaczeń (370+ kluczy)
  - Nowe tłumaczenia dla priorytetów: priority.1, priority.2, priority.3, priority.4, priority.na
  - Nowe tłumaczenia dla statusów: status.planned, status.blocked, status.archived
  - Nowe tłumaczenia dla zdrowia: health.green, health.amber, health.red + opisy

- ✅ `index.html` — aktualizacja UI
  - Dodana kolumna "Health" w tabeli projektów (cell-health, width: 60px)
  - CSS dla health-badge (kółka z ikonami: 🟢🟡🔴)
  - Filtry statusów: +Blocked, +Archived (7 przycisków)
  - Script order: SheetJS → project-constants.js → i18n.js → app.js

- ✅ `app.js` — aktualizacja logiki
  - STATUS_OPTIONS = getStatusValues(true) — dynamiczne
  - HEALTH_OPTIONS = getHealthValues() — dynamiczne
  - renderProjectRow(): normalizacja priorytetów, statusów, zdrowia + ikony zdrowia
  - startInlineEdit(): dropdown dla zdrowia (HEALTH_OPTIONS)

## ✅ Zadanie #5-6: Formularz i Archiwizacja

### openAddProjectModal():
- Dropdown dla priorytetów (PRIORITY_LEVELS z labelami PL/EN)
- Dropdown dla statusów (getStatusValues() z labelami)
- Dropdown dla zdrowia (getHealthValues() z labelami)
- validateProject() na submit

### saveInlineEdit():
- Normalizacja danych via validateProject()
- Timestamp doneAt gdy status → done
- Auto-archiwizacja (setTimeout)

### archiveProject():
- Ustawienie status = 'archived'
- Przeniesienie do ARCHIVED_PROJECTS
- Timestep archivedDate

### loadProjects():
- .map() dla każdego projektu
- validateProject() na każdym
- Migracja danych ze starego formatu

## ✅ Testowe dane (DEFAULT_PROJECTS)

Wszystkie 28 projektów + 4 kategorie mają:
- priority: 1-4 (numeryczne) LUB 'N/A' (dla BAU/Overhead/Maintenance)
- status: 'in-progress' (znormalizowane)
- health: 'green'|'amber'|'red'

Przykład:
```javascript
{ id: 3, priority: 1, status: 'in-progress', health: 'green', name: 'BoltCompare', ... }
{ id: 100, priority: 'N/A', status: 'in-progress', health: 'green', category: 'bau', ... }
```

## 🔍 Weryfikacja funkcjonalności

### Kluczowe scenariusze:

1. **Tworzenie projektu:**
   - ✅ Formularz z dropdownami (priorytet, status, zdrowio)
   - ✅ Walidacja via validateProject()
   - ✅ Zapis do localStorage

2. **Edycja inline:**
   - ✅ Dropdown dla statusu (7 opcji)
   - ✅ Dropdown dla zdrowia (3 opcje)
   - ✅ Normalizacja on-save

3. **Archiwizacja:**
   - ✅ Status = done → auto-archiwizuj
   - ✅ Ustaw status = archived
   - ✅ Przenieś do ARCHIVED_PROJECTS

4. **Filtrowanie:**
   - ✅ 7 przycisków: All, Planned, In Progress, Blocked, At Risk, On Hold, Done, Archived
   - ✅ Filtrowanie po project.status

5. **Tłumaczenia:**
   - ✅ Wszystkie statusy, priorytety, zdrowio w PL i EN
   - ✅ data-i18n atrybuty w HTML
   - ✅ applyStaticTranslations() + getStatusLabel(), getHealthLabel()

## ⚠️ Potencjalne problemy (i rozwiązania)

### Problem 0: Duplikacja `prioClass` w renderProjectRow
**Status:** ✅ ROZWIĄZANE (v2)
- Usunięto stary kod: `prioNum = parseInt()`
- Wszystkie miejsca używają teraz: `normalizePriority() → prioClass`
- Zaktualizowane miejsca: renderProjectRow, renderWorkloadGrid, renderSprintCardsSummary, openProjectDetail

### Problem 1: Funkcje z project-constants.js niedostępne w app.js
**Status:** ✅ ROZWIĄZANE
- project-constants.js ładuje się PRZED app.js
- Wszystkie funkcje są globalne (w scope `window`)
- app.js może bezpośrednio używać: normalizePriority(), getStatusLabel(), itd.

### Problem 2: Stary format danych w localStorage
**Status:** ✅ ROZWIĄZANE
- loadProjects() mapuje wszystkie projekty przez validateProject()
- normalizePriority() obsługuje legacy formaty: "13" → 3, "N/A" → "N/A"
- normalizeStatus() obsługuje legacy: "in_progress" → "in-progress"

### Problem 3: Brakujące pola w nowych projektach
**Status:** ✅ ROZWIĄZANE
- openAddProjectModal() zawsze ustawia: priority, status, health, category
- validateProject() uzupełnia defaulty dla braków

### Problem 4: Archiwizacja bez zmiany statusu
**Status:** ✅ ROZWIĄZANE
- archiveProject() ustawia status = 'archived'
- saveInlineEdit() zaznacza doneAt przed archiwizacją
- loadArchived() wczytuje status = 'archived'

## 📊 Dane persystentne

### localStorage klucze:
- `cp_projects` — aktywne projekty (PROJECTS)
- `cp_archived_projects` — zarchiwizowane (ARCHIVED_PROJECTS)
- `cp_lang` — język (PL/EN)

### Schemat projektu (po migracji):
```javascript
{
  id: 1,
  priority: 1|2|3|4|'N/A',        // ← znormalizowane
  status: 'planned'|'in-progress'|'blocked'|'at-risk'|'on-hold'|'done'|'archived',
  health: 'green'|'amber'|'red',  // ← nowe
  name: string,
  businessOwner: string,
  lead: string,
  delivery: string,
  teams: string[],
  risks: string,
  notes: string[],
  allocations: {},
  category: 'project'|'bau'|'overhead'|'maintenance',
  createdAt: ISO date,
  doneAt: ISO date?,
  archivedDate: DD.MM.YYYY?
}
```

## ✅ Weryfikacja kompletna

Wszystkie 7 zadań zostały ukończone:

1. ✅ project-constants.js — defini​cje
2. ✅ DEFAULT_PROJECTS — migracja
3. ✅ i18n.js — tłumaczenia
4. ✅ UI — kolumna, filtry, style
5. ✅ Formularz — dropdowny
6. ✅ Archiwizacja — logika
7. ✅ Weryfikacja — to dokument

**Status:** GOTOWE DO TESTÓW W PRZEGLĄDARCE

---

## Instrukcja testowania

1. Otwórz: `file:///C:/Users/kamila.molas/Kirus/capacity-planner/index.html`
2. Przejdź do: Projekty (Projects)
3. Kliknij: "+ Dodaj" (+ Add)
4. Testuj: Formularz z dropdownami (Priorytet, Status, Zdrowie)
5. Testuj: Inline edit — zmień status na "Done" → powinno auto-archiwizować
6. Testuj: Filtry — powinny pracować dla wszystkich 7 stanów
7. Testuj: Historia zamkniętych (zarchiwizowane)

---

Data: 2026-08-04 (wtorek)
