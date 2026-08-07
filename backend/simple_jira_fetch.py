#!/usr/bin/env python
"""Simple direct Jira fetch - no backend involved"""

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
        'Accept': 'application/json'
    }

print('🔍 Fetching LSG issues...\n')

# Search LSG issues with custom fields
jql = 'project = LSG ORDER BY assignee DESC'
params = {
    'jql': jql,
    'fields': ['key', 'summary', 'assignee', 'status', 'timeoriginalestimate', 'customfield_10695', 'customfield_10270'],
    'maxResults': 100
}

try:
    url = f'{JIRA_URL}/rest/api/3/search/jql'
    print(f'📡 Querying: {jql}')
    print(f'🔗 URL: {url}\n')
    
    resp = requests.post(url, headers=get_headers(), json=params, timeout=30)
    
    if resp.status_code == 200:
        data = resp.json()
        issues = data.get('issues', [])
        
        print(f'✅ Found {len(issues)} issues\n')
        
        # Group by assignee
        by_assignee = {}
        for issue in issues:
            key = issue['key']
            summary = issue['fields']['summary'][:40]
            assignee = issue['fields'].get('assignee', {})
            assignee_name = assignee.get('displayName', 'Unassigned') if assignee else 'Unassigned'
            status = issue['fields'].get('status', {}).get('name', 'Unknown')
            original_est = issue['fields'].get('timeoriginalestimate', 0)  # seconds
            test_est = issue['fields'].get('customfield_10695', 0)  # seconds
            project_name = issue['fields'].get('customfield_10270', 'N/A')
            
            if assignee_name not in by_assignee:
                by_assignee[assignee_name] = []
            
            by_assignee[assignee_name].append({
                'key': key,
                'summary': summary,
                'status': status,
                'original_estimate_md': original_est / 28800 if original_est else 0,  # Convert seconds to man-days
                'test_estimate_md': test_est / 28800 if test_est else 0,
                'project_name': project_name
            })
        
        # Display results
        print('👥 Issues by Assignee:\n')
        for assignee in sorted(by_assignee.keys()):
            issues_list = by_assignee[assignee]
            print(f'{assignee}: ({len(issues_list)} issues)')
            for issue in issues_list[:3]:
                print(f'   • {issue["key"]}: {issue["summary"]} [{issue["status"]}]')
                print(f'     Dev: {issue["original_estimate_md"]:.1f}MD, QA: {issue["test_estimate_md"]:.1f}MD')
            if len(issues_list) > 3:
                print(f'   ... and {len(issues_list) - 3} more')
            print()
        
        # Summary
        print(f'\n📊 Summary:')
        print(f'   • Total issues: {len(issues)}')
        print(f'   • Unique assignees: {len(by_assignee)}')
        print(f'   • Total dev time: {sum(i["original_estimate_md"] for issue_list in by_assignee.values() for i in issue_list):.1f} MD')
        print(f'   • Total test time: {sum(i["test_estimate_md"] for issue_list in by_assignee.values() for i in issue_list):.1f} MD')
        
    else:
        print(f'❌ Error: {resp.status_code}')
        print(resp.text[:500])

except Exception as e:
    print(f'❌ Error: {str(e)}')
