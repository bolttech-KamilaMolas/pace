"""
Check people from Jira LSG project and their teams
Shows which people are assigned to which teams/projects
"""

import os
import requests
import base64
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

JIRA_URL = os.getenv('JIRA_URL', 'https://jira.your-instance.com')
JIRA_EMAIL = os.getenv('JIRA_EMAIL', '')
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN', '')

def get_auth_header():
    """Generate Jira Basic Auth header"""
    cred = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
    return {
        'Authorization': f'Basic {cred}',
        'Accept': 'application/json'
    }

def query_lsg_issues():
    """Get all issues from LSG project"""
    jql = 'project = "LSG" AND sprint IN (9910, 9675, 9609, 9576, 9811) ORDER BY "cf[10270]" ASC'
    
    params = {
        'jql': jql,
        'fields': [
            'assignee',
            'customfield_10270',        # Project Name
            'sprint',
            'timeoriginalestimate',     # Original Estimate (dev)
            'customfield_10695',        # Test Estimate (QA)
            'status',
            'summary',
            'issuetype'
        ],
        'maxResults': 100
    }
    
    try:
        url = f"{JIRA_URL}/rest/api/3/search"
        response = requests.get(url, headers=get_auth_header(), params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return data.get('issues', [])
    except Exception as e:
        print(f"❌ Error querying Jira: {str(e)}")
        return []

def analyze_people_and_teams(issues):
    """Analyze people from different teams/projects"""
    
    # Group by person
    people_data = defaultdict(lambda: {
        'issues': [],
        'projects': set(),
        'teams': set(),
        'roles': set(),
        'total_dev_md': 0,
        'total_qa_md': 0
    })
    
    # Group by project
    projects_data = defaultdict(list)
    
    print("\n" + "="*80)
    print("📊 ANALYZING JIRA LSG PROJECT DATA")
    print("="*80 + "\n")
    
    for issue in issues:
        fields = issue.get('fields', {})
        
        # Get assignee
        assignee_obj = fields.get('assignee')
        if not assignee_obj:
            continue
        
        person_name = assignee_obj.get('displayName', 'Unknown')
        email = assignee_obj.get('emailAddress', '')
        
        # Get project
        project_name = fields.get('customfield_10270', 'Unknown')
        
        # Get estimates (convert to MD)
        dev_estimate_sec = fields.get('timeoriginalestimate') or 0
        qa_estimate_sec = fields.get('customfield_10695') or 0
        
        dev_estimate_md = round(dev_estimate_sec / 28800, 2) if dev_estimate_sec else 0
        qa_estimate_md = round(qa_estimate_sec / 28800, 2) if qa_estimate_sec else 0
        
        # Get role from issue type
        issue_type = fields.get('issuetype', {}).get('name', 'Task')
        status = fields.get('status', {}).get('name', 'Unknown')
        
        # Add to people data
        person_key = person_name
        people_data[person_key]['issues'].append({
            'key': issue['key'],
            'summary': fields.get('summary', ''),
            'project': project_name,
            'status': status,
            'dev_md': dev_estimate_md,
            'qa_md': qa_estimate_md
        })
        people_data[person_key]['projects'].add(project_name)
        people_data[person_key]['total_dev_md'] += dev_estimate_md
        people_data[person_key]['total_qa_md'] += qa_estimate_md
        
        # Add to projects data
        projects_data[project_name].append({
            'person': person_name,
            'issue': issue['key'],
            'status': status,
            'dev_md': dev_estimate_md
        })
    
    # Print by person
    print("👥 PEOPLE AND THEIR ASSIGNMENTS\n")
    
    sorted_people = sorted(people_data.items(), key=lambda x: len(x[1]['issues']), reverse=True)
    
    for person_name, data in sorted_people:
        projects_str = ", ".join(sorted(data['projects']))
        total_issues = len(data['issues'])
        total_work_md = data['total_dev_md'] + data['total_qa_md']
        
        print(f"\n👤 {person_name}")
        print(f"   📊 Total issues: {total_issues}")
        print(f"   💼 Projects: {projects_str}")
        print(f"   ⏱️  Dev time: {data['total_dev_md']} MD | QA time: {data['total_qa_md']} MD | Total: {total_work_md} MD")
        print(f"   📋 Issues:")
        
        for issue in data['issues'][:5]:  # Show first 5
            print(f"      • {issue['key']}: {issue['summary'][:50]}")
            print(f"        Status: {issue['status']} | Project: {issue['project']}")
        
        if len(data['issues']) > 5:
            print(f"      ... and {len(data['issues']) - 5} more")
    
    # Print by project
    print("\n" + "="*80)
    print("🏢 PROJECTS AND THEIR TEAMS\n")
    
    for project_name in sorted(projects_data.keys()):
        people_in_project = set(item['person'] for item in projects_data[project_name])
        total_issues = len(projects_data[project_name])
        
        print(f"\n🏭 {project_name}")
        print(f"   👥 Team members: {len(people_in_project)}")
        print(f"   📊 Total issues: {total_issues}")
        print(f"   👤 People: {', '.join(sorted(people_in_project))}")
    
    # Summary statistics
    print("\n" + "="*80)
    print("📈 SUMMARY STATISTICS\n")
    
    unique_people = len(people_data)
    unique_projects = len(projects_data)
    total_issues = sum(len(issues_list) for issues_list in projects_data.values())
    
    print(f"   Total unique people: {unique_people}")
    print(f"   Total unique projects: {unique_projects}")
    print(f"   Total issues: {total_issues}")
    
    # Find people working across multiple projects (cross-team)
    print("\n🔀 PEOPLE WORKING ACROSS MULTIPLE PROJECTS (Cross-Team):\n")
    
    cross_team_people = [
        (name, len(data['projects']), list(data['projects']))
        for name, data in people_data.items()
        if len(data['projects']) > 1
    ]
    
    if cross_team_people:
        cross_team_people.sort(key=lambda x: x[1], reverse=True)
        for person, num_projects, projects in cross_team_people:
            print(f"   👤 {person}: {num_projects} projects - {', '.join(projects)}")
    else:
        print("   (None found - each person works on single project)")
    
    return people_data, projects_data

if __name__ == '__main__':
    print("\n🔐 Connecting to Jira...")
    print(f"   URL: {JIRA_URL}")
    print(f"   Email: {JIRA_EMAIL}")
    
    if not JIRA_EMAIL or not JIRA_API_TOKEN:
        print("\n❌ ERROR: Jira credentials not configured!")
        print("   Update backend/.env with your Jira credentials")
        print("   See GET_JIRA_CREDENTIALS.md for instructions")
        exit(1)
    
    issues = query_lsg_issues()
    
    if not issues:
        print("\n❌ No issues found. Check your Jira connection and JQL query.")
        exit(1)
    
    print(f"\n✅ Found {len(issues)} issues from Jira LSG project\n")
    
    people_data, projects_data = analyze_people_and_teams(issues)
    
    print("\n✅ Analysis complete!")
