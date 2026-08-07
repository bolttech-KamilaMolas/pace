#!/usr/bin/env python
"""Generate mock LSG issues for testing (simulates Jira API response)"""

import json

# Mock LSG issues - realistic data based on actual Jira response structure
MOCK_LSG_ISSUES = [
    {
        "key": "LSG-1",
        "id": "10001",
        "fields": {
            "summary": "Implement new dashboard widget",
            "assignee": {
                "displayName": "Kamila Molas",
                "emailAddress": "kamila.molas@bolttech.pl"
            },
            "status": {"name": "In Progress"},
            "timeoriginalestimate": 86400,      # 3 MD (dev)
            "customfield_10695": 43200,         # 1.5 MD (qa)
            "customfield_10270": "Operations Excellence III"
        }
    },
    {
        "key": "LSG-2",
        "id": "10002",
        "fields": {
            "summary": "Fix pricing calculation bug",
            "assignee": {
                "displayName": "Mikołaj Banaszkiewicz",
                "emailAddress": "mikolaj.banaszkiewicz@bolttech.pl"
            },
            "status": {"name": "In Testing"},
            "timeoriginalestimate": 57600,      # 2 MD (dev)
            "customfield_10695": 28800,         # 1 MD (qa)
            "customfield_10270": "Dynamic Pricing System"
        }
    },
    {
        "key": "LSG-3",
        "id": "10003",
        "fields": {
            "summary": "Add user authentication",
            "assignee": {
                "displayName": "Kamila Molas",
                "emailAddress": "kamila.molas@bolttech.pl"
            },
            "status": {"name": "In Progress"},
            "timeoriginalestimate": 129600,     # 4.5 MD (dev)
            "customfield_10695": 86400,         # 3 MD (qa)
            "customfield_10270": "Operations Excellence III"
        }
    },
    {
        "key": "LSG-4",
        "id": "10004",
        "fields": {
            "summary": "Database optimization",
            "assignee": {
                "displayName": "Żaneta Fedor-Zalewska",
                "emailAddress": "zaneta.fedor@bolttech.pl"
            },
            "status": {"name": "In Testing"},
            "timeoriginalestimate": 0,           # No dev estimate (QA task)
            "customfield_10695": 57600,         # 2 MD (qa only)
            "customfield_10270": "Infrastructure"
        }
    },
    {
        "key": "LSG-5",
        "id": "10005",
        "fields": {
            "summary": "API documentation update",
            "assignee": {
                "displayName": "Tomasz Nowak",
                "emailAddress": "tomasz.nowak@bolttech.pl"
            },
            "status": {"name": "To Do"},
            "timeoriginalestimate": 43200,      # 1.5 MD (dev)
            "customfield_10695": 0,             # No QA estimate
            "customfield_10270": "Technical Debt"
        }
    },
    {
        "key": "LSG-6",
        "id": "10006",
        "fields": {
            "summary": "Security audit fixes",
            "assignee": {
                "displayName": "Kamila Molas",
                "emailAddress": "kamila.molas@bolttech.pl"
            },
            "status": {"name": "In Progress"},
            "timeoriginalestimate": 72000,      # 2.5 MD (dev)
            "customfield_10695": 28800,         # 1 MD (qa)
            "customfield_10270": "Operations Excellence III"
        }
    },
    {
        "key": "LSG-7",
        "id": "10007",
        "fields": {
            "summary": "Performance testing",
            "assignee": {
                "displayName": "Żaneta Fedor-Zalewska",
                "emailAddress": "zaneta.fedor@bolttech.pl"
            },
            "status": {"name": "In Testing"},
            "timeoriginalestimate": 0,           # No dev estimate (pure QA)
            "customfield_10695": 86400,         # 3 MD (qa)
            "customfield_10270": "Infrastructure"
        }
    },
    {
        "key": "LSG-8",
        "id": "10008",
        "fields": {
            "summary": "Implement feature flags",
            "assignee": {
                "displayName": "Mikołaj Banaszkiewicz",
                "emailAddress": "mikolaj.banaszkiewicz@bolttech.pl"
            },
            "status": {"name": "In Progress"},
            "timeoriginalestimate": 115200,     # 4 MD (dev)
            "customfield_10695": 57600,         # 2 MD (qa)
            "customfield_10270": "Feature Flags System"
        }
    }
]

def get_mock_issues():
    """Return mock LSG issues"""
    return {
        "issues": MOCK_LSG_ISSUES,
        "total": len(MOCK_LSG_ISSUES),
        "maxResults": len(MOCK_LSG_ISSUES),
        "startAt": 0
    }

def print_summary():
    """Print mock data summary"""
    print("📊 Mock LSG Issues Summary\n")
    
    issues = MOCK_LSG_ISSUES
    
    # Group by assignee
    by_assignee = {}
    for issue in issues:
        assignee = issue['fields']['assignee']['displayName']
        if assignee not in by_assignee:
            by_assignee[assignee] = {
                'issues': [],
                'projects': set(),
                'total_dev_md': 0,
                'total_qa_md': 0
            }
        
        dev_md = issue['fields']['timeoriginalestimate'] / 28800
        qa_md = issue['fields']['customfield_10695'] / 28800
        project = issue['fields']['customfield_10270']
        
        by_assignee[assignee]['issues'].append(issue['key'])
        by_assignee[assignee]['projects'].add(project)
        by_assignee[assignee]['total_dev_md'] += dev_md
        by_assignee[assignee]['total_qa_md'] += qa_md
    
    # Display
    print("👥 People from Different Teams/Projects:\n")
    for assignee in sorted(by_assignee.keys()):
        info = by_assignee[assignee]
        projects = ', '.join(sorted(info['projects']))
        print(f"   {assignee}:")
        print(f"      Issues: {', '.join(info['issues'])}")
        print(f"      Projects: {projects}")
        print(f"      Dev: {info['total_dev_md']:.1f} MD, QA: {info['total_qa_md']:.1f} MD")
        print()
    
    print(f"📈 Totals:")
    print(f"   • Total issues: {len(issues)}")
    print(f"   • Unique assignees: {len(by_assignee)}")
    total_dev = sum(i['fields']['timeoriginalestimate'] / 28800 for i in issues)
    total_qa = sum(i['fields']['customfield_10695'] / 28800 for i in issues)
    print(f"   • Total Dev MD: {total_dev:.1f}")
    print(f"   • Total QA MD: {total_qa:.1f}")

if __name__ == '__main__':
    print_summary()
    
    # Save to JSON file for backend to use
    with open('mock_lsg_issues.json', 'w') as f:
        json.dump(get_mock_issues(), f, indent=2)
    print(f"\n✅ Saved to mock_lsg_issues.json")
