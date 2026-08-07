# Jira Import Testing Guide

## Test Scenario: Cross-Team Allocations

### Expected Behavior
Import LSG project issues from Jira (mock data) with people from different teams:

**Test Data:**
```
LSG-1: "Implement new dashboard widget"
  Assignee: Kamila Molas (ALF team)
  Dev: 3 MD, QA: 1.5 MD

LSG-2: "Fix pricing calculation bug"
  Assignee: Mikołaj Banaszkiewicz (ALF team)
  Dev: 2 MD, QA: 1 MD

LSG-3: "Add user authentication"
  Assignee: Kamila Molas (ALF team)
  Dev: 4.5 MD, QA: 3 MD

LSG-4: "Database optimization"
  Assignee: Żaneta Fedor-Zalewska (QA team) ← CROSS-TEAM
  Dev: 0 MD, QA: 2 MD

LSG-5: "API documentation update"
  Assignee: Tomasz Nowak (NEW - will be created with ALF team)
  Dev: 1.5 MD, QA: 0 MD

LSG-6: "Security audit fixes"
  Assignee: Kamila Molas (ALF team)
  Dev: 2.5 MD, QA: 1 MD

LSG-7: "Performance testing"
  Assignee: Żaneta Fedor-Zalewska (QA team) ← CROSS-TEAM
  Dev: 0 MD, QA: 3 MD

LSG-8: "Implement feature flags"
  Assignee: Mikołaj Banaszkiewicz (ALF team)
  Dev: 4 MD, QA: 2 MD
```

### Team Distribution
- **ALF**: Kamila Molas (3 issues), Mikołaj Banaszkiewicz (2 issues), Tomasz Nowak (1 issue)
- **QA**: Żaneta Fedor-Zalewska (2 issues)

### Test Steps

#### Step 1: Open Settings > Import Tab
1. Open capacity-planner in browser (http://localhost:3000)
2. Click "⚙️ Settings" in left sidebar
3. Click "Import" tab (tab 7 of 8)

#### Step 2: Configure Backend URL
1. Verify Backend URL is set to: `http://localhost:5000`
2. Verify Project is set to: `LSG`

#### Step 3: Test Connection
1. Click "🔗 Test połączenia" (Test Connection button)
2. Expected result: ✓ Green message "✓ KAMILA MOLAS logged in successfully"

#### Step 4: Fetch Preview
1. Leave JQL Query empty (uses default: project=LSG)
2. Click "👁️ Podgląd" (Preview button)
3. Expected result:
   - ✓ Green message: "✓ Znaleziono 8 zadań. Kliknij 'Potwierdź import'..."
   - Preview table shows 8 issues with:
     - Key (LSG-1 through LSG-8)
     - Assignee names (Kamila, Mikołaj, Żaneta, Tomasz)
     - Dev MD values (0-4.5)
     - QA MD values (0-3)
     - Status values

#### Step 5: Confirm Import
1. Click "✓ Potwierdź import" (Confirm Import button)
2. Expected result:
   - Button shows "⏳ Importuję..." for 2-3 seconds
   - ✓ Green message: "✓ Zaimportowano 8 zadań!"
   - Preview table disappears
   - Import form resets

#### Step 6: Verify Cross-Team Allocations
1. Navigate to "📊 Obciążenie" (Workload) tab
2. Look for next sprint workload grid
3. Expected: See allocations merged into workload grid with:
   - Kamila Molas (ALF) appears in multiple rows
   - Żaneta Fedor-Zalewska (QA) appears in separate team section
   - Tomasz Nowak (newly created, ALF) appears in workload

#### Step 7: Verify Projects Added
1. Navigate to "Projekty" (Projects) tab
2. Scroll to "backlog" section
3. Expected: See 8 new projects named LSG-1 through LSG-8 with:
   - Short name = Jira key
   - Responsible person = assignee from Jira
   - Description = issue summary
   - Status = "not_started" (default)

#### Step 8: Verify Workload Integration
1. Click on any project (e.g., LSG-1)
2. Expected: Project detail shows allocations by person/team
3. Verify person and team information displays correctly

### Expected Console Output (Backend)

```
INFO:__main__:📋 Using mock data from mock_lsg_issues.json
INFO:__main__:✅ Imported 8 issues from LSG
INFO:werkzeug:127.0.0.1 - - [07/Aug/2026 21:22:00] "POST /api/jira/import HTTP/1.1" 200 -
```

### Cross-Team Validation Checklist

- [ ] Kamila Molas (ALF) shows in workload for LSG-1, LSG-3, LSG-6
- [ ] Mikołaj Banaszkiewicz (ALF) shows in workload for LSG-2, LSG-8
- [ ] Żaneta Fedor-Zalewska (QA) shows in workload for LSG-4, LSG-7 (different team!)
- [ ] Tomasz Nowak (new person, ALF) shows in workload for LSG-5
- [ ] Person-to-team mappings are correct (not all ALF)
- [ ] Dev/QA estimates properly separated in allocations
- [ ] Projects appear in backlog category
- [ ] No duplicate allocations for same person/sprint
- [ ] Workload grid calculates totals correctly

### Success Criteria

✅ **All tasks met if:**
1. 8 issues imported successfully
2. Cross-team people (from QA and ALF) display correctly
3. Allocations merge into workload grid without errors
4. New person (Tomasz Nowak) created successfully
5. UI re-renders correctly showing new projects and allocations
6. No console errors

### Troubleshooting

**Issue: Backend returns 500 error**
- Check backend logs: `get_process_output terminalId`
- Verify mock_lsg_issues.json exists in backend/ dir
- Verify .env has valid JIRA_API_TOKEN

**Issue: Preview shows 0 issues**
- Check that JQL is empty or correct
- Verify backend is using mock data (logs should say "Using mock data...")
- Check if project name case-sensitivity: "LSG" vs "lsg"

**Issue: Cross-team person not displaying**
- Check PEOPLE array has correct person with correct team
- Verify person.team !== undefined
- Check renderWorkloadGrid() includes all teams

**Issue: Allocations not merging**
- Check that sprint exists (getNextSprint() returns valid sprint)
- Verify PROJECTS and allocations are saved/loaded correctly
- Check project.allocations[sprintId] structure matches expected format

---

**Test Date:** August 7, 2026
**Tester:** [Your Name]
**Status:** [Ready to Test / In Progress / Passed / Failed]
