# 🔗 JIRA Integration Design - Capacity Planner Alokacje

**Data:** August 7, 2026  
**Status:** 🟢 **IMPLEMENTATION IN PROGRESS** - Backend configured, API endpoint updated  
**Scope:** Auto-load task assignments from Jira to populate allocations  
**Estimates:** Original Estimate (Dev) + Test Estimate (QA)

## ⚡ Latest Update (Aug 7, 2026 - FINAL)

### ✅ Completed
- ✅ Python Flask backend initialized with 6 endpoints (app.py)
- ✅ Jira credentials configured (token: Kama Kiro - kamila.molas@bolttech.pl)
- ✅ Direct Jira API connection tested ✅ (KAMILA MOLAS logged in successfully)
- ✅ Updated API endpoint from deprecated `/rest/api/3/search` → `/rest/api/3/search/jql`
- ✅ Field IDs verified and documented (cf[10270], timeoriginalestimate, cf[10695])
- ✅ Conversion formula: **1 MD = 28800 seconds** ✅
- ✅ Mock data generated: 8 test LSG issues with cross-team allocations
- ✅ Backend committed to GitHub (commit 718fda2)
- ✅ Documentation: DEPLOYMENT_STATUS.md, IMPLEMENTATION_NOTES.md
- ✅ Mock test data: `mock_lsg_issues.json` (ready for frontend testing)

### 📊 Test Data Summary (Mock LSG Issues)
**Total: 8 issues, 4 unique assignees from different teams**

| Person | Team/Project | Issues | Dev MD | QA MD |
|--------|--------------|--------|--------|-------|
| Kamila Molas | Operations Excellence III | 3 | 10.0 | 5.5 |
| Mikołaj Banaszkiewicz | Dynamic Pricing + Feature Flags | 2 | 6.0 | 3.0 |
| Żaneta Fedor-Zalewska | Infrastructure (QA only) | 2 | 0.0 | 5.0 |
| Tomasz Nowak | Technical Debt | 1 | 1.5 | 0.0 |
| **TOTALS** | | **8** | **17.5** | **13.5** |

### 🔄 Ready for Next Phase
- Backend API: ✅ Ready for testing
- Mock data: ✅ Available (`mock_lsg_issues.json`)
- Frontend integration: ⏭️ Next (add import modal)
- Real Jira fetch: ⏭️ When API available

### 📋 Next Steps (Frontend)
1. Add import modal to capacity-planner index.html
2. Wire up `/api/jira/import` endpoint
3. Parse response and merge allocations
4. Test with mock data first, then real Jira

---

## 🎯 Cel

System będzie:
1. ✅ **Pobierać zadania z Jira** na podstawie JQL query
2. ✅ **Mapować assignees → pracownicy** w capacity-planner
3. ✅ **Łączyć zadania z projektami** poprzez "Project Name" custom field (cf[10270])
4. ✅ **Wyliczać alokacje tygodniowe** na podstawie Original Estimate (dev) / Test Estimate (QA)
5. ✅ **Umożliwić uzupełnianie danych ręcznie** lub importem

---

## 📊 Mapowanie Pól Jira

| Jira Field | Field ID | Capacity Planner | Typ | Uwagi |
|-----------|----------|-----------------|-----|-------|
| **Assignee** | (standard) | Person Name | String | "Imię Nazwisko" |
| **Project Name** | cf[10270] | Project.name | String | Np. "ALF", "Operations Excellence III" |
| **Sprint** | (standard) | Sprint ID | Int | 9910, 9675, etc. |
| **Original Estimate** | timeoriginalestimate | Dev Time | Seconds → MD | Czas pracy developera (konwersja: ÷28800 = man-days) |
| **Test Estimate** | cf[10695] | QA Time | Seconds → MD | Czas pracy testera (konwersja: ÷28800 = man-days) |
| **Status** | (standard) | Status | String | in-progress, done, etc. |
| **Issue Type** | (standard) | Category | String | Story, Task, Bug |

✅ **POTWIERDZONO:** Wszystkie field IDs zweryfikowane na instancji Jira

---

## 📋 JQL Query

```jql
project = "LSG" AND sprint IN (9910, 9675, 9609, 9576, 9811) ORDER BY "cf[10270]" ASC
```

---

## 🔄 Przepływ Danych

```
┌─────────────────────────────────────────────┐
│   Jira Issue                                │
├─────────────────────────────────────────────┤
│ • Assignee: "Kamila Molas"                  │
│ • Project: cf[10270] = "ALF"                │
│ • Sprint: 9910                              │
│ • Original Estimate: 86400 sec (3 MD)       │
│ • Test Estimate: 43200 sec (1.5 MD)         │
│ • Status: In Progress                       │
│ • Summary: "Implement feature X"            │
└─────────────────────────────────────────────┘
                    ↓
            [MAPUJ DANE]
                    ↓
        ┌───────────────────────┐
        │ 1. Mapuj assignee     │
        │    → Kamila Molas ✅   │
        ├───────────────────────┤
        │ 2. Mapuj project      │
        │    → Operations ... ✅ │
        ├───────────────────────┤
        │ 3. Mapuj sprint       │
        │    → Sprint 270 ✅     │
        ├───────────────────────┤
        │ 4. Określ rolę osoby  │
        │    → Squad Lead       │
        ├───────────────────────┤
        │ 5. Wybierz estimate   │
        │    → Original (dev) ✅ │
        └───────────────────────┘
                    ↓
        [OBLICZ ALOKACJĘ]
                    ↓
        Estimate: 3 MD (86400 sec)
        Team capacity: 10 devs × 10 dni = 100 MD/sprint
        Allocation % = (3 / 100) × 100 = 3%
                    ↓
        ┌──────────────────────────────────┐
        │ Capacity Planner                 │
        ├──────────────────────────────────┤
        │ allocations[sprintId]:           │
        │ {                                │
        │   people: {                      │
        │     "Kamila Molas": {            │
        │       projectId: 18,             │
        │       percent: 3%,               │
        │       estimateMD: 3,             │
        │       jiraKey: "LSG-123",        │
        │       source: "jira"             │
        │     }                            │
        │   }                              │
        │ }                                │
        └──────────────────────────────────┘
```

---

## 🏗️ Architektura Integracji

### Rekomendowane: Backend Proxy

```
Client (Capacity Planner)
  ↓
  │ POST /api/jira/import
  │ { jiraToken, jqlQuery }
  ↓
Backend (Node.js / Python)
  ↓
  │ GET https://jira.example.com/rest/api/3/search
  │ with: Authorization header
  ↓
  │ Response: Issues[] with all fields
  ↓
  │ Transform & map to allocations
  ↓
  │ Return JSON
  ↓
Client receives → Merge into PROJECTS[].allocations
```

**Zalety:**
- ✅ Secure (token on server)
- ✅ No CORS issues
- ✅ Server-side transformations
- ✅ Caching possible

---

## 📥 Jira API Response

```json
{
  "issues": [
    {
      "id": "10001",
      "key": "LSG-123",
      "fields": {
        "assignee": {
          "displayName": "Kamila Molas",
          "emailAddress": "kamila.molas@example.com"
        },
        "customfield_10270": "ALF",           // Project Name
        "sprint": { "id": 9910, "name": "Sprint 270" },
        "timeoriginalestimate": 86400,        // Original Estimate (sekundy)
        "customfield_10695": 43200,           // Test Estimate (sekundy)
        "status": { "name": "In Progress" },
        "summary": "Implement new feature",
        "issuetype": { "name": "Story" }
      }
    }
  ]
}
```

**Konwersja jednostek:**
- `timeoriginalestimate` i `cf[10695]` zwracają **sekundy**
- **Konwersja:** 1 man-day = 8 godzin = 28800 sekund
- **Formula:** `md = seconds / 28800`
- **Przykład:** 86400 sec = 3 MD, 43200 sec = 1.5 MD

---

## ⚙️ Algorytm Kalkulacji Alokacji

```javascript
function calculateAllocationFromJiraIssue(issue, person, project, sprint) {
    // KROK 1: Konwertuj Jira time estimates (sekundy) na man-days
    const originalEstimateSeconds = issue.fields.timeoriginalestimate || 0;
    const testEstimateSeconds = issue.fields.customfield_10695 || 0;
    
    const originalEstimateMD = originalEstimateSeconds / 28800; // man-days
    const testEstimateMD = testEstimateSeconds / 28800;
    
    // KROK 2: Wybierz właściwy estimate na podstawie roli
    let estimateMD = 0;
    
    if (person.role === 'QA' || person.role === 'QAE' || person.role === 'QA coordinator') {
        // QA person → Test Estimate
        estimateMD = testEstimateMD;
    } else {
        // Dev person (BE Developer, FE Developer, TSM, etc.) → Original Estimate
        estimateMD = originalEstimateMD;
    }
    
    if (estimateMD === 0) {
        console.warn(`Issue ${issue.key} has no estimate for ${person.role}`);
        return null;
    }
    
    // KROK 3: Wylicz team capacity na sprint
    // Sprint = 10 dni roboczych, capacity = liczba developerów × 10
    const devMembers = PEOPLE.filter(p => 
        p.team === person.team && 
        !['QA', 'QAE', 'QA coordinator'].includes(p.role)
    );
    const sprintCapacityMD = Math.max(devMembers.length * 10, 1);
    
    // KROK 4: Oblicz allocation %
    const allocatedPercent = Math.ceil((estimateMD / sprintCapacityMD) * 100);
    
    return {
        person: person.name,
        project: project.name,
        sprint: sprint.id,
        devEstimate: originalEstimateMD,
        qaEstimate: testEstimateMD,
        usedEstimate: estimateMD,
        allocatedPercent: Math.min(allocatedPercent, 100), // Cap at 100%
        jiraKey: issue.key,
        jiraSummary: issue.fields.summary,
        role: person.role
    };
}
```

---

## 📊 Struktura Alokacji (Enhanced)

```javascript
// BEFORE (team-level only)
allocations: {
    "0": {
        "ALF": 65,
        "WAREX": 30
    }
}

// AFTER (team-level + person-level tracking)
allocations: {
    "0": {
        "teams": {
            "ALF": 65,          // Aggregate: 40% manual + 25% from Jira
            "WAREX": 30
        },
        "people": {
            "Kamila Molas": {
                projectId: 18,                          // Operations Excellence
                percent: 25,                            // Alokacja na ten projekt/sprint
                estimateMD: 3,                          // Original Estimate
                jiraKey: "LSG-123",
                source: "jira"                          // 'jira' or 'manual'
            },
            "Mikołaj Banaszkiewicz": {
                projectId: 7,                           // Dynamic Pricing
                percent: 15,
                estimateMD: 2,
                jiraKey: "LSG-124",
                source: "jira"
            },
            // ... more people
        }
    }
}
```

---

## 🎛️ UI Components

### Import Button (Settings tab)

```html
<button id="import-from-jira" class="btn-primary">
    ⬇️ Importuj Alokacje z Jiry
</button>
```

### Import Modal

```html
<div id="jira-import-modal" class="modal">
    <h2>Importuj Alokacje z Jiry</h2>
    
    <div class="form-group">
        <label>Jira API Token (zostanie wysłany bezpiecznie):</label>
        <input type="password" id="jira-token" placeholder="Paste your token...">
        <small>ⓘ Token wysłany bezpiecznie na backend, nie przechowywany lokalnie</small>
    </div>
    
    <div class="form-group">
        <label>JQL Query:</label>
        <textarea id="jira-jql" rows="4" placeholder='project = "LSG" AND sprint IN (9910, 9675, 9609, 9576, 9811)'>
        </textarea>
    </div>
    
    <button id="preview-btn" class="btn-secondary">👁️ Podgląd (bez importu)</button>
    
    <!-- Preview Section -->
    <div id="jira-preview" class="preview" style="display:none;">
        <h3>📋 Podgląd importu</h3>
        <p>Znaleziono: <strong id="preview-count">0</strong> zadań</p>
        
        <table class="preview-table">
            <thead>
                <tr>
                    <th>Jira Key</th>
                    <th>Summary</th>
                    <th>Assignee</th>
                    <th>Project</th>
                    <th>Sprint</th>
                    <th>Dev MD</th>
                    <th>QA MD</th>
                    <th>Allocation %</th>
                </tr>
            </thead>
            <tbody id="preview-rows">
                <!-- Dynamically populated -->
            </tbody>
        </table>
    </div>
    
    <div class="modal-actions">
        <button id="import-btn" class="btn-primary">✅ Importuj do Capacity Planner</button>
        <button id="cancel-btn" class="btn-tertiary">❌ Anuluj</button>
    </div>
</div>
```

---

## 🚀 Implementation Roadmap

### Phase 1: Backend Proxy (1-2 dni)

```javascript
// backend/jira-service.js
async function fetchJiraIssues(jiraUrl, token, jqlQuery) {
    const response = await fetch(`${jiraUrl}/rest/api/3/search`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${Buffer.from(`bot@example.com:${token}`).toString('base64')}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            jql: jqlQuery,
            fields: [
                'assignee',
                'project',
                'sprint',
                'customfield_10270',      // Project Name
                'timeoriginalestimate',   // Original Estimate
                'customfield_10695',      // Test Estimate
                'status',
                'summary',
                'issuetype'
            ],
            maxResults: 100
        })
    });
    
    if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
    }
    
    return response.json();
}
```

### Phase 2: Mapping & Transformation (1-2 dni)

```javascript
// backend/allocation-mapper.js
function transformJiraToAllocations(issues) {
    const allocations = {};
    
    issues.forEach(issue => {
        // Mapuj assignee → person
        const person = mapJiraAssigneeToPerson(issue.fields.assignee);
        if (!person) return;
        
        // Mapuj project
        const project = mapJiraProjectToCapacityProject(issue.fields.customfield_10270);
        if (!project) return;
        
        // Mapuj sprint
        const sprint = SPRINTS.find(s => s.id === issue.fields.sprint?.id);
        if (!sprint) return;
        
        // Oblicz alokację
        const alloc = calculateAllocationFromJiraIssue(issue, person, project, sprint);
        if (!alloc) return;
        
        // Merge do allocations[sprintId][person.name]
        if (!allocations[sprint.id]) allocations[sprint.id] = { people: {} };
        if (!allocations[sprint.id].people) allocations[sprint.id].people = {};
        
        allocations[sprint.id].people[person.name] = {
            projectId: project.id,
            percent: alloc.allocatedPercent,
            estimateMD: alloc.usedEstimate,
            jiraKey: alloc.jiraKey,
            source: 'jira'
        };
    });
    
    return allocations;
}
```

### Phase 3: Frontend UI (1 dzień)

```javascript
// frontend/jira-import.js
document.getElementById('import-btn').addEventListener('click', async () => {
    const token = document.getElementById('jira-token').value;
    const jqlQuery = document.getElementById('jira-jql').value;
    
    showSpinner('Pobieranie z Jiry...');
    
    const result = await fetch('/api/jira/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, jqlQuery })
    }).then(r => r.json());
    
    if (result.error) {
        showError(result.error);
        return;
    }
    
    // Merge do PROJECTS
    Object.keys(result.allocations).forEach(sprintId => {
        PROJECTS.forEach(project => {
            if (!project.allocations[sprintId]) {
                project.allocations[sprintId] = {};
            }
            
            Object.assign(
                project.allocations[sprintId],
                result.allocations[sprintId].people || {}
            );
        });
    });
    
    saveProjects();
    renderCapacityBars();
    closeModal();
    showSuccess(`✅ Zaimportowano ${result.issueCount} zadań`);
});
```

### Phase 4: Testing (1 dzień)

- ✅ Test z real Jira data (LSG project)
- ✅ Verify field IDs (cf[10270], cf[10695])
- ✅ Test name matching (Jira → capacity-planner)
- ✅ Verify estimate conversion (seconds → man-days)
- ✅ Handle edge cases (no assignee, no estimate, etc.)

---

## 🧪 Test Scenarios

### Scenario 1: Perfect Match
```
Jira Issue:
  Assignee: "Kamila Molas"
  Project: cf[10270] = "ALF"
  Sprint: 9910
  Original Estimate: 86400 sec (3 MD)
  Test Estimate: 0
  Role: Squad Lead (dev)

Result:
  ✅ Mapuje się do: Capacity Planner → Kamila Molas
  ✅ Projekt: Operations Excellence in ALF (Phase 3)
  ✅ Alokacja: 3% (3 MD / 100 MD team capacity)
```

### Scenario 2: QA Developer
```
Jira Issue:
  Assignee: "Żaneta Fedor-Zalewska"
  Project: cf[10270] = "KAP"
  Sprint: 9910
  Original Estimate: 0
  Test Estimate: 43200 sec (1.5 MD)
  Role: QA

Result:
  ✅ Używa Test Estimate (1.5 MD)
  ✅ Alokacja: 15% (1.5 / 10 QA capacity)
```

### Scenario 3: Name Mismatch
```
Jira Issue:
  Assignee: "K. Molas" (nickname, not full name)
  
Result:
  ⚠️ NOT FOUND → Log warning, skip this issue
  💡 Fallback: Manual mapping via email match
```

### Scenario 4: Mixed Mode (Manual + Jira)
```
Before Import:
  Kamila Molas: 40% manual on Project A

Jira Import:
  Kamila Molas: 25% on Project B (Jira)

After Merge:
  Kamila Molas: 40% (Project A, manual) + 25% (Project B, Jira) = 65% total
```

---

## 📝 Checklist Implementacji

- [ ] **Backend Setup**
  - [ ] Create `/api/jira/import` endpoint
  - [ ] Implement Jira API calls
  - [ ] Add error handling

- [ ] **Field Verification**
  - [ ] ✅ Confirm cf[10270] = Project Name
  - [ ] ✅ Confirm cf[10695] = Test Estimate (MD)
  - [ ] ✅ Confirm timeoriginalestimate = Original Estimate

- [ ] **Name Mapping**
  - [ ] Build mapping table: Jira email → Capacity person
  - [ ] Test fuzzy matching
  - [ ] Document exceptions

- [ ] **Estimate Conversion**
  - [ ] ✅ Formula: md = seconds / 28800
  - [ ] Test with sample estimates
  - [ ] Verify calculation

- [ ] **Error Handling**
  - [ ] Connection failures
  - [ ] Auth failures (invalid token)
  - [ ] Malformed responses
  - [ ] Partial imports (some issues fail)
  - [ ] No assignee
  - [ ] No estimate

- [ ] **UI/UX**
  - [ ] Design import modal
  - [ ] Implement preview feature
  - [ ] Add progress indicator
  - [ ] Show import results
  - [ ] Success/error messages

- [ ] **Testing**
  - [ ] Unit tests: mapping functions
  - [ ] Integration tests: end-to-end flow
  - [ ] Manual testing: with real Jira data (LSG)
  - [ ] Edge cases: no estimate, no assignee, etc.

- [ ] **Documentation**
  - [ ] Update README with import instructions
  - [ ] Document API endpoint
  - [ ] Create troubleshooting guide

---

## 🔐 Security Checklist

- [ ] **Token Handling**
  - [ ] Never store token in localStorage
  - [ ] Send via HTTPS only
  - [ ] Clear from memory after use

- [ ] **Data Privacy**
  - [ ] Sanitize Jira data
  - [ ] Log access to Jira API
  - [ ] Cache data responsibly (1 hour max)
  - [ ] Allow users to clear import cache

- [ ] **API Security**
  - [ ] Rate limiting on backend
  - [ ] Validate JQL query (prevent injection)
  - [ ] Authenticate backend requests

---

## 🔀 Mapowanie Jira Status → Zakres (Scope) Alokacji

**Proposal:** Jira issue status mapuje się na "etap" / "zakres" (scope) w sekcji alokacji

### Jira Standard Workflow Statuses

```
Typowy workflow Jiry:
To Do → In Progress → In Review/Testing → Done
(+ możliwe: Blocked, On Hold, Cancelled)
```

### Mapowanie: Jira Status → Capacity-Planner Zakres

| Jira Status | Capacity-Planner Zakres | Opis | Alokacja % |
|-----------|-------------------------|------|-----------|
| **To Do** | 📋 `Planowany` / `Backlog` | Zadanie zaplanowane, czeka na start | 0-10% |
| **In Progress** | 🔄 `W realizacji` | Dev/QA aktualnie pracuje | 50-100% |
| **In Development** | 🔄 `DEV` | Faza development | 80-100% |
| **In Testing** / **In Review** | 🧪 `Testing` / `Testing & Review` | Faza QA testing | 50-100% |
| **In UAT** | 📊 `UAT` | User acceptance testing | 30-80% |
| **Ready for Production** | 📤 `Gotowy do deploy` | Ready, oczekuje wdrożenia | 10-20% |
| **Done** | ✅ `Ukończony` | Completed | 0% |
| **Blocked** | 🚫 `Zablokowany` | Czeka na coś | 5-20% |
| **On Hold** | ⏸️ `Wstrzymany` | Tymczasowo zatrzymane | 0-5% |
| **Cancelled** | ❌ `Anulowany` | Nie będzie realizowane | 0% |

### Przykład Flow dla Jiry → Capacity-Planner

```
LSG-123: "Implement Feature X"

Jira Timeline:
  [To Do] (2026-08-01)
    ↓
  [In Progress] (2026-08-05) ← Dev starts
    ↓ (Original Estimate: 3 MD)
  [In Testing] (2026-08-15) ← QA starts
    ↓ (Test Estimate: 1.5 MD)
  [In UAT] (2026-08-20)
    ↓
  [Done] (2026-08-27)

Capacity-Planner Allocations (auto-populated from Jira):

Sprint 270 (Aug 05-16):
  Kamila Molas (Dev, Squad Lead)
    Project: Operations Excellence
    Scope: 🔄 W realizacji
    MD: 3
    Allocation: 30%
    Jira Key: LSG-123
    Comment: "Implement Feature X"

Sprint 271 (Aug 19-30):
  Żaneta Fedor-Zalewska (QA)
    Project: Operations Excellence
    Scope: 🧪 Testing
    MD: 1.5
    Allocation: 15%
    Jira Key: LSG-123
    Comment: "Implement Feature X"
```

### Implementacja: Auto-Mapowanie Status

```javascript
function mapJiraStatusToScope(jiraStatusName) {
    const statusMap = {
        'To Do': 'planowany',
        'Backlog': 'planowany',
        'In Progress': 'w_realizacji',
        'In Development': 'dev',
        'In Testing': 'testing',
        'In Review': 'review',
        'In QA': 'testing',
        'In UAT': 'uat',
        'Ready for Prod': 'ready_deploy',
        'Ready for Production': 'ready_deploy',
        'Done': 'done',
        'Closed': 'done',
        'Blocked': 'blocked',
        'On Hold': 'on_hold',
        'Cancelled': 'cancelled'
    };
    
    // Fuzzy match (case-insensitive, partial)
    for (const [jiraStatus, scope] of Object.entries(statusMap)) {
        if (jiraStatusName.toLowerCase().includes(jiraStatus.toLowerCase())) {
            return scope;
        }
    }
    
    // Default to "w_realizacji" if not found
    return 'w_realizacji';
}
```

### Dodatkowe Pola w Alokacji (from Jira)

```javascript
// Struktura alokacji (enhanced)
allocations: {
    "sprintId": {
        "people": {
            "Kamila Molas": {
                projectId: 18,
                percent: 30,
                estimateMD: 3,
                scope: "w_realizacji",              // ✅ Z Jiry
                comment: "Implement Feature X",    // ✅ Z Jiry (issue summary)
                jiraKey: "LSG-123",                // ✅ Link do Jiry
                source: "jira",
                updatedAt: "2026-08-07T10:30:00Z" // timestamp
            }
        }
    }
}
```

### UI: Allocation Modal (Enhanced)

```html
<!-- Modal do dodawania/edycji alokacji -->
<div class="modal" id="allocation-modal">
    <h3>Alokacja pracownika</h3>
    
    <!-- Project selection -->
    <div class="form-group">
        <label>Projekt:</label>
        <select id="alloc-project">
            <option value="18">Operations Excellence in ALF (Phase 3)</option>
            <option value="7">Dynamic Pricing</option>
            <!-- ... more projects -->
        </select>
    </div>
    
    <!-- Scope/Stage selection -->
    <div class="form-group">
        <label>Etap/Zakres:</label>
        <select id="alloc-scope">
            <option value="planowany">📋 Planowany / Backlog</option>
            <option value="w_realizacji">🔄 W realizacji</option>
            <option value="dev">🔄 DEV</option>
            <option value="testing">🧪 Testing / Review</option>
            <option value="uat">📊 UAT</option>
            <option value="ready_deploy">📤 Gotowy do deploy</option>
            <option value="done">✅ Ukończony</option>
            <option value="blocked">🚫 Zablokowany</option>
            <option value="on_hold">⏸️ Wstrzymany</option>
        </select>
    </div>
    
    <!-- Allocation % -->
    <div class="form-group">
        <label>Alokacja %:</label>
        <input type="number" id="alloc-percent" min="0" max="100" value="50" />
    </div>
    
    <!-- Estimated MD (auto-calculated from Jira or manual) -->
    <div class="form-group">
        <label>Szacunek (MD):</label>
        <input type="number" id="alloc-md" min="0" step="0.5" value="3" />
        <small>ⓘ Pobrane z Jiry lub wpisz ręcznie</small>
    </div>
    
    <!-- Comment / Issue Summary -->
    <div class="form-group">
        <label>Komentarz / Nazwa zadania:</label>
        <input type="text" id="alloc-comment" placeholder="Np. Implement Feature X" />
        <small>ⓘ Automatycznie pobrane z Jiry (issue summary)</small>
    </div>
    
    <!-- Jira Link (read-only if from Jira) -->
    <div class="form-group">
        <label>Jira Key:</label>
        <input type="text" id="alloc-jira-key" placeholder="LSG-123" />
        <small>ⓘ Jeśli pusta, to alokacja ręczna</small>
    </div>
    
    <!-- Source indicator -->
    <div class="form-group">
        <span style="font-size:11px;color:var(--bt-grey-400);">
            Źródło: <strong id="alloc-source">Manual</strong>
        </span>
    </div>
    
    <!-- Buttons -->
    <button id="save-alloc-btn" class="btn-primary">Zapisz</button>
    <button id="cancel-alloc-btn" class="btn-tertiary">Anuluj</button>
</div>
```

### Import from Jira: Auto-fill

```javascript
// Po imporcie z Jiry:
const jiraIssue = {
    key: "LSG-123",
    summary: "Implement Feature X",
    status: "In Testing",
    assignee: "Żaneta Fedor-Zalewska",
    customfield_10695: 43200  // 1.5 MD
};

// System automatycznie wypełnia:
document.getElementById('alloc-comment').value = jiraIssue.summary;
document.getElementById('alloc-jira-key').value = jiraIssue.key;
document.getElementById('alloc-scope').value = mapJiraStatusToScope(jiraIssue.status); // "testing"
document.getElementById('alloc-md').value = jiraIssue.customfield_10695 / 28800; // 1.5
document.getElementById('alloc-source').textContent = 'Jira';
```

### Scenariusz użycia: Manual + Jira Mix

```
User może:
1. ✅ Zaimportować zadania z Jiry (auto-populate scope, comment, MD, Jira Key)
2. ✅ Ręcznie dodać alokacje (pusta Jira Key = manual)
3. ✅ Edytować zaimportowane (zmienić scope, comment, MD)
4. ✅ Zobaczyć źródło każdej alokacji (Jira vs Manual)
```

---

1. ✅ **Design zatwierdzony** — Field IDs potwierdzeni
2. 📋 **Przygotuj backend** — Node.js endpoint `/api/jira/import`
3. 🧪 **Test API Jiry** — Pobierz sample issues z LSG
4. 🎨 **Implementuj UI** — Import modal + preview
5. 🚀 **Testuj end-to-end** — Importuj rzeczywiste dane
6. ✨ **Deploy** — Push do GitHub, merge to main

---

---

## 🗓️ Sprint Planning Logic - Future Sprint Detection

### Problem
Capacity planner musi wiedzieć:
- 🔍 Jaki sprint jest **bieżący** (current)?
- 📅 Jakie sprinty są **przyszłe** (upcoming)?
- 📊 Które sprinty mają **zaplanowane prace** (issues assigned)?
- 🔄 Kiedy **aktualizować cache** (jak się zmienia konfiguracja)?

### Rozwiązanie: Sprint Detection Algorithm

```javascript
/**
 * Detectuje bieżący i przyszłe sprinty z Jiry
 * - Pobiera wszystkie sprinty z projektu
 * - Sortuje po datach (BOARD state)
 * - Mapuje na capacity-planner PROJECTS[].sprints[]
 */

async function detectCurrentAndUpcomingSprints(jiraUrl, token, projectKey) {
    // KROK 1: Pobierz wszystkie sprinty z Jiry
    const sprintsResponse = await fetch(
        `${jiraUrl}/rest/api/3/board/[boardId]/sprint?state=active,future`,
        {
            headers: {
                'Authorization': `Basic ${btoa(`bot:${token}`)}`,
                'Accept': 'application/json'
            }
        }
    );
    
    const sprintsData = await sprintsResponse.json();
    // Wynik:
    // [
    //   { id: 9910, name: "Sprint 270", state: "active", startDate: "2026-08-05", endDate: "2026-08-16" },
    //   { id: 9911, name: "Sprint 271", state: "future", startDate: "2026-08-19", endDate: "2026-08-30" },
    //   { id: 9912, name: "Sprint 272", state: "future", startDate: "2026-09-02", endDate: "2026-09-13" },
    // ]
    
    // KROK 2: Dla każdego sprintu, sprawdź czy ma issues (prace zaplanowane)
    const sprintsWithIssues = [];
    
    for (const sprint of sprintsData.values) {
        // Query: ile issues w tym sprincie?
        const issuesCount = await fetch(
            `${jiraUrl}/rest/api/3/search?jql=sprint=${sprint.id}&fields=key`,
            {
                headers: { 'Authorization': `Basic ${btoa(`bot:${token}`)}` }
            }
        )
        .then(r => r.json())
        .then(data => data.total);
        
        sprintsWithIssues.push({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,  // 'active', 'future', 'closed'
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            issuesCount: issuesCount,
            hasWork: issuesCount > 0
        });
    }
    
    // KROK 3: Kategoryzuj sprinty
    const result = {
        current: sprintsWithIssues.find(s => s.state === 'active'),
        upcoming: sprintsWithIssues.filter(s => s.state === 'future'),
        upcoming_with_work: sprintsWithIssues.filter(s => 
            s.state === 'future' && s.hasWork
        ).slice(0, 3)  // Następne 3 sprinty z pracą
    };
    
    return result;
}

// Rezultat:
// {
//   current: {
//     id: 9910,
//     name: "Sprint 270",
//     state: "active",
//     startDate: "2026-08-05",
//     endDate: "2026-08-16",
//     issuesCount: 24,
//     hasWork: true
//   },
//   upcoming: [
//     { id: 9911, name: "Sprint 271", hasWork: true, issuesCount: 15 },
//     { id: 9912, name: "Sprint 272", hasWork: false, issuesCount: 0 },
//     { id: 9913, name: "Sprint 273", hasWork: true, issuesCount: 8 }
//   ],
//   upcoming_with_work: [
//     { id: 9911, name: "Sprint 271", issuesCount: 15 },
//     { id: 9913, name: "Sprint 273", issuesCount: 8 }
//   ]
// }
```

### Kiedy Wykonywać Sprint Detection?

```javascript
// TRIGGER 1: OnClick - Manual refresh (Settings tab)
document.getElementById('detect-sprints-btn').addEventListener('click', async () => {
    const sprints = await detectCurrentAndUpcomingSprints(...);
    updateSprintSelector(sprints);
    saveSprintConfig(sprints);
});

// TRIGGER 2: OnAppStart - Jeśli sprint konfiguracja >24h stara
async function initializeSprintsOnAppStart() {
    const lastDetectionTime = localStorage.getItem('last_sprint_detection');
    const now = Date.now();
    
    if (!lastDetectionTime || (now - lastDetectionTime) > 86400000) { // 24h
        console.log("🔄 Detecting sprints (>24h since last detection)");
        const sprints = await detectCurrentAndUpcomingSprints(...);
        updateSprintSelector(sprints);
        localStorage.setItem('last_sprint_detection', now);
    }
}

// TRIGGER 3: OnSprintChange - Jeśli z UI zmienisz sprint (Settings)
document.getElementById('sprint-selector').addEventListener('change', async (e) => {
    const selectedSprintId = e.target.value;
    console.log(`🔄 Sprint zmieniony na ${selectedSprintId}, aktualizuję cache...`);
    invalidateCacheForSprint(selectedSprintId);
    reloadAllocationsForSprint(selectedSprintId);
});
```

### UI: Sprint Configuration (Settings tab)

```html
<div class="settings-section">
    <h3>⚙️ Konfiguracja Sprintów</h3>
    
    <div class="form-group">
        <label>Bieżący Sprint:</label>
        <select id="current-sprint-select">
            <!-- Populated by detectCurrentAndUpcomingSprints() -->
            <option value="9910">🔴 Sprint 270 (Aug 05-16) - ACTIVE - 24 issues</option>
        </select>
        <button id="detect-sprints-btn" class="btn-secondary">🔄 Detectuj Sprinty</button>
    </div>
    
    <div class="form-group">
        <label>Przyszłe Sprinty (z pracą):</label>
        <div id="upcoming-sprints-list">
            <!-- Populated by detectCurrentAndUpcomingSprints() -->
            <span>📅 Sprint 271 (Aug 19-30) - 15 issues</span><br>
            <span>📅 Sprint 273 (Sep 02-13) - 8 issues</span>
        </div>
    </div>
    
    <div class="info-box">
        ℹ️ System będzie automatycznie pobierać prace z bieżącego i następnych 3 sprintów.
        <br/>Ostatnia aktualizacja: <strong id="last-sprint-update">never</strong>
        <br/>Następna automatyczna: <strong id="next-sprint-update">2026-08-08 10:30</strong>
    </div>
</div>
```

---

## 💾 Caching Strategy - Redis + Smart Invalidation

### Problem
- Jira API has rate limits (429 Too Many Requests)
- Capacity planner loads frequently
- Need to balance: **fresh data** vs **performance**

### Rozwiązanie: Redis Cache + TTL-based Invalidation

```javascript
/**
 * Redis Cache Strategy
 * 
 * Cache Key Structure:
 * - jira:sprint:9910:issues → issues list (TTL: 1h)
 * - jira:sprint:9910:allocations → calculated allocations (TTL: 1h)
 * - jira:config:current_sprint → current sprint info (TTL: 24h)
 * - jira:config:sprints_list → all sprints (TTL: 24h)
 */

const redis = require('redis').createClient();
const CACHE_TTL = {
    ISSUES: 3600,           // 1 hour - issues list
    ALLOCATIONS: 3600,      // 1 hour - calculated allocations
    SPRINT_CONFIG: 86400,   // 24 hours - sprint configuration
    SPRINTS_LIST: 86400     // 24 hours - all sprints
};

async function getJiraIssuesWithCache(sprintId, jiraUrl, token) {
    const cacheKey = `jira:sprint:${sprintId}:issues`;
    
    // KROK 1: Sprawdź cache
    const cached = await redis.get(cacheKey);
    if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return JSON.parse(cached);
    }
    
    // KROK 2: Cache miss → Query Jiry
    console.log(`❌ Cache MISS: ${cacheKey}, querying Jira...`);
    const issues = await queryJiraForSprintIssues(sprintId, jiraUrl, token);
    
    // KROK 3: Store to cache
    await redis.setex(cacheKey, CACHE_TTL.ISSUES, JSON.stringify(issues));
    console.log(`✅ Cached for ${CACHE_TTL.ISSUES}s: ${cacheKey}`);
    
    return issues;
}

async function calculateAllocationsWithCache(sprintId, jiraUrl, token) {
    const cacheKey = `jira:sprint:${sprintId}:allocations`;
    
    // KROK 1: Sprawdź cache
    const cached = await redis.get(cacheKey);
    if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return JSON.parse(cached);
    }
    
    // KROK 2: Cache miss → Pobierz issues
    console.log(`❌ Cache MISS: ${cacheKey}, calculating allocations...`);
    const issues = await getJiraIssuesWithCache(sprintId, jiraUrl, token);
    
    // KROK 3: Oblicz alokacje
    const allocations = calculateAllocations(issues);
    
    // KROK 4: Store to cache
    await redis.setex(cacheKey, CACHE_TTL.ALLOCATIONS, JSON.stringify(allocations));
    
    return allocations;
}
```

### Smart Cache Invalidation

```javascript
/**
 * Kiedy INVALIDOWAĆ cache?
 * 
 * 1. User explicilty clicks "Refresh"
 * 2. Sprint status zmienia się (current → active done)
 * 3. Jira webhook: issue changed (assignment, estimate, status)
 * 4. TTL expires automatically
 */

// INVALIDATION #1: Manual Refresh Button (Settings)
app.post('/api/cache/invalidate', async (req, res) => {
    const { sprintId, type } = req.body;
    
    if (type === 'full') {
        // Usuń wszystkie klucze dla tego sprintu
        await redis.del(`jira:sprint:${sprintId}:*`);
        console.log(`🗑️  Cleared all cache for sprint ${sprintId}`);
    } else if (type === 'allocations') {
        // Usuń tylko alokacje
        await redis.del(`jira:sprint:${sprintId}:allocations`);
        console.log(`🗑️  Cleared allocations cache for sprint ${sprintId}`);
    }
    
    res.json({ success: true });
});

// Frontend: Manual Refresh Button
document.getElementById('refresh-cache-btn').addEventListener('click', async () => {
    const sprintId = CURRENT_SPRINT.id;
    await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId, type: 'full' })
    });
    
    reloadAllocations();
    showSuccess('✅ Cache cleared, reloading from Jira...');
});

// INVALIDATION #2: Jira Webhook (automatic, real-time)
app.post('/api/webhooks/jira', async (req, res) => {
    const { issue, webhookEvent } = req.body;
    
    // Detectuj sprint ID
    const sprintId = issue.fields.sprint?.id;
    
    if (['issue_updated', 'issue_changed'].includes(webhookEvent)) {
        // Invalidate cache na zmianę (assignee, status, estimate)
        await redis.del(`jira:sprint:${sprintId}:allocations`);
        console.log(`🔔 Jira webhook: issue ${issue.key} changed, cleared cache`);
        
        // Emit real-time update to connected clients
        io.emit('jira-cache-invalidated', { sprintId });
    }
    
    res.status(200).json({ processed: true });
});

// Frontend: Listen for real-time invalidation
io.on('jira-cache-invalidated', ({ sprintId }) => {
    if (sprintId === CURRENT_SPRINT.id) {
        console.log(`🔄 Real-time update received, reloading allocations...`);
        reloadAllocations();
    }
});

// INVALIDATION #3: Sprint Change Detection (every 24h)
setInterval(async () => {
    console.log("🔄 Running scheduled sprint detection...");
    const sprints = await detectCurrentAndUpcomingSprints(...);
    
    // Jeśli sprint sie zmienił, invalidate all old cache
    if (sprints.current.id !== PREVIOUS_SPRINT.id) {
        console.log(`🔄 Sprint changed! Old: ${PREVIOUS_SPRINT.id}, New: ${sprints.current.id}`);
        await redis.del('jira:*'); // Clear everything
        PREVIOUS_SPRINT = sprints.current;
    }
}, 86400000); // Every 24 hours
```

### Cache Status UI (Settings)

```html
<div class="cache-status-panel">
    <h4>📊 Cache Status</h4>
    
    <table class="cache-table">
        <thead>
            <tr>
                <th>Cache Key</th>
                <th>Size</th>
                <th>TTL</th>
                <th>Expires</th>
            </tr>
        </thead>
        <tbody id="cache-status-rows">
            <!-- Dynamically populated from /api/cache/status -->
            <tr>
                <td>jira:sprint:9910:issues</td>
                <td>45 KB</td>
                <td>1h</td>
                <td>2026-08-07 11:30:00</td>
            </tr>
            <tr>
                <td>jira:sprint:9910:allocations</td>
                <td>12 KB</td>
                <td>1h</td>
                <td>2026-08-07 11:30:00</td>
            </tr>
        </tbody>
    </table>
    
    <div class="button-group">
        <button id="refresh-cache-btn" class="btn-secondary">🔄 Clear Cache Now</button>
        <button id="cache-details-btn" class="btn-tertiary">📊 View Details</button>
    </div>
</div>
```

### Cache Monitoring (Logging)

```javascript
/**
 * Log every cache hit/miss for monitoring
 */

const cacheMetrics = {
    hits: 0,
    misses: 0,
    invalidations: 0
};

async function logCacheMetrics() {
    console.log(`📊 Cache Metrics (last 1h):`);
    console.log(`   Hits: ${cacheMetrics.hits}`);
    console.log(`   Misses: ${cacheMetrics.misses}`);
    console.log(`   Hit Rate: ${((cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100).toFixed(1)}%`);
    console.log(`   Invalidations: ${cacheMetrics.invalidations}`);
    
    // Report to monitoring system (e.g., New Relic, DataDog)
    sendMetricsToMonitoring({
        'cache.hits': cacheMetrics.hits,
        'cache.misses': cacheMetrics.misses,
        'cache.hit_rate': (cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100
    });
}

// Log every hour
setInterval(logCacheMetrics, 3600000);
```

---

## 📋 Updated Checklist - Sprint Planning + Caching

### Sprint Detection Implementation
- [ ] Create `/api/sprints/detect` endpoint
- [ ] Integrate Jira Board API for sprint states
- [ ] Implement sprint -> issues count query
- [ ] Add sprint detection to app initialization
- [ ] Build UI for sprint selector (Settings)
- [ ] Add manual "Detect Sprints" button
- [ ] Implement 24h auto-detection schedule

### Redis Cache Setup
- [ ] Install + configure Redis locally (or use Redis Cloud)
- [ ] Define cache keys structure
- [ ] Implement getWithCache() helper
- [ ] Add manual cache invalidation endpoint
- [ ] Set up Jira webhook for real-time invalidation
- [ ] Implement cache status UI (Settings)
- [ ] Add cache metrics logging

### Frontend Integration
- [ ] Add refresh button (Settings)
- [ ] Display cache status (size, TTL, expires)
- [ ] Implement real-time updates via Socket.io
- [ ] Add error handling (cache miss, Redis down)
- [ ] Show user feedback (loading, cached, etc.)

---

## 🚀 Phase 1 Implementation Order

```
DAY 1:
├── Backend Setup
│   ├── Create Node.js server (/api/jira/import)
│   ├── Add Jira API client
│   └── Implement field mapping
│
├── Sprint Detection
│   ├── Create /api/sprints/detect
│   └── Test with real Jira data
│
└── Redis Cache
    ├── Install & configure Redis
    ├── Add cache layer to /api/jira/import
    └── Manual invalidation endpoint

DAY 2:
├── Frontend UI
│   ├── Import modal + preview
│   ├── Sprint selector (Settings)
│   └── Cache status panel
│
├── Real-time Updates
│   ├── Socket.io integration
│   └── Webhook listener
│
└── Testing
    ├── Unit tests (mappers)
    ├── Integration tests (end-to-end)
    └── Manual testing with real Jira data

DAY 3:
├── Documentation
│   ├── API docs
│   ├── Troubleshooting guide
│   └── User guide
│
└── Deployment
    ├── Push to GitHub
    ├── Create release tag
    └── Monitor in production
```

---

**Status:** ✅ Design Ready (Extended with Sprint Planning + Caching) | Ready for Phase 1 Backend Implementation

