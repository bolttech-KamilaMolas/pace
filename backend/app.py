"""
Jira Integration Backend for Capacity Planner
- Sprint detection & configuration
- Jira issue import with field mapping
- Redis caching (1h for issues, 24h for config)
- Real-time cache invalidation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime, timedelta
import base64
from functools import wraps
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration from environment
JIRA_URL = os.getenv('JIRA_URL', 'https://jira.your-instance.com')
JIRA_EMAIL = os.getenv('JIRA_EMAIL', '')
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN', '')
BOARD_ID = os.getenv('JIRA_BOARD_ID', '1')

# In-memory cache (TODO: Replace with Redis for production)
# Structure: { 'key': {'data': ..., 'expires': timestamp} }
cache_store = {}
CACHE_TTL = {
    'issues': 3600,          # 1 hour
    'allocations': 3600,     # 1 hour
    'sprint_config': 86400   # 24 hours
}

# ============================================================================
# UTILITIES
# ============================================================================

def get_jira_auth_header():
    """Generate Jira Basic Auth header"""
    credentials = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {'Authorization': f'Basic {encoded}'}

def cache_get(key):
    """Get value from cache if not expired"""
    if key in cache_store:
        entry = cache_store[key]
        if datetime.now() < entry['expires']:
            logger.info(f"✅ Cache HIT: {key}")
            return entry['data']
        else:
            del cache_store[key]
            logger.info(f"❌ Cache EXPIRED: {key}")
    logger.info(f"❌ Cache MISS: {key}")
    return None

def cache_set(key, data, ttl_key='issues'):
    """Set value in cache with TTL"""
    ttl = CACHE_TTL.get(ttl_key, 3600)
    cache_store[key] = {
        'data': data,
        'expires': datetime.now() + timedelta(seconds=ttl)
    }
    logger.info(f"✅ Cached: {key} (TTL: {ttl}s)")

def cache_clear(pattern=None):
    """Clear cache entries matching pattern"""
    if pattern:
        keys_to_delete = [k for k in cache_store.keys() if pattern in k]
        for k in keys_to_delete:
            del cache_store[k]
        logger.info(f"🗑️  Cleared {len(keys_to_delete)} cache entries matching '{pattern}'")
    else:
        cache_store.clear()
        logger.info(f"🗑️  Cleared entire cache")

def jira_request(endpoint, method='GET', params=None):
    """Make authenticated request to Jira API"""
    url = f"{JIRA_URL}/rest/api/3/{endpoint}"
    headers = get_jira_auth_header()
    headers['Accept'] = 'application/json'
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params)
        else:
            response = requests.request(method, url, headers=headers, json=params)
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Jira API Error: {str(e)}")
        raise

# ============================================================================
# FIELD MAPPING FUNCTIONS
# ============================================================================

def map_seconds_to_md(seconds):
    """Convert seconds to man-days (1 MD = 28800 sec = 8 hours)"""
    if not seconds:
        return 0
    return round(seconds / 28800, 2)

def map_jira_status_to_scope(jira_status_name):
    """Map Jira status to capacity-planner scope"""
    status_map = {
        'to do': 'planowany',
        'backlog': 'planowany',
        'in progress': 'w_realizacji',
        'in development': 'dev',
        'in testing': 'testing',
        'in review': 'review',
        'in qa': 'testing',
        'in uat': 'uat',
        'ready for production': 'ready_deploy',
        'ready for prod': 'ready_deploy',
        'done': 'done',
        'closed': 'done',
        'blocked': 'blocked',
        'on hold': 'on_hold',
        'cancelled': 'cancelled'
    }
    
    jira_status_lower = jira_status_name.lower()
    for jira_status, scope in status_map.items():
        if jira_status in jira_status_lower:
            return scope
    
    return 'w_realizacji'  # Default

def map_jira_issue_to_allocation(issue, person_name, project_info):
    """Transform Jira issue to allocation entry"""
    fields = issue.get('fields', {})
    
    original_estimate_sec = fields.get('timeoriginalestimate') or 0
    test_estimate_sec = fields.get('customfield_10695') or 0
    
    original_estimate_md = map_seconds_to_md(original_estimate_sec)
    test_estimate_md = map_seconds_to_md(test_estimate_sec)
    
    # Use original estimate for dev, test estimate for QA
    used_estimate_md = original_estimate_md or test_estimate_md or 0
    
    # Calculate allocation % (assume 10 person team, 10 days sprint = 100 MD capacity)
    team_capacity_md = 100
    allocation_percent = min(int((used_estimate_md / team_capacity_md) * 100), 100)
    
    return {
        'person': person_name,
        'project': project_info.get('name', 'Unknown'),
        'projectId': project_info.get('id'),
        'scope': map_jira_status_to_scope(fields.get('status', {}).get('name', '')),
        'percent': allocation_percent,
        'estimateMD': used_estimate_md,
        'origEstimateMD': original_estimate_md,
        'testEstimateMD': test_estimate_md,
        'jiraKey': issue.get('key'),
        'summary': fields.get('summary', ''),
        'source': 'jira'
    }

def get_person_from_jira_assignee(assignee_obj):
    """Extract person name from Jira assignee object"""
    if not assignee_obj:
        return None
    
    # Try display name first, then email
    display_name = assignee_obj.get('displayName')
    email = assignee_obj.get('emailAddress')
    
    if display_name:
        return display_name
    elif email:
        # Extract name from email (e.g., "kamila.molas@example.com" -> "Kamila Molas")
        return email.split('@')[0].replace('.', ' ').title()
    
    return None

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'jira_url': JIRA_URL,
        'cache_entries': len(cache_store)
    })

@app.route('/api/sprints/detect', methods=['GET'])
def detect_sprints():
    """
    Detect current and upcoming sprints from Jira
    Returns: current sprint + next 3 sprints with work
    """
    cache_key = 'sprints:config'
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)
    
    try:
        # Query Jira Board API for sprints
        sprints_data = jira_request(
            f'board/{BOARD_ID}/sprint',
            params={'state': 'active,future'}
        )
        
        sprints = []
        for sprint in sprints_data.get('values', []):
            # Count issues in this sprint
            issues_response = jira_request(
                'search',
                params={
                    'jql': f'sprint = {sprint["id"]}',
                    'fields': 'key',
                    'maxResults': 1  # Only need count
                }
            )
            issues_count = issues_response.get('total', 0)
            
            sprints.append({
                'id': sprint['id'],
                'name': sprint['name'],
                'state': sprint['state'],
                'startDate': sprint.get('startDate'),
                'endDate': sprint.get('endDate'),
                'issuesCount': issues_count,
                'hasWork': issues_count > 0
            })
        
        # Categorize
        current = next((s for s in sprints if s['state'] == 'active'), None)
        upcoming = [s for s in sprints if s['state'] == 'future']
        upcoming_with_work = [s for s in upcoming if s['hasWork']][:3]
        
        result = {
            'current': current,
            'upcoming': upcoming,
            'upcoming_with_work': upcoming_with_work,
            'timestamp': datetime.now().isoformat()
        }
        
        cache_set(cache_key, result, 'sprint_config')
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"❌ Error detecting sprints: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/jira/import', methods=['POST'])
def import_jira_issues():
    """
    Import issues from Jira for capacity-planner frontend
    Request body: { "project": "LSG", "jql": "...", "fields": [...] }
    Returns: { "success": true, "issues": [{key, summary, assignee, status, dev_estimate_md, qa_estimate_md}] }
    """
    data = request.get_json()
    project = data.get('project', 'LSG')
    jql = data.get('jql', f'project = {project}')
    fields_requested = data.get('fields', [])
    
    # Use mock data for testing if available
    use_mock = os.path.exists('mock_lsg_issues.json')
    
    try:
        if use_mock and project.upper() == 'LSG':
            logger.info("📋 Using mock data from mock_lsg_issues.json")
            with open('mock_lsg_issues.json', 'r') as f:
                issues_data = json.load(f)
                issues = issues_data.get('issues', [])
            logger.info(f"📋 Loaded {len(issues)} issues from mock data")
            if issues:
                logger.info(f"📋 First issue sample: {json.dumps(issues[0])}")
        else:
            # Query Jira for issues
            issues_response = jira_request(
                'search',
                params={
                    'jql': jql,
                    'fields': fields_requested or [
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
            )
            issues = issues_response.get('issues', [])
        
        # Transform to frontend-friendly format
        transformed_issues = []
        
        logger.info(f"🔄 Starting transformation of {len(issues)} issues...")
        
        for idx, issue in enumerate(issues):
            logger.info(f"🔄 [{idx}] Transforming issue: {issue.get('key')}")
            
            fields = issue.get('fields', {})
            logger.info(f"   - fields keys: {list(fields.keys())}")
            
            # Extract assignee name
            assignee_obj = fields.get('assignee')
            person_name = None
            if assignee_obj:
                person_name = assignee_obj.get('displayName') or assignee_obj.get('emailAddress')
            logger.info(f"   - assignee: {person_name}")
            
            # Convert seconds to man-days
            dev_estimate_sec = fields.get('timeoriginalestimate') or 0
            qa_estimate_sec = fields.get('customfield_10695') or 0
            dev_estimate_md = map_seconds_to_md(dev_estimate_sec)
            qa_estimate_md = map_seconds_to_md(qa_estimate_sec)
            logger.info(f"   - dev_estimate_md: {dev_estimate_md}, qa_estimate_md: {qa_estimate_md}")
            
            transformed_issue = {
                'key': issue.get('key'),
                'summary': fields.get('summary', ''),
                'assignee': person_name,
                'status': fields.get('status', {}).get('name', ''),
                'dev_estimate_md': dev_estimate_md,
                'qa_estimate_md': qa_estimate_md,
                'project_name': fields.get('customfield_10270', 'Unknown')
            }
            logger.info(f"   ✅ Transformed: {json.dumps(transformed_issue)}")
            transformed_issues.append(transformed_issue)
        
        result = {
            'success': True,
            'issues': transformed_issues,
            'count': len(transformed_issues),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Imported {len(transformed_issues)} issues from {project}")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"❌ Error importing Jira issues: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e),
            'issues': []
        }), 500

@app.route('/api/cache/status', methods=['GET'])
def cache_status():
    """Get cache statistics"""
    entries = []
    total_size = 0
    
    for key, entry in cache_store.items():
        import sys
        size = sys.getsizeof(json.dumps(entry['data']))
        total_size += size
        
        entries.append({
            'key': key,
            'size_kb': round(size / 1024, 2),
            'expires': entry['expires'].isoformat(),
            'expired': datetime.now() >= entry['expires']
        })
    
    return jsonify({
        'entries': entries,
        'total_entries': len(cache_store),
        'total_size_kb': round(total_size / 1024, 2),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """Clear cache (manual invalidation)"""
    data = request.get_json()
    cache_type = data.get('type', 'full')  # 'full', 'issues', 'sprints'
    sprint_id = data.get('sprint_id')
    
    if cache_type == 'full':
        cache_clear()
        message = "✅ Full cache cleared"
    elif cache_type == 'issues':
        pattern = f'jira:issues:{sprint_id}' if sprint_id else 'jira:issues'
        cache_clear(pattern)
        message = f"✅ Issues cache cleared (pattern: {pattern})"
    elif cache_type == 'sprints':
        cache_clear('sprints:')
        message = "✅ Sprint config cache cleared"
    else:
        cache_clear(cache_type)
        message = f"✅ Cache entries matching '{cache_type}' cleared"
    
    logger.info(message)
    return jsonify({'success': True, 'message': message})

@app.route('/api/test-jira-connection', methods=['GET'])
def test_jira_connection():
    """Test connection to Jira and verify credentials"""
    try:
        response = jira_request('myself')
        return jsonify({
            'success': True,
            'message': 'Connected to Jira',
            'user': response.get('displayName'),
            'email': response.get('emailAddress')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# ERROR HANDLING
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    logger.info(f"🚀 Starting Jira Integration Backend")
    logger.info(f"📍 Jira URL: {JIRA_URL}")
    logger.info(f"🎯 Board ID: {BOARD_ID}")
    
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True,
        use_reloader=False
    )
