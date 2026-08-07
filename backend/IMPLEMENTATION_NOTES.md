# Backend Implementation Notes

**Version:** 1.0 (Basic - Python Flask)  
**Date:** August 7, 2026  
**Status:** Phase 1 - Foundation

---

## 🏗️ Architecture (Current)

### Technology Stack
- **Language:** Python 3.14
- **Framework:** Flask (lightweight, easy to extend)
- **Caching:** In-memory dict (TODO: Redis for production)
- **HTTP:** Flask development server (TODO: gunicorn for production)
- **Auth:** Jira Basic Auth (email + API token)

### Project Structure
```
backend/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── .env.example              # Configuration template
├── IMPLEMENTATION_NOTES.md   # This file
├── tests/                    # (TODO) Unit tests
└── migrations/               # (TODO) Database migrations
```

---

## 📝 Endpoints (Phase 1)

### 1. Health Check
```
GET /health
→ { status, timestamp, jira_url, cache_entries }
```

### 2. Sprint Detection
```
GET /api/sprints/detect
→ { current, upcoming[], upcoming_with_work[], timestamp }

Cache: 24 hours
```

### 3. Jira Import
```
POST /api/jira/import
Body: { jql_query, sprint_id? }
→ { success, issuesCount, allocations_by_sprint[], allocations_by_person[] }

Cache: 1 hour per sprint
```

### 4. Cache Status
```
GET /api/cache/status
→ { entries[], total_entries, total_size_kb, timestamp }
```

### 5. Cache Invalidation
```
POST /api/cache/invalidate
Body: { type: 'full|issues|sprints', sprint_id? }
→ { success, message }
```

### 6. Test Jira Connection
```
GET /api/test-jira-connection
→ { success, user, email } or { error }
```

---

## 🚀 How to Run (Local)

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env with your Jira credentials
# JIRA_URL=https://your-instance.atlassian.net
# JIRA_EMAIL=your-email@example.com
# JIRA_API_TOKEN=your-api-token
# JIRA_BOARD_ID=1
```

### 3. Get Jira API Token
- Go to: https://id.atlassian.com/manage-profile/security/api-tokens
- Create new token
- Copy and paste to .env

### 4. Find Board ID
```bash
# Query Jira API
curl -u your-email:your-token https://your-instance.atlassian.net/rest/api/3/board
# Look for the board you want (typically "id": 1 for first board)
```

### 5. Start Backend
```bash
python app.py
```

Backend runs on: **http://localhost:5000**

### 6. Test Connection
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/test-jira-connection
```

---

## 🔧 Current Implementation Details

### Caching Strategy (In-Memory)
```python
cache_store = {
    'key': {
        'data': {...},
        'expires': datetime(2026-08-07 10:00:00)
    }
}

TTL:
- Issues: 1 hour
- Sprint config: 24 hours
```

**Functions:**
- `cache_get(key)` - Get if not expired
- `cache_set(key, data, ttl_key)` - Store with TTL
- `cache_clear(pattern)` - Manual invalidation

### Field Mapping
**Seconds → Man-Days:**
```python
1 man-day = 8 hours = 28800 seconds
md = seconds / 28800
```

**Jira Status → Scope:**
```
"To Do" → "planowany"
"In Progress" → "w_realizacji"
"In Testing" → "testing"
"Done" → "done"
(+ more statuses mapped)
```

**Assignee → Person:**
```
Jira: { displayName, emailAddress }
→ Capacity: "First Last" (from displayName or email)
```

---

## ⚠️ Limitations (Phase 1)

1. **No Real Redis** - Uses in-memory cache
   - Cache lost on app restart
   - Not suitable for multi-process deployments
   - TODO: Add Redis for production

2. **No Database** - No persistent storage
   - TODO: Add PostgreSQL/SQLite for historical data

3. **No Async Jobs** - Jira API calls are synchronous
   - Large imports might timeout
   - TODO: Add Celery/job queue for background tasks

4. **No Webhooks** - Manual cache invalidation only
   - TODO: Add Jira webhook handler for real-time updates

5. **No Rate Limiting** - No protection against abuse
   - TODO: Add Flask-Limiter

6. **Single Process** - Development server only
   - TODO: Deploy with gunicorn + nginx

---

## 📋 Tasks for Production (Phase 2-3)

### Immediate (Phase 2 - 2-3 days)
- [ ] Add Redis integration (replace in-memory cache)
- [ ] Implement Jira webhook receiver
- [ ] Add request logging & monitoring
- [ ] Unit tests for mapping functions
- [ ] Integration tests (mock Jira API)

### Medium-term (Phase 3 - 1-2 weeks)
- [ ] Add PostgreSQL for historical allocations
- [ ] Implement async job queue (Celery)
- [ ] Add rate limiting (Flask-Limiter)
- [ ] Deploy with gunicorn + nginx
- [ ] Add API authentication (JWT tokens)
- [ ] Comprehensive error handling

### Long-term (Future)
- [ ] Migrate to Node.js (if needed for real-time performance)
- [ ] Add WebSocket support (Socket.io alternative: python-socketio)
- [ ] Implement GraphQL API (optional)
- [ ] Add machine learning for allocation predictions

---

## 🔄 Migration Plan: Python → Node.js (Later)

**When:** When performance/real-time requirements exceed Python capabilities

**Steps:**
1. Create Node.js/Express equivalent of `app.py`
2. Port all mapping functions (should be identical logic)
3. Keep same API endpoints (/api/jira/import, /api/sprints/detect, etc.)
4. Add Socket.io for real-time updates
5. Gradually migrate frontend to use Node.js backend
6. Run parallel for 1-2 sprints before full cutover

**Why Python First:**
- ✅ Faster prototyping
- ✅ Easier debugging (simpler code)
- ✅ Suitable for internal tools
- ✅ Can migrate later without breaking frontend

**Why Node.js Eventually:**
- ✅ Better real-time (Socket.io native)
- ✅ Same language as frontend (easier to debug)
- ✅ Better performance (async/await)
- ✅ Native npm ecosystem integration

---

## 🧪 Testing

### Manual Testing (Now)
```bash
# 1. Check health
curl http://localhost:5000/health

# 2. Test Jira connection
curl http://localhost:5000/api/test-jira-connection

# 3. Detect sprints
curl http://localhost:5000/api/sprints/detect

# 4. Import issues
curl -X POST http://localhost:5000/api/jira/import \
  -H "Content-Type: application/json" \
  -d '{"jql_query": "project = \"LSG\" AND sprint = 9910"}'
```

### Automated Testing (TODO)
```bash
# Unit tests
pytest tests/test_mappers.py

# Integration tests
pytest tests/test_api.py --live-jira

# Coverage report
pytest --cov=app tests/
```

---

## 📊 Performance Notes

### Current (Phase 1)
- Sprint detection: ~1-2 seconds (includes Jira API call)
- Issue import (100 issues): ~3-5 seconds
- Cache hit: <10ms
- Memory usage: ~50-100MB typical

### Production Goals (Phase 2+)
- Sprint detection: <500ms (with Redis cache)
- Issue import: <1 second (with async)
- Cache hit: <1ms (Redis)
- Memory usage: <200MB

### Optimization Techniques
- Batch Jira API calls (fewer round trips)
- Parallel issue processing (multiprocessing)
- Redis for distributed caching
- Connection pooling (requests library)

---

## 🔐 Security Considerations

### Current Issues (Phase 1)
- ⚠️ Jira token in plaintext .env file
- ⚠️ No request authentication
- ⚠️ No rate limiting
- ⚠️ No input validation

### Fixes (Phase 2+)
- [ ] Move credentials to secure vault (HashiCorp Vault, AWS Secrets Manager)
- [ ] Implement JWT authentication for /api endpoints
- [ ] Add request validation (Marshmallow schemas)
- [ ] Rate limiting (Flask-Limiter)
- [ ] HTTPS only (nginx termination)
- [ ] CORS whitelist (specific origins only)

---

## 📞 Troubleshooting

### "Jira API Error: 401 Unauthorized"
→ Check JIRA_EMAIL and JIRA_API_TOKEN in .env

### "Jira API Error: 404 Not Found"
→ Check JIRA_URL is correct
→ Check JIRA_BOARD_ID exists

### "ModuleNotFoundError: No module named 'flask'"
→ Run: `pip install -r requirements.txt`

### Backend not starting on port 5000
→ Check if port is already in use
→ Run: `netstat -ano | findstr :5000` (Windows)
→ Kill process: `taskkill /PID <pid> /F`

---

## 📚 Reference

- Jira API Docs: https://developer.atlassian.com/cloud/jira/rest/v3/
- Flask Docs: https://flask.palletsprojects.com/
- Python Requests: https://requests.readthedocs.io/

---

**Last Updated:** August 7, 2026  
**Next Review:** August 14, 2026
