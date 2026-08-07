#!/usr/bin/env python
"""Fetch LSG issues from Jira via backend API"""

import requests
import json

BASE_URL = "http://localhost:5000"

print("🚀 Testing Backend API\n")

# 1. Test connection
print("1️⃣ Testing Jira connection...")
resp = requests.get(f"{BASE_URL}/api/test-jira-connection")
data = resp.json()
if data.get('success'):
    print(f"   ✅ Connected as: {data.get('user')}")
else:
    print(f"   ❌ Error: {data.get('error', 'Unknown error')[:100]}")

# 2. Detect sprints
print("\n2️⃣ Detecting sprints...")
resp = requests.get(f"{BASE_URL}/api/sprints/detect")
data = resp.json()
if data.get('success'):
    sprints = data.get('sprints', [])
    print(f"   ✅ Found {len(sprints)} sprints")
    for sprint in sprints[:5]:
        print(f"      • {sprint['name']}: {sprint['status']} ({sprint['issueCount']} issues)")
else:
    print(f"   ❌ Error: {data.get('error', 'Unknown error')}")

# 3. Import LSG issues
print("\n3️⃣ Importing LSG issues...")
payload = {
    "project": "LSG",
    "sprintIds": [9910, 9675, 9609, 9576, 9811],
    "fields": ["key", "summary", "assignee", "status", "timeoriginalestimate", "customfield_10695"]
}
resp = requests.post(f"{BASE_URL}/api/jira/import", json=payload)
data = resp.json()
if data.get('success'):
    issues = data.get('issues', [])
    print(f"   ✅ Imported {len(issues)} issues")
    
    # Show people from different teams
    people = {}
    for issue in issues:
        assignee = issue.get('assignee')
        if assignee:
            if assignee not in people:
                people[assignee] = []
            people[assignee].append(issue['key'])
    
    print(f"\n   👥 People assigned (unique):")
    for person in sorted(people.keys())[:10]:
        print(f"      • {person}: {len(people[person])} issues")
        
    # Show cross-team allocations
    print(f"\n   📊 Sample allocations:")
    for issue in issues[:5]:
        print(f"      • {issue['key']}: {issue['summary'][:40]} → {issue.get('assignee', 'Unassigned')}")
else:
    print(f"   ❌ Error: {data.get('error', 'Unknown error')[:200]}")

print("\n✅ Done!")
