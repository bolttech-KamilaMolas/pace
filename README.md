# IT R&D Capacity Planner

## ⚙️ Setup

### Wymagania
- Przeglądarka (Chrome, Firefox, Safari, Edge)
- Python 3.x LUB Node.js (do uruchomienia lokalnego serwera HTTP)

### Jak uruchomić

#### Opcja 1: Python (najprościej)
```bash
cd C:\Users\kamila.molas\Kirus\capacity-planner
python -m http.server 8000
```

Następnie otwórz w przeglądarce: **http://localhost:8000**

#### Opcja 2: Node.js (jeśli masz zainstalowany)
```bash
cd C:\Users\kamila.molas\Kirus\capacity-planner
npx http-server -p 8000
```

Następnie otwórz: **http://localhost:8000**

#### Opcja 3: Live Server w VS Code
1. Zainstaluj rozszerzenie "Live Server"
2. Kliknij prawym przyciskiem na `index.html`
3. Wybierz "Open with Live Server"

---

## 📊 Struktura aplikacji

### Widoki (w nawigacji bocznej)
1. **Szablon** — Podsumowanie capacity i alerty
2. **Centrum akcji** 🎯 — Automatyczna lista pilnych spraw dla liderów
3. **Mapa obciążenia** 🔥 — Heatmapa 12-tygodniowa
4. **Projekty** — Lista wszystkich projektów
5. **Obciążenie** — Szczegółowy widok alokacji
6. **Osoby** — Kadra zespołów
7. **Sprinty** — Plan sprintów
8. **Kalendarz** — Dostępność zespołów
9. **Ustawienia** — Konfiguracja alertów, zespołów, itp.

### Pliki

| Plik | Opis |
|------|------|
| `index.html` | Struktura HTML i style CSS |
| `app.js` | Logika aplikacji (4900+ linii) |
| `i18n.js` | Tłumaczenia PL/EN |
| `project-constants.js` | Dane projektów i stałe |
| `capacity.xlsx` | Excel z danymi dostępności (importowany automatycznie) |

---

## 🎯 Centrum akcji — Alerting

Automatycznie wykrywa i pokazuje:

### Alerty krytyczne (🔴 Czerwone)
- **Projekty red/amber** — zagrożone
- **Projekty zablokowane** — stuck
- **Przeciążone zespoły** — capacity > 100%
- **Wysokie ryzyka (7 dni)** — deadline zbliża się

### Alerty ostrzeżenia (🟠 Żółte)
- **Niedostępni w sprincie** — 3+ dni wolne
- **Decyzje bez właściciela** — owner = blank
- **Brak lidera projektu** — lead = blank

### Alerty info (🔵 Niebieskie)
- **Brak terminu realizacji** — delivery date = blank

---

## 🔥 Mapa obciążenia — Heatmap

12-tygodniowa heatmapa z color coding:

| Kolor | Znaczenie | Działanie |
|-------|-----------|-----------|
| 🟢 Zielony | < 80% | Niedoobciążony — można wziąć więcej |
| 🟠 Żółty | 80-100% | Optymalnie | 
| 🔴 Czerwony | > 100% | Przeciążony — podjąć działania |
| ⚪ Szary | No data | Brak danych |

---

## 🔧 Konfiguracja

### Alerty — Settings → Alerty

**Wbudowane alerty** (5 typu)
- Edytuj próg, zakres, poziom ważności
- Przycisk "✎ Edytuj regułę" otwiera modal konfiguracji
- Przycisk "ℹ️ Jak to działa" pokazuje szczegóły

**Niestandardowe alerty** (unlimited)
- Typ: project-field, project-status, team-allocation, deadline-days, health-status
- Parametry: field name, team name, liczba dni, itp.
- Status: on/off via toggle

### Zespoły
- Dodaj nowy zespół: nazwa + ID + kolor
- Edytuj parametry capacity (overhead, scrum, maintenance, BAU, projects)

### Osoby
- Zaimportowane automatycznie z Excel
- Role: BE Developer, FE Developer, QA, itp.
- Dni wolne/urlopy w Kalendarz

---

## 📈 Jak korzystać

### 1. Import danych
- Aplikacja automatycznie importuje `capacity.xlsx` z GitHub
- Persons → teams i weeks
- Availability → factor per day

### 2. Alerty
- Dashboard → "Centrum akcji" — co zrobić teraz
- Settings → Alerty — customize rules
- Toggle alertów on/off w liście

### 3. Capacity planning
- "Mapa obciążenia" — szybki przegląd 12 tygodni
- "Obciążenie" — szczegółowa edycja alokacji
- Drag-and-drop do przesuwania zadań

### 4. Projekty
- Edytuj priority (0-37+), status (7 stanów), health (RAG)
- Dodaj ryzyka i notatki z pełnym modelem
- Historyk zmian w notatkach

---

## 💡 Tips

- Zmień język: klikając PL/EN w header
- Zwiń sidebar: klawisz `«` w lewym górnym rogu
- Kliknij projekt na liście → szczegóły z możliwością edycji
- Heatmapa pokazuje 12 tygodni — scroll horizontalnie by zobaczyć więcej

---

## 🐛 Troubleshooting

**Problem: Blank screen**
- Otwierasz przez `file://` zamiast `http://localhost`
- Rozwiązanie: Uruchom lokalny serwer (patrz Setup wyżej)

**Problem: Dane nie ładują się z Excel**
- GitHub URL może być niedostępny
- Sprawdź konsolę przeglądarki (F12 → Console)
- Dane mogą być załadowane z localStorage (cache'u)

**Problem: Alerting nie działa**
- Settings → Alerty — sprawdź czy alert jest włączony (toggle)
- Przycisk "ℹ️ Jak to działa" — czego lider musi uzupełnić

---

## 📝 Notatki dla developerów

- ESNext (const, arrow functions, template literals)
- No build process required — vanilla JS
- localStorage dla persystencji (projekty, ustawienia, alerty)
- Dynamiczny i18n system z support PL/EN
- Excel import via `xlsx.js` library

---

**Ostatnia aktualizacja:** August 2026  
**Wersja:** 2.0 (Dashboard split + Action Center + Heatmap)
