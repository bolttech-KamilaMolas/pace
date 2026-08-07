#!/usr/bin/env python
"""Fast LSG fetch with shorter timeout and retry logic"""

import requests
import base64
import json
from datetime import datetime

JIRA_URL = 'https://digitalcaregroup.atlassian.net'
JIRA_EMAIL = 'kamila.molas@bolttech.pl'
JIRA_API_TOKEN = 'ATATT3xFfGF0bMFcpprpW79Be89fAtpErxtrMiFwewjVCf8LMQRmHNxMW9koZ_ul9TR1MKjjZGF0C6bs9Z5JNlpVAQx3NjFNjGRSsw-TeXKKjaxwCXgONMTRjUYneEWKYGG65zqTKNu8minfJvHT95Jki7hANPCX5rrISkuIn3RSoK7JZool45E=0F91C4B2'

def get_headers():
    cred = base64.b64encode(f'{JIRA_EMAIL}:{JIRA_API_TOKEN}'.encode()).decode()
    return {
        'Authorization': f'Basic {cred}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

print('🔍 Fetching LSG issues (Fast Mode)\n')

# Use JQL search with shorter query (just key and assignee first)
jql = 'project = LSG'
payload = {
    'jql': jql,
    'fields': ['key', 'summary', 'assignee', 'customfield_10270'],
    'maxResults': 50
}

try:
    url = f'{JIRA_URL}/rest/api/3/search/jql'
    print(f'📡 Quick query (timeout 20s): {jql}')
    
    resp = requests.post(
        url,
        headers=get_headers(),
        json=payload,
        timeout=20  # Short timeout
    )
    
    if resp.status_code == 200:
        data = resp.json()
        issues = data.get('issues', [])
        
        print(f'\n✅ Found {len(issues)} issues\n')
        
        # Group by assignee
        by_assignee = {}
        for issue in issues:
            assignee = issue['fields'].get('assignee', {})
            assignee_name = assignee.get('displayName', 'Unassigned') if assignee else 'Unassigned'
            project_name = issue['fields'].get('customfield_10270', 'N/A')
            
            if assignee_name not in by_assignee:
                by_assignee[assignee_name] = {'count': 0, 'projects': set()}
            
            by_assignee[assignee_name]['count'] += 1
            by_assignee[assignee_name]['projects'].add(project_name)
        
        # Display results
        print('👥 People Assigned (from different teams/projects):\n')
        for assignee in sorted(by_assignee.keys()):
            info = by_assignee[assignee]
            projects = ', '.join(sorted(info['projects']))
            print(f'   • {assignee}: {info["count"]} issues (Projects: {projects})')
        
        print(f'\n📊 Summary:')
        print(f'   • Total issues: {len(issues)}')
        print(f'   • Unique assignees: {len(by_assignee)}')
        print(f'   • Unique projects: {len(set(p for info in by_assignee.values() for p in info["projects"]))}')
        
    else:
        print(f'❌ HTTP Error: {resp.status_code}')
        print(f'   Response: {resp.text[:300]}')

except requests.Timeout:
    print(f'⏱️ Timeout (20s) - Jira API is slow')
    print(f'   Try again in a few minutes')
except Exception as e:
    print(f'❌ Error: {str(e)}')
