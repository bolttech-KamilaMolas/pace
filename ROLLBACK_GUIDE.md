# 🔄 Rollback Guide - Capacity Planner Accessibility Fixes

**Commit Hash:** `3b608e0`  
**Tag:** `v-before-accessibility-fixes` (safe rollback point)  
**Date:** August 7, 2026  
**Changes:** Priority 1 Accessibility Fixes (CSS focus, ARIA labels, keyboard handler)

---

## 🚨 Jak Wycofać Zmiany

Jeśli coś pójdzie nie tak, masz dwie opcje wycofania:

### Opcja 1: Soft Rollback (zachowaj commit, cofnij zmiany)

```bash
# Przywróć plik do poprzedniej wersji
git checkout v-before-accessibility-fixes -- app.js

# Sprawdź status
git status

# Stwórz nowy commit cofnięcia
git commit -m "Revert: Rollback accessibility fixes from commit 3b608e0"
git push origin main
```

**Rezultat:** Historia git zachowana, ale zmiany wycofane.

---

### Opcja 2: Hard Rollback (usuń commit z historii)

⚠️ **UWAGA:** To zmienia historię Git. Używaj tylko jeśli nikto nie ciągnął zmian!

```bash
# Cofnij do tagu bezpieczeństwa
git reset --hard v-before-accessibility-fixes

# Wymuś push (NIEBEZPIECZNE!)
git push origin main --force-with-lease
```

**Rezultat:** Commit `3b608e0` zostaje usunięty z historii.

---

### Opcja 3: Selective Revert (wycofaj specific linię kodu)

```bash
# Jeśli chcesz wycofać tylko część zmian:

# 1. Otwórz app.js
# 2. Usuń zmiany ręcznie (patrz sekcja "Co Się Zmieniło" poniżej)
# 3. Commituj:
git add app.js
git commit -m "Partial revert: Remove focus-visible CSS (keep ARIA labels & keyboard)"
git push origin main
```

**Rezultat:** Usuniesz wybrane zmiany, zachowując inne.

---

## 📝 Co Się Zmieniło

### FIX #1: CSS Focus-Visible States
**Plik:** `index.html`  
**Linie:** 215-276  
**Zmiana:** Dodano 62 linie CSS focus-visible dla accessibility

**Aby wycofać:**
```html
<!-- USUŃ te linie z index.html (215-276): -->

/* Accessible focus states - visible keyboard navigation */
*:focus-visible {
    outline: 2px solid #00BAC7;
    outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[role="button"]:focus-visible {
    outline: 2px solid #00BAC7;
    outline-offset: 2px;
}

/* ... (wszystkie focus-visible selektory) */
```

---

### FIX #2: ARIA Labels & Role Attributes
**Plik:** `index.html`  
**Linie:** 2552-2575  
**Zmiana:** Dodano `aria-label`, `role="button"`, `tabindex="0"` na 10 elementach nawigacji

**Aby wycofać:**
```html
<!-- USUŃ te atrybuty z elementów nawigacji: -->

<!-- PRZED (usunąć): -->
<div class="nav-item" data-page="dashboard" 
     aria-label="Dashboard" role="button" tabindex="0">

<!-- PO (przywrócić): -->
<div class="nav-item" data-page="dashboard">
```

---

### FIX #3: Keyboard Handler (ENTER/SPACE)
**Plik:** `app.js`  
**Linie:** 3170-3177  
**Zmiana:** Dodano `keydown` event listener do `initNavigation()`

**Aby wycofać:**
```javascript
// USUŃ z app.js (linie 3170-3177):

// Keyboard navigation support
navItems.forEach(navItem => {
    navItem.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navItem.click();
        }
    });
});
```

---

## ✅ Weryfikacja Po Wycofaniu

Po wycofaniu sprawdź:

```bash
# 1. Pobierz ostatnią wersję z GitHub
git pull origin main

# 2. Sprawdź commit log
git log --oneline -5

# 3. Otwórz http://localhost:3000
# 4. Testuj nawigację:
#    - CTRL+R (odśwież)
#    - TAB - powinny NIE być widoczne cyan focus rings
#    - ENTER/SPACE - powinny NIC nie robić w nawigacji
```

---

## 📊 Rollback Checklist

- [ ] Zdecyduj którą opcję (Soft/Hard/Selective)
- [ ] Wykonaj odpowiednie komendy git
- [ ] Sprawdź `git log --oneline` czy commit wycofany
- [ ] Wykonaj `git push origin main`
- [ ] Odserwuj przeglądarkę (CTRL+F5)
- [ ] Potwierdź że zmiany wycofane
- [ ] Informuj zespół o wycofaniu

---

## 🆘 Jeśli Coś Pójdzie Źle

### Problem: Push się nie powiódł

```bash
# Sprawdź czy masz dostęp
git remote -v

# Jeśli remotes są SSH, zmień na HTTPS
git remote remove origin
git remote add origin https://github.com/bolttech-KamilaMolas/pace.git

# Spróbuj ponownie
git push origin main
```

### Problem: Nie wiesz który commit wycofać

```bash
# Pokaż ostatnie 10 commitów
git log --oneline -10

# Pokaż tagi (punkty bezpieczeństwa)
git tag -l -n1

# Wróć do konkretnego commitu
git reset --hard [commit-hash]
```

### Problem: Chcesz anulować wycofanie

```bash
# Pokaż co odrzuciłeś
git reflog

# Wróć do stanu sprzed wycofania
git reset --hard [hash-from-reflog]
```

---

## 📞 Kontakt / Porada

Jeśli nie jesteś pewny:
1. ✅ Zawsze rób Soft Rollback (opcja 1) — bezpieczniejsza
2. ✅ Nigdy nie używaj `--force` bez `--force-with-lease`
3. ✅ Testuj w lokalnym repo zanim push na GitHub
4. ✅ Zawsze sprawdzaj `git status` i `git diff` przed committem

---

## 🎯 Podsumowanie

| Opcja | Ryzyko | Szybkość | Rekomendacja |
|-------|--------|----------|--------------|
| Soft Rollback | ❌ Niskie | ✅ Szybka | ✅ **ZAWSZE** |
| Hard Rollback | 🔴 Wysokie | ✅✅ Bardzo szybka | ⚠️ Tylko lokalne |
| Selective | 🟡 Średnie | 🟡 Wolna | ✅ Dla précis zmian |

---

**Ostatni punkt bezpieczeństwa:** `v-before-accessibility-fixes`  
**Czy mogę wycofać?** ✅ **TAK - zawsze**

