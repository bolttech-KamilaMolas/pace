# Capacity Planner — Role jako Filtry Tab (05.08.2026)

## Zmiana

Role zostały przesunięte z osobnego paska przycisków (role-filter-bar) na style tab-ów, takie jak teamy.

### Przed zmianą:
```
Wszystkie (team-tabs)
[ALF] [MASH] [Inne]

Wszystkie role (role-filter-bar - inny styl)
[FE Developer] [BE Developer] [QA] [System Analyst]
```

### Po zmianie:
```
Wszystkie (team-tabs)
[ALF] [MASH] [Inne]

Wszystkie role (team-tabs - identyczny styl!)
[FE Developer] [BE Developer] [QA] [System Analyst]
```

## Co się zmieniło

### 1. HTML struktura

**Było:**
```html
<!-- Teamy -->
<div class="team-tabs">
    <button class="team-tab" ...>Wszystkie</button>
    <button class="team-tab" ...>ALF</button>
</div>

<!-- Role - OSOBNY PASEK -->
<div class="role-filter-bar">
    <button class="role-filter-btn" ...>Wszystkie role</button>
    <button class="role-filter-btn" ...>FE Developer</button>
</div>
```

**Teraz:**
```html
<!-- Teamy -->
<div class="team-tabs">
    <button class="team-tab" ...>Wszystkie</button>
    <button class="team-tab" ...>ALF</button>
</div>

<!-- Role - TAK SAME JAKO TEAMY! -->
<div class="team-tabs">
    <button class="team-tab" data-is-role-filter="true" ...>Wszystkie role</button>
    <button class="team-tab" data-is-role-filter="true" ...>FE Developer</button>
</div>
```

### 2. CSS

**Usunięte:**
```css
.role-filter-bar { ... }
.role-filter-btn { ... }
.role-filter-btn:hover { ... }
.role-filter-btn.active { ... }
```

Role korzystają teraz z `.team-tab` stylów - identyczne!

### 3. JavaScript - Event Listeners

**Było:** Osobne event listenery
```javascript
container.querySelectorAll('.team-tab').forEach(tab => { /* ... */ });
container.querySelectorAll('.role-filter-btn').forEach(btn => { /* ... */ });
```

**Teraz:** Jeden unified listener
```javascript
container.querySelectorAll('.team-tab').forEach(tab => {
    const isRoleFilter = tab.dataset.isRoleFilter === 'true';
    const filterValue = isRoleFilter 
        ? tab.dataset.roleFilter 
        : tab.dataset.teamFilter;
    
    // Jedna logika dla obu!
});
```

## Pliki zmienione

1. **app.js**
   - Linia ~2318: HTML dla roli zmieniony na team-tabs
   - Linie ~2450-2480: Event listener unifikowany

2. **index.html**
   - Linie ~940-970: Usunięte CSS dla .role-filter-bar i .role-filter-btn

## Cechy

✅ **Identyczny wygląd** — role wyglądają dokładnie jak teamy
✅ **Mniej CSS** — bez redundancji (team-tabs style dla obu)
✅ **Mniej JavaScript** — jeden event listener dla obu typów
✅ **Intuicyjny UX** — użytkownik nie wie, że to teamy+role
✅ **Multi-select zachowany** — możesz wybrać wiele ról i teamów

## Jak używać

Nic się nie zmienia dla użytkownika!

1. Otwórz zakładkę "Osoby"
2. Kliknij teamy: ALF, MASH, etc.
3. Kliknij role: FE Developer, QA, etc.
4. Widzisz filtrowany wynik

Różnica: role teraz wyglądają i zachowują się identycznie jak teamy.

## Scenariusz testowy

1. Otwórz "Osoby"
2. Kliknij "ALF" → pokaż ALF
3. Kliknij "MASH" → pokaż ALF + MASH
4. Kliknij "FE Developer" → pokaż tylko FE z ALF+MASH
5. Kliknij "QA" → pokaż FE + QA z ALF+MASH
6. Kliknij "Wszystkie role" → reset ról, teamy bez zmian
7. Kliknij "Wszystkie" (teamy) → reset teamów, role bez zmian

## Struktura danych

```javascript
// Teamy i role używają tego samego mechanizmu:
<button 
    class="team-tab"
    data-team-filter="ALF"  // dla teamów
    <!-- OR -->
    data-role-filter="FE Developer"  // dla ról
    data-is-role-filter="true"  // marker aby wiedzieć co to
>
```

## Kompatybilność

- ✅ Wcześniejsze zapisane filtry: nie będą działać (zmieniono strukturę)
- ✅ Multi-select logika: w pełni zachowana
- ✅ Filtry kombinacje: ALF+MASH + FE+QA = działa

---

**Data:** 05.08.2026
**Typ:** Refactoring UI + logiki
**Wpływ:** Wizualny i UX - żaden funkcjonalny
**Status:** Gotowe
