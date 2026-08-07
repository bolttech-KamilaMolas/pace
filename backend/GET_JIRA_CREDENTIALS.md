# How to Get Jira Credentials for Backend

## Step 1: Get Your Jira URL
1. Open your Jira instance (e.g., https://your-company.atlassian.net)
2. Look at the browser address bar
3. Copy everything up to and including `.net` (or your domain)
4. Example: `https://bolttech.atlassian.net`

## Step 2: Get Your Email
- Use the email you login to Jira with
- Example: `kamila.molas@example.com`

## Step 3: Create API Token
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "Capacity Planner Backend")
4. Click "Create"
5. Copy the token (you'll only see it once!)
6. Example token: `ATATT3xFfGH0123456789...` (long string)

## Step 4: Find Board ID
Open PowerShell and run:

```powershell
$email = "your-email@example.com"
$token = "your-api-token"
$jiraUrl = "https://your-company.atlassian.net"

$cred = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("$email`:$token"))
$headers = @{
    Authorization = "Basic $cred"
    Accept = "application/json"
}

$response = Invoke-WebRequest -Uri "$jiraUrl/rest/api/3/board" -Headers $headers -UseBasicParsing
$boards = $response.Content | ConvertFrom-Json

$boards.values | ForEach-Object {
    Write-Host "Board: $($_.name) (ID: $($_.id))"
}
```

Look for your board (usually "LSG" or "Scrum Board 1") and note the ID.

## Step 5: Update .env
Edit `backend/.env` and replace:
```
JIRA_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
JIRA_BOARD_ID=1
```

## Step 6: Test Connection
Run in `backend/` directory:
```bash
python
>>> import requests
>>> import base64
>>> from dotenv import load_dotenv
>>> import os
>>> 
>>> load_dotenv()
>>> email = os.getenv('JIRA_EMAIL')
>>> token = os.getenv('JIRA_API_TOKEN')
>>> jira_url = os.getenv('JIRA_URL')
>>> 
>>> cred = base64.b64encode(f"{email}:{token}".encode()).decode()
>>> headers = {'Authorization': f'Basic {cred}', 'Accept': 'application/json'}
>>> 
>>> response = requests.get(f"{jira_url}/rest/api/3/myself", headers=headers)
>>> print(response.json())
```

You should see your Jira user info printed.

## Next: Query LSG Project Data

Once credentials work, run:

```python
# Get issues from LSG project sprint 9910
jql = 'project = "LSG" AND sprint = 9910'
params = {
    'jql': jql,
    'fields': ['assignee', 'customfield_10270', 'timeoriginalestimate', 'customfield_10695', 'status', 'summary']
}

response = requests.get(f"{jira_url}/rest/api/3/search", headers=headers, params=params)
issues = response.json()['issues']

for issue in issues:
    assignee = issue['fields']['assignee']['displayName']
    project = issue['fields']['customfield_10270']
    status = issue['fields']['status']['name']
    print(f"{issue['key']}: {assignee} | {project} | {status}")
```

This will show all people assigned to tasks in the sprint, their projects, and statuses.
