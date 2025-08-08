# Real Estate Email Processor - Troubleshooting Guide

## Common Issues and Solutions

### 1. Development vs Production Mode Issues

**Symptoms:**
- Code changes not appearing in browser
- Follow-up menu not working properly
- Old versions of components still showing

**Root Cause:**
Frontend running in production mode (nginx serving static files) instead of development mode (React dev server with hot reloading).

**How to check which mode you're in:**

**Development Mode (Correct for development):**
```bash
docker-compose logs frontend
# Should show: "Starting the development server..." and "webpack compiled"
# Browser URL shows: /static/js/bundle.js
```

**Production Mode (wrong for development):**
```bash
docker-compose logs frontend
# Shows: nginx access logs like "GET /static/js/main.[hash].js"
# Browser URL shows: /static/js/main.[hash].js
```

**Solution:**
```bash
docker-compose down
docker-compose up -d --build
# This automatically creates docker-compose.override.yml for development mode
```

**Verification:**
- Make a small change to any React file
- Browser should automatically refresh within 2-3 seconds
- Follow-up calendar icons should work with Material-UI dialogs

### 2. Frontend "Network Error" - Cannot Load Data

**Symptoms:**
- Frontend shows "Network error. Please check your connection"
- No data loads on the dashboard
- Browser console shows failed API requests to `http://backend:3101/...`

**Root Cause:**
React applications bake environment variables into the build at compile time. If `REACT_APP_API_URL` is set to an internal Docker hostname like `http://backend:3101`, the browser cannot access it because browsers run outside the Docker network.

**Solution:**
1. Ensure `docker-compose.yml` uses the correct API URL:
   ```yaml
   frontend:
     build:
       args:
         REACT_APP_API_URL: http://localhost:3101/real-estate-email-system-backend/api
   ```

2. Rebuild the frontend container:
   ```bash
   docker-compose down
   docker-compose up -d --build frontend
   ```

3. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Prevention:**
- Always use `localhost` with the exposed port for frontend environment variables
- Never use internal Docker service names (like `backend`) for URLs that browsers need to access
- Document this in docker-compose.yml with comments

### 3. Follow-up Menu Issues

**Symptoms:**
- Calendar icons not appearing on property cards
- Follow-up menu appears inside property card instead of as overlay
- Menu backdrop contained within card

**Root Cause:**
- Frontend running in production mode
- Browser cache showing old version
- Follow-up menu using old portal implementation

**Solution:**
1. Ensure development mode is running:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

2. Clear browser cache completely:
   - **Chrome/Safari**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - **Or**: Open DevTools → Application → Storage → Clear site data

3. Verify React dev server is running:
   ```bash
   docker-compose logs frontend --tail=10
   # Should show "webpack compiled" messages
   ```

**Expected Behavior:**
- Calendar icon on each property card (small circular button)
- Click opens Material-UI Dialog overlay (like rating popup)
- Full-screen backdrop with centered dialog
- 6 buttons in 2x3 grid: 30/60/90 days, 6mo/1yr/custom

### 4. Port Conflicts

**Symptoms:**
- Error: "bind: address already in use"
- Containers fail to start

**Solution:**
1. Check which process is using the port:
   ```bash
   # For macOS/Linux
   lsof -i :3100  # Frontend port
   lsof -i :3101  # Backend port
   lsof -i :3102  # MongoDB port
   
   # For Windows
   netstat -ano | findstr :3100
   ```

2. Either stop the conflicting process or change the ports in docker-compose.yml

### 3. MongoDB Connection Issues

**Symptoms:**
- Backend logs show "MongoNetworkError" or "MongoServerError"
- API returns 500 errors

**Solution:**
1. Check MongoDB container status:
   ```bash
   docker-compose ps mongodb
   docker-compose logs mongodb
   ```

2. Verify MongoDB is healthy:
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. Check connection string in backend environment

### 4. Backend API Not Responding

**Symptoms:**
- Frontend can't connect to backend
- Direct API calls fail

**Debugging Steps:**
1. Test backend health endpoint:
   ```bash
   curl http://localhost:3101/real-estate-email-system-backend/api/health
   ```

2. Check backend logs:
   ```bash
   docker-compose logs -f backend
   ```

3. Verify backend container is running:
   ```bash
   docker-compose ps backend
   ```

### 5. Docker Build Issues

**Symptoms:**
- Build fails with npm errors
- "Module not found" errors

**Solution:**
1. Clean rebuild:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. Remove orphaned volumes:
   ```bash
   docker volume prune
   ```

### 6. Environment Variable Issues

**Common Mistakes:**
- Using `${VAR}` syntax in .env files (should be just `VAR=value`)
- Missing .env files
- Wrong file permissions on .env files

**Debugging:**
1. Check if .env files exist:
   ```bash
   ls -la backend/.env frontend/.env
   ```

2. Verify environment variables in containers:
   ```bash
   docker-compose exec backend env | grep -E "(PORT|MONGODB_URI|NODE_ENV)"
   docker-compose exec frontend env | grep REACT_APP
   ```

### 7. CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors
- API requests blocked by browser

**Solution:**
1. Verify backend CORS configuration allows frontend origin
2. Check that frontend is using the correct API URL
3. Ensure no typos in the API URL

### 8. Data Not Persisting

**Symptoms:**
- Data disappears after container restart
- Database appears empty

**Solution:**
1. Check MongoDB volume is properly mounted:
   ```bash
   docker volume ls | grep mongodb_data
   ```

2. Verify data in MongoDB:
   ```bash
   docker-compose exec mongodb mongosh real-estate-email-processor --eval "db.properties.countDocuments()"
   ```

### 9. Pending Review System Not Working

**Symptoms:**
- Properties marked as duplicates don't appear in Pending Review
- "No properties pending review" when duplicates exist
- Status badge shows incorrect status

**Root Cause:**
Frontend and backend status mismatch. The backend uses `'pending'` status for duplicates, but frontend might be looking for `'pending_review'`.

**Solution:**
1. Verify backend is using correct status:
   ```bash
   docker-compose exec mongodb mongosh real-estate-email-processor \
     --eval "db.properties.find({status: 'pending'}).count()"
   ```

2. Check that frontend constants use `'pending'` not `'pending_review'`:
   - `frontend/src/constants/index.js` should have `PENDING: 'pending'`
   - PropertyForm should only have `['active', 'sold', 'pending']` as status options

3. Clear browser cache and restart frontend:
   ```bash
   docker-compose restart frontend
   ```

**Prevention:**
- Always use backend-defined status values: `'active'`, `'pending'`, `'sold'`, `'archived'`
- The label "Pending Review" is just for UI display, the actual status is `'pending'`
- When a duplicate is detected, it gets `status: 'pending'` and `duplicate_of: originalId`

## Useful Commands

### Container Management
```bash
# View all containers
docker-compose ps

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# View real-time logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Debugging
```bash
# Access backend container shell
docker-compose exec backend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# Check network connectivity between containers
docker-compose exec frontend ping backend
```

### Cleanup
```bash
# Stop and remove all containers
docker-compose down

# Remove all containers and volumes (WARNING: deletes data)
docker-compose down -v

# Remove all Docker artifacts (nuclear option)
docker system prune -a --volumes
```

## Getting Help

1. Check container logs first - they usually contain the error details
2. Verify all services are running with `docker-compose ps`
3. Test individual components (MongoDB, backend API, frontend) separately
4. Check browser console for frontend errors
5. Use browser Network tab to inspect API calls

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Express CORS Guide](https://expressjs.com/en/resources/middleware/cors.html)
- [MongoDB Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)