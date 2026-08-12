# 📊 Struktura Danych Projektów - Capacity Planner

**Data:** August 7, 2026  
**Plik źródłowy:** `app.js` (linie ~200-350)  
**Liczba projektów:** 28 aktywnych + 3 BAU/Overhead

---

## 🏗️ Struktura Obiektu Projektu

Każdy projekt to obiekt JSON z następującymi polami:

```javascript
{
    id: number,                          // Unikatowy ID projektu
    priority: number | 'N/A',            // Priorytet (1-37 lub N/A)
    status: string,                      // Status: 'in-progress', 'planned', 'blocked', 'at-risk', 'on-hold', 'done', 'archived'
    health: string,                      // Zdrowie: 'green', 'amber', 'red'
    name: string,                        // Nazwa projektu
    businessOwner: string,               // Właściciel biznesowy
    lead: string,                        // Lider projektu
    delivery: string,                    // Data dostarczenia (format: 'YYYY-MM-DD')
    teams: [string],                     // Array zespołów zaangażowanych: 'ALF', 'WAREX', 'OPTIMUS', 'MASH', 'MAGENTO', 'QA', 'IT DELIVERY'
    risks: string,                       // Opisy ryzyk (liczba lub opis)
    notes: [],                           // Array notatek z metadanymi
    allocations: {},                     // Alokacje pracowników tygodniowo
    category: string                     // Kategoria: 'project', 'bau', 'maintenance', 'overhead'
}
```

---

## 📋 Szczegółowy Opis Pól

| Pole | Typ | Przykład | Opis |
|------|-----|---------|------|
| **id** | number | 1, 2, 3... | Unikatowy identyfikator. Projekty: 1-28, BAU/Other: 100-104 |
| **priority** | number \| 'N/A' | 1, 7, 31, 'N/A' | Priorytet realizacji (1 = najwyższy). N/A gdy brak przypisanego priorytetu |
| **status** | string | 'in-progress' | `in-progress`, `planned`, `blocked`, `at-risk`, `on-hold`, `done`, `archived` |
| **health** | string | 'green' | `green` (OK), `amber` (zagrożenie), `red` (krytyczne) |
| **name** | string | "BoltCompare" | Nazwa projektu (wyświetlana w UI) |
| **businessOwner** | string | "Agnieszka Pura" | Właściciel biznesowy (osoba/zespół odpowiedzialny za wymagania) |
| **lead** | string | "Marcin Wrzesiński" | Lider techniczny/delivery lead |
| **delivery** | string | "2026-08-09" | Planowana data dostarczenia (format ISO: YYYY-MM-DD). Puste = brak terminu |
| **teams** | Array<string> | ["ALF", "WAREX"] | Lista zespołów zaangażowanych w projekt |
| **risks** | string | "3" lub "Risk1, Risk2" | Liczba otwartych ryzyk lub opisy |
| **notes** | Array | [ {author, date, text} ] | Historyczne notatki projektu |
| **allocations** | Object | { "1": {ALF: 40, WAREX: 30} } | Tygodniowe alokacje zdolności po zespołach (klucz = tydzień, wartość = % alokacji na zespół) |
| **category** | string | "project" | `project`, `bau`, `maintenance`, `overhead` (dla filtrowania) |

---

## 📊 Aktualna Lista Projektów (28 aktywnych)

### Projekty Priorytet 1-10

| ID | Priorytet | Nazwa | Status | Health | Owner | Lead | Deadline | Teams |
|----|-----------|-------|--------|--------|-------|------|----------|-------|
| 3 | 1 | BoltCompare | in-progress | green | — | Tomasz Lupa | 2026-08-09 | OPTIMUS |
| 13 | 4 | LTDC Rental POC | in-progress | green | — | Kamila Molas | 2026-05-15 | ALF, WAREX, OPTIMUS |
| 14 | 7 | Mirror check | in-progress | green | Izabela Zdunek | Tomasz Kułakowski | — | WAREX, MASH |
| 15 | 7 | MM Spain (rental) | in-progress | amber | — | — | 2026-04-15 | ALF, WAREX, OPTIMUS, MASH, MAGENTO |
| 17 | 7 | Mr Price | in-progress | green | — | Wojciech Wójcik | — | WAREX, OPTIMUS |
| 19 | 8 | Orange B2B Enterprise | in-progress | green | — | — | — | WAREX, OPTIMUS |
| 21 | 8 | Orange Products refresh & Mirror check | in-progress | green | — | Tomasz Kułakowski | 2026-05-25 | WAREX, OPTIMUS, MASH |
| 26 | 9 | Spot Trade In Media Expert | in-progress | green | Mikołaj Przybyła | — | — | — |
| 27 | 8 | Sunrise - new project | in-progress | green | Igor Zdziarski | — | — | — |
| 28 | 1 | T-Mobile North Macedonia | in-progress | green | Zofia Kasperska | Tomasz Kułakowski | 2026-05-26 | WAREX, OPTIMUS, MASH |

### Projekty Priorytet 11-20

| ID | Priorytet | Nazwa | Status | Health | Owner | Lead | Deadline | Teams |
|----|-----------|-------|--------|--------|-------|------|----------|-------|
| 9 | 11 | HT Insurance | in-progress | green | — | — | 2026-08-11 | WAREX, OPTIMUS |
| 20 | 12 | Orange Insurance Platform - Phase 2 | in-progress | green | Izabela Zdunek | Tomasz Lupa | — | OPTIMUS, MASH, MAGENTO |
| 4 | 13 | BoltPay/PayU payments integration | in-progress | green | Katarzyna Zaremba | Paweł Naworol | — | ALF, MASH |
| 11 | 13 | iMad Multibrand - PHASE 2 | in-progress | green | Łukasz Szafrański | Przemysław Ćwikła | — | ALF, MASH, MAGENTO |
| 8 | 15 | Gwarancje generyczne | in-progress | green | — | — | 2026-06-26 | WAREX, OPTIMUS |
| 12 | 17 | IRIS-WAREX | in-progress | red | — | — | 2026-04-19 | WAREX |
| 22 | 16 | Parametrization for Credit Risk Department | in-progress | green | Karolina Głowacka-Serafin | Kamila Molas | 2026-07-16 | ALF, MASH |
| 6 | 21 | Customer Portal update (T-Mobile and Play) | in-progress | green | — | Monika Zarzycka | — | OPTIMUS |
| 5 | 31 | Coverwise Travel Gadget TPA - Phase2 Southdowns | in-progress | green | Tope Ajiboye | Paweł Naworol | — | WAREX, OPTIMUS |

### Projekty Priorytet 21+ i N/A

| ID | Priorytet | Nazwa | Status | Health | Owner | Lead | Deadline | Teams |
|----|-----------|-------|--------|--------|-------|------|----------|-------|
| 1 | N/A | Generic Warranty Product in Warex2 | in-progress | green | Agnieszka Pura | Marcin Wrzesiński | — | WAREX |
| 2 | N/A | API between Warex i IRIS | in-progress | green | Marta Jankowska | Marcin Wrzesiński | — | WAREX |
| 7 | N/A | Dynamic Pricing | in-progress | amber | Łukasz Miksa | Paweł Szymański | — | ALF, MASH |
| 10 | 37 | Huawei | in-progress | amber | Wiktoria Łopian | — | — | — |
| 16 | N/A | Modernization of local Customer Portals | in-progress | green | Zofia Kasperska | Monika Zarzycka | — | OPTIMUS |
| 18 | N/A | Operations Excellence in ALF (Phase 3) | in-progress | green | Natalia Wiśniewska | Kamila Molas | — | ALF |
| 23 | 36 | Polkomtel online trade-in | in-progress | amber | Monika Komorowska | — | — | — |
| 24 | N/A | Rental in LTDC | in-progress | green | Milena Dzikowska | Kamila Molas | — | ALF |
| 25 | 33 | RentMe Refurb - Media Markt | in-progress | amber | Olga Kuhalskaya | Kamila Molas | — | ALF, WAREX, OPTIMUS |

### BAU, Maintenance i Overhead (Kategorie Specjalne)

| ID | Priorytet | Nazwa | Status | Health | Category | Teams |
|----|-----------|-------|--------|--------|----------|-------|
| 100 | N/A | BAU & Maintenance | in-progress | green | bau | ALF, WAREX, OPTIMUS, MASH, MAGENTO |
| 102 | N/A | Cele IT | in-progress | green | overhead | ALF, WAREX, OPTIMUS, MASH, MAGENTO, QA, IT DELIVERY |
| 103 | N/A | Szkolenia / Development | in-progress | green | overhead | ALF, WAREX, OPTIMUS, MASH, MAGENTO, QA |
| 104 | N/A | Test Automation | in-progress | green | maintenance | QA |

---

## 🎯 Dostępne Zespoły (Teams)

```
ALF              - Asset Lease Financing
WAREX            - Warranty & Exchange system
OPTIMUS          - Main platform
MASH             - Marketing & Sales Hub
MAGENTO          - E-commerce platform
QA               - Quality Assurance
IT DELIVERY      - IT Operations
```

---

## 🔄 Statusy Projektów

```
in-progress  - Projekt w trakcie realizacji
planned      - Projekt zaplanowany na przyszłość
blocked      - Projekt zablokowany (oczekiwanie na decyzję)
at-risk      - Projekt zagrożony (ryzyko realizacji)
on-hold      - Projekt wstrzymany tymczasowo
done         - Projekt ukończony
archived     - Projekt zarchiwizowany
```

---

## 💚❌🔴 Health Status Explanation

```
green  ✅ - Projekt realizuje się bez problemów
amber  ⚠️  - Projekt ma wyzwania / zagrożenia
red    🔴 - Projekt w stanie krytycznym
```

---

## 📝 Jak Uzupełnić/Zaktualizować Dane

### 1. **Edytuj w UI (Capacity Planner)**
   - Otwórz http://localhost:3000
   - Wejdź w zakładkę "Projekty"
   - Kliknij na projekt aby edytować
   - Zapisane dane automatycznie trafiają do `localStorage`

### 2. **Edytuj JSON bezpośrednio w app.js**
   - Znajdź array `DEFAULT_PROJECTS` (linia ~200)
   - Zmień pola projektu
   - Odśwież aplikację w przeglądarce

### 3. **Pola Obowiązkowe do Uzupełnienia**
   ```
   ✅ id              - MUSI być unikatowy
   ✅ name            - Nazwa projektu (wymagana)
   ⚠️  priority       - Numeyk lub 'N/A'
   ⚠️  status         - in-progress (domyślnie)
   ⚠️  health         - green (domyślnie)
   ⚠️  businessOwner  - Imię i nazwisko lub puste
   ⚠️  lead           - Imię i nazwisko lub puste
   ⚠️  delivery       - Format: 'YYYY-MM-DD' lub puste
   ⚠️  teams          - Array: ['ALF'], ['WAREX', 'OPTIMUS'] itd.
   ```

---

## 💾 Przykład Nowego Projektu

Aby dodać nowy projekt, dodaj obiekt do `DEFAULT_PROJECTS`:

```javascript
{
    id: 29,                              // Następny ID
    priority: 5,                         // Priorytet
    status: 'in-progress',               // Status
    health: 'green',                     // Health
    name: 'Nowy Projekt Testowy',        // Nazwa
    businessOwner: 'Imię Nazwisko',     // Owner
    lead: 'Imię Nazwisko',               // Lead
    delivery: '2026-12-31',              // Deadline
    teams: ['ALF', 'WAREX'],             // Zespoły
    risks: '',                           // Ryzyka
    notes: [],                           // Notatki
    allocations: {},                     // Alokacje (automatyczne)
    category: 'project'                  // Kategoria
}
```

---

## 📋 Template do Wypełnienia

**Poniżej możesz wpisać nowe/zmienione projekty:**

```markdown
### Nowy Projekt Template

**ID:** [ID]  
**Priorytet:** [Numer lub N/A]  
**Status:** [in-progress/planned/blocked/at-risk/on-hold/done]  
**Health:** [green/amber/red]  
**Nazwa:** [Nazwa projektu]  
**Business Owner:** [Imię Nazwisko lub -]  
**Lead:** [Imię Nazwisko lub -]  
**Deadline:** [YYYY-MM-DD lub -]  
**Teams:** [ALF / WAREX / OPTIMUS / MASH / MAGENTO / QA / IT DELIVERY]  
**Ryzyka:** [Liczba lub opis]  
**Notatki:** [Dodatkowe info]  

---
```

---

## 🔗 Relacje i Zależności

- **Projekt ↔ Zespół** — Projekt może być przypisany do 1+ zespołów
- **Zespół ↔ Pracownik** — Pracownicy są przypisani do zespołów
- **Projekt ↔ Alokacja** — Alokacja pracowników na projekcie tygodniowo
- **Projekt ↔ Notatki** — Notatki z historią zmian i autorami

---

## 📊 Eksport/Import Danych

### Export aktualnych projektów (Copy from localStorage):
```javascript
// W DevTools console:
copy(localStorage.getItem('cp_projects'))
```

### Import nowych danych (Paste to localStorage):
```javascript
// W DevTools console:
localStorage.setItem('cp_projects', '[paste JSON here]')
location.reload()
```

---

## ⚙️ Aktualne Konfiguracje Teamów

```javascript
// Alokacja zdolności (% capacity allocation)
ALF:      overhead: 5%, scrum: 9%, maintenance: 9%, bau: 21%, projects: 56%
WAREX:    overhead: 5%, scrum: 10%, maintenance: 16%, bau: 6%, projects: 63%
OPTIMUS:  overhead: 5%, scrum: 10%, maintenance: 6%, bau: 24%, projects: 55%
MASH:     overhead: 5%, scrum: 16%, maintenance: 20%, bau: 12%, projects: 47%
MAGENTO:  overhead: 5%, scrum: 10%, maintenance: 5%, bau: 5%, projects: 75%
QA:       overhead: 5%, scrum: 10%, maintenance: 25%, bau: 40%, projects: 20%
IT DELIV: overhead: 5%, scrum: 10%, maintenance: 5%, bau: 0%, projects: 80%
```

---

## 🆘 Support

**Problem:** Zmiany nie zapisują się  
**Rozwiązanie:** Otwórz DevTools (F12) → Application → Local Storage → sprawdź `cp_projects`

**Problem:** Projekt nie pojawia się w UI  
**Rozwiązanie:** Sprawdź czy `id` jest unikatowy, `name` wypełniony, `teams` array nie pusty

**Problem:** Alokacje są źle wyświetlane  
**Rozwiązanie:** Alokacje to obiekt gdzie klucz = tydzień (0, 1, 2...), wartość = obiekt z zespołami i %

---

**Ostatnia aktualizacja:** August 7, 2026  
**Gotowe do wdrożenia:** ✅ Tak

