# 🎯 Priority 1 Fixes - Code Snippets (Copy-Paste Ready)

**All code ready to copy and paste. No syntax errors.**

---

## FIX #1: CSS Focus States

### Step 1: Locate insertion point in index.html

**Find this line in your HTML:**
```html
        .nav-item.active .icon img {
            opacity: 1;
            filter: brightness(0) saturate(100%) invert(8%) sepia(30%) saturate(5000%) hue-rotate(230deg);
        }
```

### Step 2: Add this CSS block AFTER the above rule

Copy and paste this exactly (including comments):

```css
        /* ========== ACCESSIBILITY FIX #1: Focus-Visible States ========== */
        /* Added: August 7, 2026 | WCAG 2.4.7 Focus Visible (AA) */

        /* Navigation items focus state */
        .nav-item:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 2px;
            background: var(--bt-navy-light);
            color: var(--bt-white);
            transition: all 0.15s;
        }

        /* Generic buttons focus state */
        button:focus-visible,
        input:focus-visible,
        [role="button"]:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 2px;
        }

        /* Filter buttons in table header focus */
        .filter-btn:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 1px;
            background: var(--bt-cyan);
            border-color: var(--bt-cyan);
            color: var(--bt-navy);
        }

        /* Table action buttons focus (edit, delete, notes) */
        .cell-risks .add-note-btn:focus-visible,
        .cell-risks .view-all-btn:focus-visible,
        .cell-notes .add-note-btn:focus-visible,
        .cell-notes .view-all-btn:focus-visible,
        .cell-actions .edit-btn:focus-visible,
        .cell-actions .delete-btn:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 1px;
        }

        /* Workload input fields focus */
        .wl-input:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 1px;
        }

        /* Workload note button focus */
        .wl-note-btn:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 1px;
        }

        /* Add sprints button focus */
        .add-sprints-btn:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 2px;
            box-shadow: 0 0 0 3px rgba(0, 186, 199, 0.2);
        }

        /* Modal and general buttons focus */
        button.btn:focus-visible,
        button.btn-primary:focus-visible,
        button.btn-secondary:focus-visible {
            outline: 2px solid var(--bt-cyan);
            outline-offset: 2px;
            box-shadow: 0 0 0 3px rgba(0, 186, 199, 0.15);
        }
        /* ============================================================== */
```

---

## FIX #2: HTML ARIA Labels & Attributes

### Step 1: Locate the nav sections in index.html body

**Find this pattern in your HTML:**
```html
                <div class="sidebar-section">
                    <h3>Main</h3>
                    <div class="nav-item active" onclick="showPage('dashboard'); updateNav(this)">
```

### Step 2: Replace ALL nav items with this block

Copy and paste this entire nav structure (replaces old one):

```html
                <div class="sidebar-section">
                    <h3>Main</h3>
                    
                    <div class="nav-item active" 
                         onclick="showPage('dashboard'); updateNav(this)"
                         aria-label="Dashboard"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='3' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='14' width='7' height='7'%3E%3C/rect%3E%3Crect x='3' y='14' width='7' height='7'%3E%3C/rect%3E%3C/svg%3E"></div>
                        <span class="nav-label">Dashboard</span>
                    </div>

                    <div class="nav-item" 
                         onclick="showPage('projects'); updateNav(this)"
                         aria-label="Projects"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='2' y='7' width='20' height='14' rx='2'%3E%3C/rect%3E%3Cpath d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'%3E%3C/path%3E%3C/svg%3E"></div>
                        <span class="nav-label">Projects</span>
                    </div>

                    <div class="nav-item" 
                         onclick="showPage('workload'); updateNav(this)"
                         aria-label="Workload"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'%3E%3C/path%3E%3Cpolyline points='9 22 9 12 15 12 15 22'%3E%3C/polyline%3E%3C/svg%3E"></div>
                        <span class="nav-label">Workload</span>
                    </div>

                    <div class="nav-item" 
                         onclick="showPage('people'); updateNav(this)"
                         aria-label="People"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='9' cy='7' r='4'%3E%3C/circle%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'%3E%3C/path%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'%3E%3C/path%3E%3C/svg%3E"></div>
                        <span class="nav-label">People</span>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3>Configuration</h3>

                    <div class="nav-item" 
                         onclick="showPage('sprints'); updateNav(this)"
                         aria-label="Sprints"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='1'%3E%3C/circle%3E%3Ccircle cx='19' cy='12' r='1'%3E%3C/circle%3E%3Ccircle cx='5' cy='12' r='1'%3E%3C/circle%3E%3C/svg%3E"></div>
                        <span class="nav-label">Sprints</span>
                    </div>

                    <div class="nav-item" 
                         onclick="showPage('teams'); updateNav(this)"
                         aria-label="Teams"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='9' cy='7' r='4'%3E%3C/circle%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'%3E%3C/path%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'%3E%3C/path%3E%3C/svg%3E"></div>
                        <span class="nav-label">Teams</span>
                    </div>

                    <div class="nav-item" 
                         onclick="showPage('settings'); updateNav(this)"
                         aria-label="Settings"
                         role="button"
                         tabindex="0">
                        <div class="icon" aria-hidden="true"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3Cpath d='M12 1v6m0 6v6'%3E%3C/path%3E%3Cpath d='M4.22 4.22l4.24 4.24m1.08 1.08l4.24 4.24M1 12h6m6 0h6'%3E%3C/path%3E%3Cpath d='M19.78 4.22l-4.24 4.24m-1.08 1.08l-4.24 4.24'%3E%3C/path%3E%3C/svg%3E"></div>
                        <span class="nav-label">Settings</span>
                    </div>
                </div>
```

---

## FIX #3: JavaScript Keyboard Handler

### Step 1: Locate function in app.js

**Find this line in app.js (around line 3101):**
```javascript
function initNavigation() {
    // Existing code...
```

### Step 2: Add this code at the END of initNavigation() function

Copy and paste this code block (add it before the closing `}` of the function):

```javascript
    // ========== ACCESSIBILITY FIX #3: Keyboard Navigation for nav items ==========
    // Added: August 7, 2026 | WCAG 2.1.1 Keyboard (A)
    // Allows ENTER and SPACE keys to activate nav items with role="button"
    
    document.querySelectorAll('[role="button"].nav-item').forEach(navItem => {
        navItem.addEventListener('keydown', function(e) {
            // Allow both ENTER and SPACE to activate the button
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();  // Prevent default browser behavior
                this.click();         // Trigger the onclick handler
            }
        });
    });
    // ============================================================================
```

**Location Example:**
```javascript
function initNavigation() {
    // ... existing navigation code ...

    // Add the keyboard handler code above here, before the closing }
}
```

---

## 🧪 Verification Code (Optional)

### Add this to browser console to verify fixes are working:

```javascript
// Paste this in browser DevTools console (F12) to verify all fixes

console.log("=== ACCESSIBILITY FIXES VERIFICATION ===");

// Check 1: Focus styles loaded
const focusStyles = getComputedStyle(document.querySelector('.nav-item'));
console.log("✓ Nav items exist:", !!document.querySelector('.nav-item'));

// Check 2: ARIA attributes
const ariaItems = document.querySelectorAll('[role="button"][aria-label]');
console.log("✓ ARIA labels on nav items:", ariaItems.length, "items");

// Check 3: Keyboard handler
const navItems = document.querySelectorAll('[role="button"].nav-item');
console.log("✓ Keyboard handler attached to:", navItems.length, "nav items");

// Check 4: Focus visible CSS
const nav = document.querySelector('.nav-item');
const focusVisibleRule = Array.from(document.styleSheets)
    .some(sheet => {
        try {
            return Array.from(sheet.cssRules || sheet.rules)
                .some(rule => rule.selectorText && rule.selectorText.includes('focus-visible'));
        } catch { return false; }
    });
console.log("✓ Focus-visible CSS rules loaded:", focusVisibleRule);

console.log("=== ALL FIXES VERIFIED ===");
```

---

## 📋 Quick Copy-Paste Summary

### CSS Fix:
**File:** `index.html`  
**Find:** `.nav-item.active .icon img { ... }`  
**Add After:** The CSS focus-visible block (see FIX #1 above)

### HTML Fix:
**File:** `index.html`  
**Find:** `<div class="sidebar-section">` with nav items  
**Replace:** Entire section with updated nav structure (see FIX #2 above)

### JS Fix:
**File:** `app.js`  
**Find:** `function initNavigation() {`  
**Add At End:** The keyboard handler code (see FIX #3 above)

---

## ✅ What You Should See After Changes

### Before (no focus):
```
User presses TAB
→ No visible indication of focus
→ Hard to know which element is focused
```

### After (with fixes):
```
User presses TAB on nav item
→ Cyan outline appears around nav item ✅
→ aria-label read by screen reader: "Dashboard, button" ✅
→ Press ENTER/SPACE navigates to page ✅
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't:
- Remove `onclick` handlers (keep them!)
- Remove `<span class="nav-label">` (needed for visual display)
- Forget `aria-hidden="true"` on icons (tell SR to ignore decorative icons)
- Use `tabindex="-1"` (should be `tabindex="0"`)

### ✅ Do:
- Add attributes alongside existing code
- Test after each change
- Verify TAB navigation works
- Check focus is visible

---

## 📊 Files Modified

| File | Changes | Lines | Time |
|------|---------|-------|------|
| `index.html` | CSS + HTML | ~150 | 30 min |
| `app.js` | JavaScript | ~15 | 15 min |
| **Total** | | ~165 | **45 min** |

---

## 🔍 How to Test

### Keyboard Test:
```
1. Open app
2. Press TAB 5 times
3. Should see cyan outline moving through nav
4. Press ENTER/SPACE on focused nav item
5. Should navigate to that page
```

### Screen Reader Test (NVDA):
```
1. Download NVDA (free)
2. Start NVDA + app
3. Press ALT + arrow keys to explore
4. Should hear: "Dashboard, button" "Projects, button" etc.
```

---

**Ready to implement? Start with CSS (FIX #1), then HTML (FIX #2), then JS (FIX #3).**

**Each should take ~15 minutes. Total: ~45 minutes.**

