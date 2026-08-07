#!/usr/bin/env python
"""Test /api/jira/import endpoint - fetch LSG issues via backend"""

import requests
import json

BASE_URL = "http://localhost:5000"

print("📊 Testing /api/jira/import endpoint\n")

# Payload for LSG import
payload = {
    "project": "LSG",
    "jql": 'project = "LSG" ORDER BY assignee DESC',
    "fields": ["key", "summary", "assignee", "status", "timeoriginalestimate", "customfield_10695", "customfield_10270"]
}

print(f"📤 Sending request to {BASE_URL}/api/jira/import")
print(f"   Payload: {json.dumps(payload, indent=2)}\n")

try:
    resp = requests.post(
        f"{BASE_URL}/api/jira/import",
        json=payload,
        timeout=60  # 60s timeout for Jira API
    )
    
    print(f"📬 Response status: {resp.status_code}\n")
    
    if resp.status_code == 200:
        data = resp.json()
        
        if data.get('success'):
            issues = data.get('issues', [])
            print(f"✅ Success! Imported {len(issues)} issues\n")
            
            # Group by assignee
            by_assignee = {}
            for issue in issues:
                assignee = issue.get('assignee', 'Unassigned')
                if assignee not in by_assignee:
                    by_assignee[assignee] = []
                by_assignee[assignee].append(issue)
            
            print(f"👥 Issues by Assignee ({len(by_assignee)} unique people):\n")
            for assignee in sorted(by_assignee.keys()):
                person_issues = by_assignee[assignee]
                total_dev = sum(i.get('dev_estimate_md', 0) for i in person_issues)
                total_qa = sum(i.get('qa_estimate_md', 0) for i in person_issues)
                
                print(f"   {assignee} ({len(person_issues)} issues, {total_dev:.1f}MD dev, {total_qa:.1f}MD qa)")
                for issue in person_issues[:2]:
                    print(f"      • {issue['key']}: {issue['summary'][:40]}")
                if len(person_issues) > 2:
                    print(f"      ... and {len(person_issues) - 2} more")
            
            print(f"\n📊 Summary:")
            print(f"   • Total issues: {len(issues)}")
            print(f"   • Unique assignees: {len(by_assignee)}")
            print(f"   • Total dev MD: {sum(i.get('dev_estimate_md', 0) for i in issues):.1f}")
            print(f"   • Total qa MD: {sum(i.get('qa_estimate_md', 0) for i in issues):.1f}")
        else:
            print(f"❌ API returned error: {data.get('error')}")
    else:
        print(f"❌ HTTP Error {resp.status_code}")
        print(f"   Response: {resp.text[:500]}")

except Exception as e:
    print(f"❌ Error: {str(e)}")
