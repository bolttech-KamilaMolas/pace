#!/usr/bin/env python
"""Test Jira connection and fetch LSG project data"""

import requests
import base64
import json

JIRA_URL = 'https://digitalcaregroup.atlassian.net'
JIRA_EMAIL = 'kamila.molas@bolttech.pl'
JIRA_API_TOKEN = 'ATATT3xFfGF0bMFcpprpW79Be89fAtpErxtrMiFwewjVCf8LMQRmHNxMW9koZ_ul9TR1MKjjZGF0C6bs9Z5JNlpVAQx3NjFNjGRSsw-TeXKKjaxwCXgONMTRjUYneEWKYGG65zqTKNu8minfJvHT95Jki7hANPCX5rrISkuIn3RSoK7JZool45E=0F91C4B2'

def get_headers():
    cred = base64.b64encode(f'{JIRA_EMAIL}:{JIRA_API_TOKEN}'.encode()).decode()
    return {
        'Authorization': f'Basic {cred}',
        'Accept': 'application/json'
    }

print('🔐 Testing Jira connection...')
try:
    resp = requests.get(f'{JIRA_URL}/rest/api/3/myself', headers=get_headers(), timeout=10)
    if resp.status_code == 200:
        user = resp.json()
        print(f'✅ Connected as: {user.get("displayName")}')
        print(f'   Email: {user.get("emailAddress")}')
    else:
        print(f'❌ Connection failed: {resp.status_code}')
        print(f'   Response: {resp.text[:200]}')
except Exception as e:
    print(f'❌ Error: {str(e)}')

# Get projects
print('\n📋 Fetching projects...')
try:
    resp = requests.get(f'{JIRA_URL}/rest/api/3/project', headers=get_headers(), timeout=10)
    projects = resp.json()
    print(f'✅ Found {len(projects)} projects:')
    for proj in projects[:15]:
        print(f'   • {proj["key"]}: {proj["name"]}')
except Exception as e:
    print(f'❌ Error: {str(e)}')

# Search LSG issues
print('\n🔍 Searching LSG issues...')
try:
    params = {
        'jql': 'project = "LSG"',
        'fields': ['key', 'summary', 'assignee', 'status'],
        'maxResults': 10
    }
    resp = requests.get(f'{JIRA_URL}/rest/api/3/search', headers=get_headers(), params=params, timeout=10)
    data = resp.json()
    print(f'✅ Found {data.get("total", 0)} LSG issues')
    for issue in data.get('issues', [])[:5]:
        assignee = issue['fields'].get('assignee', {})
        print(f'   • {issue["key"]}: {issue["fields"]["summary"][:40]} ({assignee.get("displayName", "Unassigned")})')
except Exception as e:
    print(f'❌ Error: {str(e)}')
