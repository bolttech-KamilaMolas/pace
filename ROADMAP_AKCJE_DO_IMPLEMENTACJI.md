# Roadmap Implementacji - Capacity Planner
## Akcje do podjęcia (Jira-ready)

**Data:** 7 sierpnia 2026  
**Status:** MVP ready, potrzebna V1.1  
**Właściciel:** Product Manager IT R&D

---

## 📋 FAZA 1: MVP+ (3-4 tygodnie) - IMMEDIATE ACTION

### ✅ GOTOWE DO WDRAŻANIA DZISIAJ

#### AKCJA #1: Wdrażanie MVP v1.0 w zespołach (TYM)
```
Jira Issue: CAP-DEPLOY-MVP
Type: Task (Epic)
Priority: High
Assignee: [Team Lead]
Timeline: Przez następne 2 tygodnie (rozmieszczenie w każdym zespole)
Effort: 10 godzin (training + deployment)

Taski:
  └─ CAP-DEPLOY-ALF       Training dla ALF (2h)
  └─ CAP-DEPLOY-WAREX     Training dla WAREX (2h)
  └─ CAP-DEPLOY-OPTIMUS   Training dla OPTIMUS (2h)
  └─ CAP-DEPLOY-MASH      Training dla MASH (2h)
  └─ CAP-DEPLOY-MAGENTO   Training dla MAGENTO (2h)
  └─ CAP-DEPLOY-QA        Training dla QA (2h)

Success Criteria:
  ✓ Wszyscy SL zalogowani i widzą capacity plan
  ✓ Każdy zespół ma wpisane alokacje na następne 2 tygodnie
  ✓ 0 P1 issues w pierwszych 5 dni wdrażania
  
Dokumentacja:
  └─ Przygotować: User guide (PL)
  └─ Przygotować: Quick start (1-pager)
  └─ Przygotować: FAQ (top 5 pytań)
```

---

### 🔴 FAZA 1a: Jira Integration (40-60 godzin) - PRIORYTET #1

#### AKCJA #2: Jira Import API Setup
```
Jira Issue: CAP-INTEG-JIRA
Type: Task
Priority: Critical (blocks 30% manual work)
Assignee: [Backend Dev]
Timeline: 2 tygodnie
Effort: 40 godzin

Subtasks:
  ├─ CAP-JIRA-AUTH (4h)
  │  └─ Skonfiguruj Jira API token authentication
  │  └─ Test connection na dev + prod Jira
  │  └─ Document credentials storage (env vars)
  │
  ├─ CAP-JIRA-PROJECTS (8h)
  │  └─ Implement GET /jira/projects endpoint
  │  └─ Map Jira projects → capacity-planner projects
  │  └─ Handle project custom fields
  │
  ├─ CAP-JIRA-ISSUES (12h)
  │  └─ Implement GET /jira/issues for epic, story, task
  │  └─ Map issue type → task/epic in capacity-planner
  │  └─ Track status transitions (To Do → In Progress → Done)
  │  └─ Extract estimate (story points, time logged)
  │
  ├─ CAP-JIRA-MAPPING (8h)
  │  └─ Create mapping configuration (Jira field → CP field)
  │  └─ Handle custom fields per project
  │  └─ Allow field overrides per team
  │
  ├─ CAP-JIRA-SYNC (8h)
  │  └─ Implement incremental sync (only changed issues)
  │  └─ Sync frequency: daily at 6am, manual trigger
  │  └─ Error handling + retry logic
  │  └─ Audit log (who synced when)
  │
  └─ CAP-JIRA-TESTING (4h)
     └─ Test with real Jira data (100 projects)
     └─ Load testing (1000+ issues)
     └─ Error scenarios (deleted projects, archived issues)

Definition of Done:
  ✓ 100% of ALF/WAREX projects visible in capacity-planner
  ✓ Issue statuses sync correctly
  ✓ Estimates visible in workload view
  ✓ Zero data loss or corruption
  ✓ API documentation complete

Success Metrics:
  └─ Manual data entry time reduced by 50%
  └─ 0 desynchronization issues in first week
  └─ Average sync time < 30 seconds
```

---

### 💰 FAZA 1b: Finanse (30-40 godzin) - PRIORYTET #2

#### AKCJA #3: Budget & Forecast Model
```
Jira Issue: CAP-FINANCE-LITE
Type: Task
Priority: High (blocks Finance review)
Assignee: [Backend Dev + Finance analyst]
Timeline: 2 tygodnie
Effort: 35 godzin

Subtasks:
  ├─ CAP-FINANCE-MODEL (8h)
  │  └─ Define: Budget per project (amount, currency, period)
  │  └─ Define: Forecast cost (calculated from team rates)
  │  └─ Define: Actual cost (from timesheets/ERP)
  │  └─ Define: Burn rate (actual/forecast %)
  │  └─ Database schema + migrations
  │
  ├─ CAP-FINANCE-UI (10h)
  │  └─ New view: "Finance Dashboard"
  │  └─ Tabs: Budget, Forecast, Actuals, ROI
  │  └─ Chart: Budget vs Forecast vs Actual (line + bars)
  │  └─ Alert: Budget utilization > 80%
  │  └─ Table: All projects with burn rate %
  │
  ├─ CAP-FINANCE-ALERTS (6h)
  │  └─ Alert: Project overspent (actual > budget)
  │  └─ Alert: Burn rate > 100% (forecast, not actual)
  │  └─ Alert: Financial period ending soon (7 days)
  │  └─ Add to "Centro Akcji" alert engine
  │
  ├─ CAP-FINANCE-IMPORT (8h)
  │  └─ Import budget from CSV template
  │  └─ Import actual costs (from ERP when available)
  │  └─ Bulk upload: /finance/import
  │  └─ Mapping configuration (project name → ID)
  │
  └─ CAP-FINANCE-REPORTS (3h)
     └─ Report: Budget Summary (all projects YTD)
     └─ Report: Burn Rate Trend (30-day chart)
     └─ Export to PDF

Definition of Done:
  ✓ Finance Dashboard fully functional
  ✓ Budget data for all 28 projects loaded
  ✓ Forecast calculation correct (tested manually)
  ✓ Alerts working in Action Center
  ✓ Finance Controller can export reports

Success Metrics:
  └─ Finance Controller approves budget in <15 min
  └─ Budget overrun detected within 1 day
  └─ 0 calculation errors in test scenarios
```

---

### ⏱️ FAZA 1c: Time Tracking Structure (40-50 godzin) - PRIORYTET #3

#### AKCJA #4: Timesheet Approval Workflow
```
Jira Issue: CAP-TIMESHEET-WORKFLOW
Type: Task
Priority: High (blocks Team Lead sign-off)
Assignee: [Backend Dev + QA]
Timeline: 2 tygodnie
Effort: 45 godzin

Subtasks:
  ├─ CAP-TIMESHEET-MODEL (10h)
  │  └─ Define: Timesheet (person, week, entries[], status)
  │  └─ Define: TimeEntry (project, hours, billable, category)
  │  └─ Define: ApprovalHistory (approver, action, timestamp, reason)
  │  └─ Database schema + migrations
  │
  ├─ CAP-TIMESHEET-UI (15h)
  │  └─ New view: "Timesheets" (per week)
  │  └─ Person selects week, sees allocated tasks (pre-filled)
  │  └─ Can adjust hours, add notes, mark billable
  │  └─ Submit for approval (status: pending → approved/rejected)
  │  └─ Team Lead sees "My Approvals" widget
  │
  ├─ CAP-TIMESHEET-APPROVAL (12h)
  │  └─ Approval workflow: Team Lead → Finance
  │  └─ Status flow: Draft → Pending → Approved → Recorded
  │  └─ Rejection with reason (comments)
  │  └─ Email notifications (pending approval, approved, rejected)
  │
  ├─ CAP-TIMESHEET-REPORTING (8h)
  │  └─ Report: Timesheets submitted vs approved (%)
  │  └─ Report: Average approval time
  │  └─ Report: Planned vs Actual hours per team
  │  └─ Alert: Timesheet not submitted (3+ days overdue)
  │
  └─ CAP-TIMESHEET-TESTING (4h)
     └─ Integration test: Full workflow (5 people)
     └─ Load test: 100 timesheets/week

Definition of Done:
  ✓ Timesheet form fully functional
  ✓ Approval workflow tested with Team Leads
  ✓ Email notifications working
  ✓ Reports show planned vs actual
  ✓ Team Lead training completed

Success Metrics:
  └─ Team Lead submits timesheets in <2 min
  └─ Approval cycle < 1 day
  └─ 90% of hours submitted within 5 days
  └─ 0 data loss in approval workflow
```

---

### 📊 FAZA 1 - SUMMARY
```
┌────────────────────────────────────────────────────────┐
│  FAZA 1: MVP+ (3-4 tygodnie)                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  #1 MVP Deployment         10h   (Training, rollout)  │
│  #2 Jira Integration        60h   (API sync)          │
│  #3 Finance Lite            35h   (Budget + tracking) │
│  #4 Time Tracking           45h   (Approval WF)       │
│                                                        │
│  RAZEM:                    150h                        │
│  Timeline:                 3-4 tygodnie               │
│  Team:                     1 dev + 1 QA + PM          │
│  Cost:                     ~$7,500 ($50/h)            │
│  Blocker:                  Jira API access            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 FAZA 2: STRATEGIC (4-6 tygodni) - QUARTERLY

### AKCJA #5: OKR & Strategic Alignment
```
Jira Issue: CAP-STRATEGIC-OKR
Type: Epic
Priority: High
Timeline: Q4 2026 (4-6 tygodni)
Effort: 150 godzin

Features:
  ├─ Define Objectives (firma, tribe, program, team)
  ├─ Define Key Results (measurable outcomes)
  ├─ Link initiatives → OKRs (portfolio alignment)
  ├─ Progress tracking (% complete, status: on-track/at-risk/off-track)
  ├─ OKR dashboard (executive view)
  ├─ Alignment report (portfolio vs strategy coverage)
  └─ Notifications (OKR deadline approaching, status changed)

Success Criteria:
  ✓ VP Product can see how portfolio aligns to strategy
  ✓ Every project linked to at least 1 OKR
  ✓ OKR progress updated weekly (automated from projects)
  ✓ Executive dashboard shows OKR health (RAG)
```

---

### AKCJA #6: Demand Intake & Investment Governance
```
Jira Issue: CAP-DEMAND-INTAKE
Type: Epic
Priority: High
Timeline: Q4 2026 (4-6 tygodni)
Effort: 100 godzin

Features:
  ├─ Intake form (idea submission)
  ├─ Scoring engine (strategic fit, business value, complexity)
  ├─ Approval workflow (Portfolio Owner → Finance → Executive)
  ├─ Business case template
  ├─ Decision log (why approved/rejected)
  ├─ Pipeline view (backlog → reviewed → approved → roadmap)
  └─ Notifications (status changes, approval needed)

Success Criteria:
  ✓ Portfolio Owner can see incoming demand
  ✓ New ideas scored automatically
  ✓ Approval process < 1 week (SLA enforced)
  ✓ Decision log shows audit trail
```

---

### AKCJA #7: Value Realization & ROI Tracking
```
Jira Issue: CAP-VALUE-REALIZATION
Type: Epic
Priority: Medium
Timeline: Q4 2026 (4 tygodnie)
Effort: 80 godzin

Features:
  ├─ Benefit tracking (expected vs realized)
  ├─ ROI calculation (realized benefit / cost)
  ├─ Business case vs Actual (post-launch comparison)
  ├─ Value trends (30/60/90 day reviews)
  ├─ Post-implementation review template
  └─ Executive report (top 10 delivered benefits)

Success Criteria:
  ✓ Finance can see ROI for completed projects
  ✓ Benefit realization tracked systematically
  ✓ Post-launch reviews 90% complete within 100 days
  ✓ Executive report identifies value trends
```

---

## 🚀 FAZA 3: ENTERPRISE (6-8 tygodni) - Q1 2027

### AKCJA #8: Azure DevOps Integration
```
Jira Issue: CAP-INTEG-AZURE
Type: Epic
Priority: High
Timeline: Q1 2027
Effort: 80 godzin

Features:
  ├─ Bi-directional sync with Azure DevOps
  ├─ Map ADO Work Items → CP projects
  ├─ Estimate sync (ADO story points ↔ CP hours)
  ├─ Status sync (ADO workflow → CP status)
  ├─ Burndown integration (sprint velocity visible)
  └─ Same architecture as Jira (reusable)

Blocker:
  └─ Must complete Jira integration first (FAZA 1)
```

---

### AKCJA #9: ERP Integration (SAP/Oracle)
```
Jira Issue: CAP-INTEG-ERP
Type: Epic
Priority: High
Timeline: Q1 2027
Effort: 150 godzin

Features:
  ├─ Cost center mapping (Project → Cost Center)
  ├─ Actual cost sync (from SAP/Oracle)
  ├─ PO & invoice tracking
  ├─ CapEx vs OpEx split
  ├─ Intercompany billing
  └─ Cost forecast (based on team rates + actuals)

Blocker:
  └─ Must complete Finance model first (FAZA 1)
```

---

### AKCJA #10: HR Integration (Workday/Active Directory)
```
Jira Issue: CAP-INTEG-HR
Type: Epic
Priority: Medium
Timeline: Q1 2027
Effort: 120 godzin

Features:
  ├─ Auto-import people from HRIS
  ├─ Org structure sync (reporting lines)
  ├─ PTO & leave sync
  ├─ Contractor management
  ├─ Skills catalog integration
  └─ Cost rate updates (from HRIS)

Blocker:
  └─ Must complete People model first (FAZA 0)
```

---

## ✅ CHECKLIST IMPLEMENTACJI

### PRZED WDRAŻANIEM V1.0 (2-3 dni)
```
□ Przygotować user guide (PL, 10 stron)
□ Przygotować quick start (1-pager per team)
□ Przygotować FAQ (top 10 pytań)
□ Przygotować data import template (Excel)
□ Przygotować demo video (5 min)
□ Wynająć support channel (Slack #capacity-planner)
□ Przygotować SLA (avg response time)
□ Ustawić monitoring (performance, error rates)
```

### PODCZAS WDRAŻANIA V1.0 (2 tygodnie)
```
□ Training dla każdego Squad Lead (30 min per team)
□ Zbieranie feedback (daily standups)
□ Bug fixes (P1/P2 hotfixes same day)
□ Adoption tracking (logins per team)
□ Email digest (weekly summary of alerts)
```

### PRZED FAZĄ 1A (Jira Integration)
```
□ Ustawić Jira API access (token, permissions)
□ Przygotować mapping (Jira projects → CP projects)
□ Test connection na dev environment
□ Przygotować rollback plan (jeśli coś pójdzie źle)
□ Przygotować batch import (first run)
```

---

## 🎯 SUCCESS METRICS (Co mierzymy?)

### Faza 0 (MVP v1.0) - SUCCESS?
```
✓ 90% Squad Leads log in within 3 days
✓ All 28 projects visible and accurate
✓ 0 P1 bugs reported
✓ Average session time > 10 min (they use it)
✓ NPS score > 7/10 (Team Leads survey)
```

### Faza 1 (MVP+ v1.1) - SUCCESS?
```
✓ Jira sync working, 0 desynchronizations
✓ Finance Controller approves budget in <15 min
✓ Manual data entry time reduced by 50%
✓ Timesheet approval < 1 day
✓ 3 new integrations working (Jira, Finance, HR)
```

### Faza 2 (Strategic v2.0) - SUCCESS?
```
✓ Every project linked to OKR
✓ Portfolio alignment visible to executives
✓ New demand process used by 100% of requesters
✓ ROI tracking for 20+ completed projects
✓ Executive dashboard reviewed in board meetings
```

---

## ⚠️ RISK REGISTER

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Jira API access delayed | Blocks Faza 1a | Medium | Request 2 weeks before start |
| Data quality issues (bad project names) | Sync failures | Low | Run data audit before import |
| Team adoption low | Low utilization | Medium | Strong leadership push + training |
| Performance degrades (1000+ projects) | Unusable at scale | Low | Load testing + caching strategy |
| Budget not approved | Team unpaid | High | Pre-approve budget by Aug 15 |
| Key developer sick leave | Schedule slip | Medium | Cross-train backup developer |

---

## 📞 ESCALATION PATHS

```
Jira Access Issue         → IT Infrastructure
Budget Approval           → CFO/Finance Director
Executive Alignment       → VP Product + VP Engineering
Performance Issues        → Technical Architect
Team Adoption             → VP HR + IT Leadership
Data Quality Issues       → Process Owner (PM)
```

---

## 📅 TIMELINE VISUALIZATION

```
AUGUST 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7 Aug   10 Aug   15 Aug   20 Aug   25 Aug   31 Aug
 │       │       │       │       │       │
 ├─📦─────────────┤
 │  MVP v1.0      │  DEPLOYMENT
 │  Training      │
 │
 │       ├─🚀─────────────────────────────────────────┤
 │       │  FAZA 1: MVP+ (Jira + Finance + Timesheets)
 │       │  3-4 weeks
 │

SEPTEMBER 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 Sep   10 Sep   20 Sep   30 Sep
 │       │       │       │
 ├─🚀─────────────────┤  
 │  FAZA 1 Continued
 │
 │       ├─📊──────────────────────────┤
 │       │  PLANNING FAZA 2
 │       │  (OKR + Demand Intake)

LATER PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q4 2026        ├─📊──────────────────┤
               │  FAZA 2: Strategic
               │

Q1 2027        ├─🏢──────────────────────────┤
               │  FAZA 3: Enterprise
               │  (Azure, ERP, HR integ.)
```

---

## 📞 CONTACT & OWNERSHIP

| Role | Name | Contact | Responsible For |
|------|------|---------|---|
| Product Owner | [PM Name] | Slack: @pm | Overall roadmap, prioritization |
| Tech Lead | [Dev Name] | Slack: @dev | Architecture, Jira integration |
| QA Lead | [QA Name] | Slack: @qa | Testing, deployment checklist |
| Finance Lead | [Finance Name] | Slack: @finance | Finance module acceptance |
| HR Lead | [HR Name] | Slack: @hr | HR integration, team adoption |

---

**Prepared by:** Capacity Planner Analysis Team  
**Date:** August 7, 2026  
**Version:** 1.0  
**Status:** Ready for Leadership Review & Budget Approval

