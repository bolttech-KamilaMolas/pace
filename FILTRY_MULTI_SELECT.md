# Capacity Planner — Filtry Multi-Select (05.08.2026)

## Zmiana

Przywrócono możliwość **wielokrotnego wyboru zespołów i ról** w zakładce "Osoby".

### Było:
- Filtr po rolach: tylko JEDNA rola naraz (`single-select`)
- Filtr po teamach: tylko JEDEN team naraz (`single-select`)
- Niemożliwość zobaczenia osób z ALF + MASH jednocześnie
- Niemożliwość zobaczenia tylko developerów FE i QA razem

### Teraz jest:
- Filtr po rolach: **więcej niż jedną** rolę naraz (`multi-select`)
- Filtr po teamach: **więcej niż jeden** team naraz (`multi-select`)
- Klikalnie przyciski pokazują zaznaczenia
- Przycisk "Wszystkie" resetuje wszystkie filtry

## Jak używać

### Filtrowanie po teamach

1. Otwórz zakładkę "Osoby"
2. Kliknij na przycisk zespołu (np. "ALF")
3. Przycisk stanie się ciemny (zaznaczony)
4. Kliknij na kolejny zespół (np. "MASH")
5. Teraz zobaczysz osoby z OBUTU zespołów
6. Kliknij "Wszystkie" aby resetować

### Filtrowanie po rolach

1. Po wybraniu zespołów, możesz dodatkowo filtrować po rolach
2. Kliknij na przycisk roli (np. "FE Developer")
3. Kliknij na kolejną rolę (np. "QA")
4. Zobaczysz tylko osoby z tych ról w wybranych teamach
5. Kliknij "Wszystkie role" aby resetować

### Kombinacje

**Przykład 1: ALF team, wszyscy**
- Kliknij: ALF
- Wynik: Wszystkie osoby z teamu ALF

**Przykład 2: ALF + MASH, wszyscy**
- Kliknij: ALF
- Kliknij: MASH
- Wynik: Wszystkie osoby z ALF i MASH

**Przykład 3: ALF + MASH, tylko FE i QA**
- Kliknij: ALF, MASH
- Kliknij: FE Developer
- Kliknij: QA
- Wynik: Tylko FE i QA z ALF i MASH

## Implementacja

### Zmiany w stanie

```javascript
// BYŁO:
let activeRoleFilter = 'all';    // string: jedna wartość
let activeTeamFilter = 'all';    // string: jedna wartość

// JEST:
let activeRoleFilters = new Set();   // Set: wiele wartości
let activeTeamFilters = new Set();   // Set: wiele wartości
```

### Zmiany w logice

```javascript
// Filtrowanie zespołów (BYŁO):
if (activeTeamFilter !== 'all' && section.dataset.team !== activeTeamFilter) {
    continue; // Pomiń jeśli nie pasuje
}

// Filtrowanie zespołów (JEST):
if (activeTeamFilters.size > 0 && !activeTeamFilters.has(team.name)) {
    return; // Pomiń jeśli team nie jest w zbiorze
}
```

### Zmiany w obsłudze klikniecia

```javascript
// BYŁO: Ustaw tylko jedną wartość
tab.addEventListener('click', () => {
    activeTeamFilter = tab.dataset.teamFilter;  // Zamień całą wartość
});

// JEST: Toggle (dodaj/usuń ze zbioru)
tab.addEventListener('click', () => {
    const teamName = tab.dataset.teamFilter;
    if (teamName === 'all') {
        activeTeamFilters.clear();  // Wyczyść wszystko
    } else {
        if (activeTeamFilters.has(teamName)) {
            activeTeamFilters.delete(teamName);  // Usuń
        } else {
            activeTeamFilters.add(teamName);     // Dodaj
        }
    }
    renderPeople();
});
```

## Cechy

✅ **Multi-select dla teamów** — kliknij wiele teamów
✅ **Multi-select dla ról** — kliknij wiele ról
✅ **Przycisk "Wszystkie" resetuje** — wraca do domyślnego stanu
✅ **Wizualna informacja** — zaznaczone przyciski są ciemne
✅ **Kombinacje** — możesz łączyć filtry zespołów i ról
✅ **Przywrócono** — funkcjonalność z poprzednich wersji

## Plik zmieniony

- `app.js` — linie 314-315 (deklaracja) i 2308-2500 (implementacja)

## Scenariusze testowe

1. **Test 1: Multi-select teamów**
   - Otwórz Osoby
   - Kliknij ALF → zobaczysz ALF
   - Kliknij MASH → zobaczysz ALF + MASH
   - Kliknij ALF → zobaczysz tylko MASH
   - Kliknij Wszystkie → resetuje się

2. **Test 2: Multi-select ról**
   - Wybiez ALL teamów (kliknij Wszystkie)
   - Kliknij "FE Developer" → tylko FE
   - Kliknij "QA" → FE + QA
   - Kliknij "Wszystkie role" → reset

3. **Test 3: Kombinacja**
   - Wybierz ALF + MASH (teamy)
   - Wybierz FE + System Analyst (role)
   - Sprawdź czy wyświetlane są tylko te osoby

## Wersja przed zmianą

Jeśli chcesz wrócić do single-select — skomentuj sekcję multi-select w `app.js` i przywróć kod do poprzedniej wersji (git history).

---

**Data zmian:** 05.08.2026
**Autor:** Kiro AI
**Status:** Gotowe do testów
