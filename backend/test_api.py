#!/usr/bin/env python
"""Test Jira import API endpoints"""

import requests
import json
import time

BASE_URL = 'http://localhost:5000'

def test_connection():
    """Test Jira connection"""
    print('🔗 Testing Jira connection...')
    try:
        resp = requests.get(f'{BASE_URL}/api/test-jira-connection', timeout=5)
        result = resp.json()
        if result.get('success'):
            print(f"✅ {result.get('message')}")
            print(f"   User: {result.get('user')}")
            return True
        else:
            print(f"❌ {result.get('error')}")
            return False
    except Exception as e:
        print(f'❌ Connection error: {e}')
        return False

def test_import():
    """Test Jira import with mock data"""
    print('\n📋 Fetching mock Jira issues...')
    try:
        payload = {
            'project': 'LSG',
            'jql': 'project = LSG',
            'fields': ['key', 'summary', 'assignee', 'status', 'timeoriginalestimate', 'cf[10695]', 'customfield_10270']
        }
        resp = requests.post(f'{BASE_URL}/api/jira/import', json=payload, timeout=10)
        result = resp.json()
        
        if result.get('success'):
            count = result.get('count', 0)
            print(f"✅ Found {count} issues from mock data")
            
            # Display issues
            if result.get('issues'):
                print('\n📊 Issues preview:')
                for issue in result['issues'][:5]:
                    dev_md = issue.get('dev_estimate_md', 0)
                    qa_md = issue.get('qa_estimate_md', 0)
                    print(f"  {issue['key']:8} | {issue['summary'][:30]:30} | {issue['assignee']:20} | Dev: {dev_md}MD | QA: {qa_md}MD")
            return True
        else:
            print(f"❌ {result.get('message')}")
            return False
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

def test_cache_status():
    """Check cache status"""
    print('\n💾 Cache status...')
    try:
        resp = requests.get(f'{BASE_URL}/api/cache/status', timeout=5)
        result = resp.json()
        print(f"✅ {result['total_entries']} cache entries, {result['total_size_kb']:.1f} KB total")
        return True
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    print('=' * 70)
    print('🚀 Jira Integration Backend Test')
    print('=' * 70)
    
    # Run tests
    conn_ok = test_connection()
    import_ok = test_import()
    cache_ok = test_cache_status()
    
    print('\n' + '=' * 70)
    if conn_ok and import_ok:
        print('✅ All tests passed! Frontend integration ready.')
    else:
        print('❌ Some tests failed. Check backend logs.')
    print('=' * 70)
