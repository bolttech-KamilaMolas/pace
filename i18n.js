// ============================================================
// IT R&D Capacity Planner — Internationalization (i18n)
// ============================================================
// Usage: t('key') returns the translation for the current language.
// Switch language: setLang('pl') or setLang('en')
// Browser-detected default: getDefaultLang()

const I18N = {
    // --- Navigation / Sidebar ---
    'nav.views': { pl: 'Widoki', en: 'Views' },
    'nav.template': { pl: 'Szablon', en: 'Template' },
    'nav.actioncenter': { pl: 'Centrum akcji', en: 'Action Center' },
    'nav.heatmap': { pl: 'Mapa obciążenia', en: 'Heatmap' },
    'nav.dashboard': { pl: 'Podsumowanie', en: 'Dashboard' },
    'nav.projects': { pl: 'Projekty', en: 'Projects' },
    'nav.workload': { pl: 'Obciążenie', en: 'Workload' },
    'nav.people': { pl: 'Alokacja', en: 'Allocation' },
    'nav.sprints': { pl: 'Sprinty', en: 'Sprints' },
    'nav.calendar': { pl: 'Kalendarz', en: 'Calendar' },
    'nav.squadlead': { pl: 'Squad Lead', en: 'Squad Lead' },
    'nav.settings': { pl: 'Ustawienia', en: 'Settings' },

    // --- Dashboard summary cards ---
    'dash.activeProjects': { pl: 'Aktywne projekty', en: 'Active projects' },
    'dash.activeProjectsSub': { pl: '+3 planowane w Q4', en: '+3 planned in Q4' },
    'dash.capacityUtil': { pl: 'Wykorzystanie capacity', en: 'Capacity utilisation' },
    'dash.capacityUtilSub': { pl: 'Średnia wszystkich zespołów', en: 'Average across all teams' },
    'dash.overallocated': { pl: 'Tygodnie z przekroczeniem', en: 'Overallocated weeks' },
    'dash.overallocatedSub': { pl: 'W ciągu najbliższych 8 tyg.', en: 'Within next 8 weeks' },
    'dash.freeCapacity': { pl: 'Wolna dostępność', en: 'Free capacity' },
    'dash.freeCapacitySub': { pl: 'Dostępne w tym tygodniu', en: 'Available this week' },
    'dash.chartSprintTitle': { pl: 'Wykorzystanie capacity per zespół (bieżący sprint)', en: 'Capacity utilisation per team (current sprint)' },
    'dash.chartMonthTitle': { pl: 'Wykorzystanie capacity per zespół (bieżący miesiąc)', en: 'Capacity utilisation per team (current month)' },
    'dash.sprintAvailTitle': { pl: '🚫 Niedostępni w następnym sprincie', en: '🚫 Unavailable in next sprint' },

    // --- Action Needed ---
    'action.title': { pl: 'WYMAGANE DZIAŁANIA', en: 'ACTION NEEDED' },
    'action.allClear': { pl: '✅ Brak pilnych spraw — wszystko pod kontrolą', en: '✅ No urgent issues — everything under control' },
    'action.overCapacity': { pl: 'przekracza capacity {pct}% w bieżącym sprincie', en: 'exceeds capacity {pct}% in current sprint' },
    'action.noAllocation': { pl: 'Brak przypisania {team} w najbliższych 4 tygodniach', en: 'No {team} allocation in next 4 weeks' },
    'action.deadlineIn': { pl: 'Termin za {days} dni ({date})', en: 'Deadline in {days} days ({date})' },
    'action.deadlinePassed': { pl: 'Termin minął {days} dni temu!', en: 'Deadline passed {days} days ago!' },
    'action.openRisks': { pl: '{count} otwartych ryzyk', en: '{count} open risks' },
    'action.freeCapacity': { pl: 'Wolne {md} MD w bieżącym sprincie', en: 'Free {md} MD in current sprint' },
    'action.noKeyRole': { pl: 'Brak {role} ({date}) — nieob.: {names}', en: 'No {role} available ({date}) — absent: {names}' },

    // --- Capacity table headers ---
    'cap.team': { pl: 'Zespół', en: 'Team' },
    'cap.cap': { pl: 'Cap.', en: 'Cap.' },
    'cap.avail': { pl: 'Dost.', en: 'Avail.' },
    'cap.proj': { pl: 'Proj.', en: 'Proj.' },
    'cap.bau': { pl: 'BAU', en: 'BAU' },
    'cap.oh': { pl: 'OH', en: 'OH' },
    'cap.scrum': { pl: 'Scr.', en: 'Scr.' },
    'cap.maint': { pl: 'Mnt.', en: 'Mnt.' },
    'cap.total': { pl: 'Σ', en: 'Σ' },
    'cap.free': { pl: 'Wolne', en: 'Free' },
    'cap.sum': { pl: 'SUMA', en: 'TOTAL' },

    // --- Chart legend ---
    'legend.proj': { pl: 'Proj', en: 'Proj' },
    'legend.bau': { pl: 'BAU', en: 'BAU' },
    'legend.oh': { pl: 'OH', en: 'OH' },
    'legend.scrum': { pl: 'Scr', en: 'Scr' },
    'legend.maint': { pl: 'Mnt', en: 'Mnt' },

    // --- Projects page ---
    'proj.listTitle': { pl: 'Lista projektów', en: 'Project list' },
    'proj.active': { pl: 'aktywnych', en: 'active' },
    'proj.addBtn': { pl: '+ Dodaj', en: '+ Add' },
    'proj.filterAll': { pl: 'Wszystkie', en: 'All' },
    'proj.filterPlanned': { pl: 'Zaplanowane', en: 'Planned' },
    'proj.filterInProgress': { pl: 'W toku', en: 'In Progress' },
    'proj.filterBlocked': { pl: 'Zablokowane', en: 'Blocked' },
    'proj.filterAtRisk': { pl: 'Zagrożone', en: 'At Risk' },
    'proj.filterOnHold': { pl: 'Wstrzymane', en: 'On Hold' },
    'proj.filterDone': { pl: 'Ukończone', en: 'Done' },
    'proj.filterArchived': { pl: 'Zarchiwizowane', en: 'Archived' },
    'proj.colPrio': { pl: 'Prio', en: 'Prio' },
    'proj.colName': { pl: 'Projekt', en: 'Project' },
    'proj.colStatus': { pl: 'Status', en: 'Status' },
    'proj.colHealth': { pl: 'Zdrowie', en: 'Health' },
    'proj.colLead': { pl: 'IT Lead', en: 'IT Lead' },
    'proj.colTeams': { pl: 'Zespoły', en: 'Teams' },
    'proj.colDelivery': { pl: 'Termin', en: 'Deadline' },
    'proj.colRisks': { pl: 'Ryzyka', en: 'Risks' },
    'proj.colNotes': { pl: 'Notatki', en: 'Notes' },
    'proj.addRisk': { pl: 'Dodaj ryzyko', en: 'Add risk' },
    'proj.addNote': { pl: 'Dodaj notatkę', en: 'Add note' },
    'proj.showRisks': { pl: 'Pokaż ryzyka', en: 'Show risks' },
    'proj.showNotes': { pl: 'Pokaż notatki', en: 'Show notes' },
    'proj.edit': { pl: 'Edytuj', en: 'Edit' },
    'proj.delete': { pl: 'Usuń', en: 'Delete' },
    'proj.noteContent': { pl: 'Treść notatki...', en: 'Note content...' },
    'proj.riskContent': { pl: 'Opis ryzyka...', en: 'Risk description...' },
    'proj.add': { pl: 'Dodaj', en: 'Add' },
    'proj.cancel': { pl: 'Anuluj', en: 'Cancel' },
    'proj.businessOwner': { pl: 'Business Owner', en: 'Business Owner' },

    // --- Note and Risk Form Fields ---
    'proj.noteType': { pl: 'Typ notatki', en: 'Note type' },
    'proj.riskDescription': { pl: 'Opis ryzyka', en: 'Risk description' },
    'proj.riskImpact': { pl: 'Impact', en: 'Impact' },
    'proj.riskProbability': { pl: 'Prawdopodobieństwo', en: 'Probability' },
    'proj.riskOwner': { pl: 'Owner ryzyka', en: 'Risk owner' },
    'proj.riskMitigation': { pl: 'Plan mitygacji', en: 'Mitigation plan' },
    'proj.riskDueDate': { pl: 'Data wykonania', en: 'Due date' },

    // --- Note Types ---
    'note.type.update': { pl: 'Update', en: 'Update' },
    'note.type.blocker': { pl: 'Blocker', en: 'Blocker' },
    'note.type.dependency': { pl: 'Zależność', en: 'Dependency' },
    'note.type.decision': { pl: 'Decyzja', en: 'Decision' },
    'note.type.risk': { pl: 'Ryzyko', en: 'Risk' },

    // --- Risk Levels ---
    'risk.level.low': { pl: 'Niski', en: 'Low' },
    'risk.level.medium': { pl: 'Średni', en: 'Medium' },
    'risk.level.high': { pl: 'Wysoki', en: 'High' },

    // --- Status labels ---
    'status.in-progress': { pl: 'W toku', en: 'In Progress' },
    'status.done': { pl: 'Ukończony', en: 'Done' },
    'status.at-risk': { pl: 'Zagrożony', en: 'At Risk' },
    'status.on-hold': { pl: 'Wstrzymany', en: 'On Hold' },
    'status.planned': { pl: 'Zaplanowany', en: 'Planned' },
    'status.blocked': { pl: 'Zablokowany', en: 'Blocked' },
    'status.archived': { pl: 'Zarchiwizowany', en: 'Archived' },
    
    // --- Priority labels ---
    'priority.1': { pl: 'Krytyczny', en: 'Critical' },
    'priority.2': { pl: 'Wysoki', en: 'High' },
    'priority.3': { pl: 'Średni', en: 'Medium' },
    'priority.4': { pl: 'Niski', en: 'Low' },
    'priority.na': { pl: 'Bez priorytetu', en: 'N/A' },
    'priority.naNote': { pl: '(BAU/Maintenance/Overhead)', en: '(BAU/Maintenance/Overhead)' },
    
    // --- Health (RAG) labels ---
    'health.green': { pl: 'Zielony', en: 'Green' },
    'health.amber': { pl: 'Żółty', en: 'Amber' },
    'health.red': { pl: 'Czerwony', en: 'Red' },
    'health.green.desc': { pl: 'Projekt na torze, brak problemów', en: 'Project on track, no issues' },
    'health.amber.desc': { pl: 'Projekt ma wyzwania, wymaga monitorowania', en: 'Project has challenges, requires monitoring' },
    'health.red.desc': { pl: 'Projekt ma poważne problemy', en: 'Project has serious issues' },

    // --- Categories ---
    'cat.project': { pl: 'Projekty', en: 'Projects' },
    'cat.bau': { pl: 'BAU', en: 'BAU' },
    'cat.overhead': { pl: 'Overhead', en: 'Overhead' },
    'cat.scrum': { pl: 'Scrum', en: 'Scrum' },
    'cat.maintenance': { pl: 'Maintenance', en: 'Maintenance' },

    // --- Sprint availability panel ---
    'sprint.workingDays': { pl: 'dni roboczych', en: 'working days' },
    'sprint.noSprints': { pl: 'Brak zdefiniowanych sprintów', en: 'No sprints defined' },
    'sprint.parseError': { pl: 'Błąd parsowania dat sprintu', en: 'Sprint date parse error' },
    'sprint.allAvailable': { pl: '✅ Wszyscy dostępni w następnym sprincie', en: '✅ Everyone available in next sprint' },
    'sprint.colPerson': { pl: 'OSOBA', en: 'PERSON' },
    'sprint.colTeam': { pl: 'ZESPÓŁ', en: 'TEAM' },
    'sprint.colRole': { pl: 'ROLA', en: 'ROLE' },
    'sprint.colDaysOff': { pl: 'DNI OFF', en: 'DAYS OFF' },
    'sprint.colCalendar': { pl: 'KALENDARZ', en: 'CALENDAR' },
    'sprint.totalUnavailable': { pl: 'Łącznie niedostępnych: {count} z {total} osób', en: 'Total unavailable: {count} of {total} people' },

    // --- Calendar (Teams page) ---
    'cal.allTeams': { pl: 'Wszystkie', en: 'All' },
    'cal.byRole': { pl: 'Po rolach', en: 'By Role' },
    'cal.person': { pl: 'Zespół / Osoba', en: 'Team / Person' },
    'cal.personSingle': { pl: 'Osoba', en: 'Person' },
    'cal.role': { pl: 'Rola', en: 'Role' },
    'cal.md': { pl: 'MD', en: 'MD' },
    'cal.available': { pl: 'Dostępny', en: 'Available' },
    'cal.friday': { pl: 'Piątek (65%)', en: 'Friday (65%)' },
    'cal.training': { pl: 'Szkolenie', en: 'Training' },
    'cal.off': { pl: 'Nieobecność', en: 'Absent' },
    'cal.companyOff': { pl: 'Wolne firmy', en: 'Company day off' },
    'cal.holiday': { pl: 'Święto', en: 'Public holiday' },
    'cal.weekend': { pl: 'Weekend', en: 'Weekend' },

    // --- People page ---
    'people.addSprints': { pl: '+ Dodaj sprinty', en: '+ Add sprints' },
    'people.filterAll': { pl: 'Wszystkie role', en: 'All roles' },
    'people.person': { pl: 'Osoba', en: 'Person' },
    'people.role': { pl: 'Rola', en: 'Role' },
    'people.assignments': { pl: 'Przypisania', en: 'Assignments' },

    // --- Settings page ---
    'settings.teams': { pl: 'Zespoły', en: 'Teams' },
    'settings.roles': { pl: 'Role', en: 'Roles' },
    'settings.people': { pl: 'Osoby', en: 'People' },
    'settings.daysOff': { pl: 'Dni wolne', en: 'Days off' },
    'settings.params': { pl: 'Parametry', en: 'Parameters' },
    'settings.alerts': { pl: 'Alerty', en: 'Alerts' },
    'settings.alertsTitle': { pl: 'Zarządzanie alertami', en: 'Alert Management' },
    'settings.alertsDesc': { pl: 'Wybierz które alerty mają być wyświetlane na pulpicie.', en: 'Choose which alerts should be displayed on the dashboard.' },
    'settings.alertOverCapacity': { pl: 'Przekroczenie capacity', en: 'Over capacity' },
    'settings.alertNoAllocation': { pl: 'Brak przypisania zespołu', en: 'No team allocation' },
    'settings.alertDeadlineApproaching': { pl: 'Zbliżający się termin', en: 'Approaching deadline' },
    'settings.alertOpenRisks': { pl: 'Otwarte ryzyka', en: 'Open risks' },
    'settings.alertNoKeyRole': { pl: 'Brak kluczowej roli', en: 'No key role available' },
    'settings.customAlerts': { pl: 'Niestandardowe alerty', en: 'Custom alerts' },
    'settings.customAlertsDesc': { pl: 'Stwórz własne reguły alertów dla swoich potrzeb.', en: 'Create custom alert rules for your needs.' },
    'settings.import': { pl: 'Import', en: 'Import' },
    'settings.data': { pl: 'Dane', en: 'Data' },
    'settings.addTeam': { pl: 'Dodaj zespół', en: 'Add team' },
    'settings.addRole': { pl: 'Dodaj rolę', en: 'Add role' },
    'settings.addPerson': { pl: 'Dodaj osobę', en: 'Add person' },
    'settings.addDayOff': { pl: 'Dodaj dzień wolny', en: 'Add day off' },
    'settings.teamName': { pl: 'Nazwa zespołu', en: 'Team name' },
    'settings.roleName': { pl: 'Nazwa roli', en: 'Role name' },
    'settings.personName': { pl: 'Imię i nazwisko', en: 'Full name' },
    'settings.changeColor': { pl: 'Zmień kolor', en: 'Change color' },
    'settings.priority': { pl: 'Priorytet', en: 'Priority' },
    'settings.companyDaysOff': { pl: 'Dni wolne firmowe (poza świętami ustawowymi)', en: 'Company days off (excl. public holidays)' },
    'settings.noCompanyDays': { pl: 'Brak dodatkowych dni wolnych', en: 'No additional days off' },
    'settings.publicHolidays': { pl: 'Święta publiczne', en: 'Public Holidays' },
    'settings.holidayDate': { pl: 'Data', en: 'Date' },
    'settings.holidayName': { pl: 'Nazwa', en: 'Name' },
    'settings.addHoliday': { pl: 'Dodaj święto', en: 'Add holiday' },
    'settings.importHolidays': { pl: 'Import domyślnych świąt', en: 'Import default holidays' },
    'settings.employmentType': { pl: 'Typ zatrudnienia', en: 'Employment Type' },
    'settings.availability': { pl: 'Dostępność (%)', en: 'Availability (%)' },
    'settings.availabilityRange': { pl: 'Dostępność w okresie:', en: 'Availability in period:' },
    'settings.availabilityFrom': { pl: 'Od:', en: 'From:' },
    'settings.availabilityTo': { pl: 'Do:', en: 'To:' },
    'settings.editPerson': { pl: 'Edytuj osobę', en: 'Edit person' },
    'settings.plannedTrainings': { pl: 'Planowane szkolenia', en: 'Planned Trainings' },
    'settings.noTrainings': { pl: 'Brak zaplanowanych szkoleń', en: 'No trainings scheduled' },
    'settings.trainingType': { pl: 'Typ szkolenia', en: 'Training type' },
    'settings.selectPerson': { pl: 'Wybierz osobę', en: 'Select person' },
    'settings.addTraining': { pl: 'Dodaj szkolenie', en: 'Add training' },
    'emptype.fulltime': { pl: 'Pełna zatrudnienie', en: 'Full-time' },
    'emptype.halftime': { pl: 'Pół etatu', en: 'Half-time' },
    'emptype.parttime': { pl: 'Część etatu', en: 'Part-time' },
    'emptype.contractor': { pl: 'Kontraktor', en: 'Contractor' },
    'settings.fridayLabel': { pl: 'Piątek — % dostępności:', en: 'Friday — availability %:' },
    'settings.capacityParams': { pl: 'Podział capacity per zespół (%)', en: 'Capacity split per team (%)' },
    'settings.importExcel': { pl: 'Import z Excel (capacity.xlsx)', en: 'Import from Excel (capacity.xlsx)' },
    'settings.importBtn': { pl: 'Importuj z GitHub', en: 'Import from GitHub' },
    'settings.importSuccess': { pl: 'Import zakończony. Załadowano dane dla {people} osób, {weeks} tygodni.', en: 'Import complete. Loaded data for {people} people, {weeks} weeks.' },
    'settings.importError': { pl: 'Błąd importu — sprawdź połączenie z siecią.', en: 'Import failed — check network connection.' },
    'settings.resetData': { pl: 'Resetuj dane', en: 'Reset data' },
    'settings.resetConfirm': { pl: 'Usunąć WSZYSTKIE dane lokalne? (projekty, przypisania, czas wolny — przywrócone zostaną defaults)', en: 'Delete ALL local data? (projects, assignments, time off — defaults will be restored)' },
    'settings.exportJSON': { pl: 'Eksport JSON', en: 'Export JSON' },
    'settings.importJSON': { pl: 'Import JSON', en: 'Import JSON' },

    // --- Sprints page ---
    'sprints.title': { pl: 'Przegląd sprintów', en: 'Sprint overview' },
    'sprints.goal': { pl: 'Cel:', en: 'Goal:' },
    'sprints.noGoal': { pl: 'brak celu', en: 'no goal' },
    'sprints.editGoal': { pl: 'Edytuj cel', en: 'Edit goal' },
    'sprints.current': { pl: 'BIEŻĄCY', en: 'CURRENT' },

    // --- Workload page ---
    'workload.project': { pl: 'Projekt', en: 'Project' },
    'workload.team': { pl: 'Zespół', en: 'Team' },
    'workload.totalsLabel': { pl: 'SUMA', en: 'TOTAL' },

    // --- Squad Lead page ---
    'squadlead.title': { pl: 'Squad Lead Dashboard', en: 'Squad Lead Dashboard' },
    'squadlead.capacityOverview': { pl: 'Capacity Overview', en: 'Capacity Overview' },
    'squadlead.sprintCapacity': { pl: 'Sprint Capacity', en: 'Sprint Capacity' },
    'squadlead.team': { pl: 'Zespół', en: 'Team' },
    'squadlead.capacity': { pl: 'Capacity Planned', en: 'Capacity Planned' },
    'squadlead.utilization': { pl: 'Wykorzystanie', en: 'Utilization' },
    'squadlead.status': { pl: 'Status', en: 'Status' },
    'squadlead.fte': { pl: 'FTE', en: 'FTE' },
    'squadlead.availability': { pl: 'Dostępność', en: 'Availability' },
    'squadlead.absences': { pl: 'Absencje', en: 'Absences' },
    'squadlead.healthy': { pl: '🟢 Zdrowy', en: '🟢 Healthy' },
    'squadlead.warning': { pl: '🟠 Ostrzeżenie', en: '🟠 Warning' },
    'squadlead.critical': { pl: '🔴 Krytyczny', en: '🔴 Critical' },
    'squadlead.spStory': { pl: 'Story Points', en: 'Story Points' },
    'squadlead.spAvailable': { pl: 'SP Dostępne', en: 'SP Available' },
    'squadlead.spCommitted': { pl: 'SP Zatwierdzone', en: 'SP Committed' },
    'squadlead.spDelivered': { pl: 'SP Dostarczone', en: 'SP Delivered' },
    'squadlead.velocity': { pl: 'Velocity', en: 'Velocity' },
    'squadlead.velocityTrend': { pl: 'Trend velocity (6 sprintów)', en: 'Velocity trend (6 sprints)' },
    'squadlead.carryover': { pl: 'Carry-over', en: 'Carry-over' },
    'squadlead.edit': { pl: 'Edytuj', en: 'Edit' },
    'squadlead.save': { pl: 'Zapisz', en: 'Save' },
    'squadlead.cancel': { pl: 'Anuluj', en: 'Cancel' },

    // --- Confirm dialogs ---
    'confirm.deleteProject': { pl: 'Usunąć ten projekt?', en: 'Delete this project?' },
    'confirm.archivePrompt': { pl: 'Projekt oznaczony jako Done — przenieść do archiwum?', en: 'Project marked as Done — move to archive?' },
    'confirm.deletePerson': { pl: 'Usunąć osobę z listy?', en: 'Remove person from the list?' },

    // --- Generic ---
    'generic.save': { pl: 'Zapisz', en: 'Save' },
    'generic.cancel': { pl: 'Anuluj', en: 'Cancel' },
    'generic.close': { pl: 'Zamknij', en: 'Close' },
    'generic.ok': { pl: 'OK', en: 'OK' },
    'generic.loading': { pl: 'Ładowanie...', en: 'Loading...' },
    'generic.noData': { pl: 'Brak danych', en: 'No data' },
    'generic.description': { pl: 'Opis', en: 'Description' },

    // --- Header ---
    'header.title': { pl: 'IT R&D Capacity Planner', en: 'IT R&D Capacity Planner' },
    'header.badge': { pl: 'BETA', en: 'BETA' },

    // --- Sidebar toggle ---
    'sidebar.toggle': { pl: 'Zwiń/rozwiń panel', en: 'Collapse/expand panel' },
};

// --- LANGUAGE ENGINE ---

let currentLang = 'pl'; // default

function getDefaultLang() {
    const browserLang = (navigator.language || navigator.userLanguage || 'pl').toLowerCase();
    return browserLang.startsWith('pl') ? 'pl' : 'en';
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('cp_lang', lang);
    // Update lang attribute on html element
    document.documentElement.lang = lang;
}

function loadLang() {
    const saved = localStorage.getItem('cp_lang');
    currentLang = saved || getDefaultLang();
    document.documentElement.lang = currentLang;
}

function t(key, params) {
    const entry = I18N[key];
    if (!entry) return key; // fallback: return key itself
    let text = entry[currentLang] || entry['en'] || key;
    // Replace {placeholder} params
    if (params) {
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
    }
    return text;
}

function getLang() {
    return currentLang;
}

// Initialize on load
loadLang();
