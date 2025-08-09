# Real Estate Email Processor - Architecture Notes

## Current Working State (as of last update)

This document captures the current working state of the Real Estate Email Processor system after resolving the pending review synchronization issues.

## System Architecture

### Services and Ports

- **Frontend (React)**: Port 3100 [[memory:5110635]]
  - **Development**: React dev server with hot reloading (`frontend/Dockerfile.dev`)
  - **Production**: Nginx serving built static files (`frontend/Dockerfile`)
- **Backend (Node.js/Express)**: Port 3101 [[memory:5110635]]
  - **Development**: Nodemon with hot reloading
  - **Production**: Standard Node.js process
- **MongoDB**: Port 3102 [[memory:5110635]]

### Development vs Production Modes

#### Development Mode (Recommended for development)
- **Frontend**: React development server with hot reloading
- **Backend**: Nodemon with automatic restart on file changes
- **Volume Mounting**: Live code updates without rebuilding containers
- **Configuration**: `docker-compose.override.yml` automatically created
- **File Watching**: Changes to React/JS files trigger automatic updates

#### Production Mode
- **Frontend**: Pre-built React app served by nginx
- **Backend**: Optimized Node.js process
- **No Volume Mounting**: Code baked into container images
- **Configuration**: Uses base `docker-compose.yml` only

### Technology Stack

#### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- Gmail API for email processing
- Cheerio for HTML parsing
- Node-cron for scheduled tasks
- Follow-up date management and API endpoints

#### Frontend
- React with Material-UI (including Dialog components)
- React Router for navigation
- Context API for state management
- Custom hooks for data fetching and follow-up management
- Material-UI Dialog system for popups (rating, follow-up)

## Key Features

### 1. Email Processing
- Fetches emails from Gmail using OAuth2
- Extracts property information from email content
- Stores processed emails to avoid duplicates
- Runs automatically every 30 minutes

### 2. Property Management
- Full CRUD operations
- Status tracking: `active`, `pending`, `sold`, `archived`
- User interactions: like, love, rating (0-10)
- Follow-up system with date management
- Soft delete with archive/restore functionality

### 3. Follow-up System
- **Calendar Icons**: Material-UI IconButton on each property card
- **Dialog Interface**: Material-UI Dialog for setting follow-ups (30/60/90 days, 6mo/1yr, custom)
- **Date Management**: Backend tracks `followUpDate`, `followUpSet`, `lastFollowUpDate`
- **Navigation**: Dedicated follow-ups page with due/upcoming separation
- **Badge Counts**: Header navigation shows follow-up counts
- **Actions**: Mark as followed up, remove follow-up, update dates

### 4. Duplicate Detection System
- **Status Values**: Uses `'pending'` (not `'pending_review'`) for duplicates
- **Detection**: Case-insensitive location/address matching
- **Review Process**: Approve (merge) or Reject (archive)
- **UI Label**: Shows "Pending Review" for `status: 'pending'`

### 4. Search and Filter
- Full-text search across multiple fields
- Filter by status
- Context-based search state management

## Data Flow

1. **Email Processing**:
   ```
   Gmail API → Email Processor → Property Extraction → Duplicate Check → MongoDB
   ```

2. **Duplicate Detection**:
   ```
   New/Updated Property → Location Match → Mark as Pending → Review Queue
   ```

3. **User Interaction**:
   ```
   React UI → API Request → Express Router → MongoDB → Response → UI Update
   ```

## API Structure

### Base URL Pattern
All API endpoints follow the pattern:
```
http://localhost:3101/real-estate-email-system-backend/api/{endpoint}
```

### Key Endpoints
- `/properties` - Main property CRUD
- `/properties/pending-review/all` - Get pending duplicates
- `/properties/pending-review/:id/approve` - Approve duplicate
- `/properties/pending-review/:id/reject` - Reject duplicate
- `/process-emails` - Trigger email processing

## State Management

### Frontend State
- **SearchContext**: Global search/filter state
- **ToastContext**: Global notification system
- **Custom Hooks**: 
  - `useProperties` - Property list management
  - `usePendingReview` - Pending review management
  - `usePropertyInteractions` - Like/love/rating actions

### Backend State
- MongoDB for persistent storage
- No session management (stateless API)
- Email processing logs to prevent re-processing

## Deployment Modes

### Development Mode
- Hot reloading enabled
- Volume mounting for live updates
- Nodemon for backend auto-restart
- React development server

### Production Mode
- Optimized builds
- No volume mounting
- Health checks enabled
- Nginx serving static files

## Recent Fixes and Improvements

### Pending Review System Synchronization (Latest)
- Fixed status mismatch between frontend and backend
- Removed `'pending_review'` status, using only `'pending'`
- Updated UI components to display correct labels
- Ensured consistent status values across the application

### Key Learnings
1. Backend defines the source of truth for status values
2. Frontend labels can differ from actual status values
3. Always validate against backend schema
4. Clear browser cache after status-related changes

## Environment Configuration

### Critical Environment Variables
- `REACT_APP_API_URL`: Must use `http://localhost:3101` (not internal Docker hostname)
- `MONGODB_URI`: Connection string with authentication
- Gmail OAuth credentials for email processing

## Future Considerations

1. **Scalability**: Consider Redis for caching
2. **Search**: Implement Elasticsearch for better search
3. **Real-time**: Add WebSocket for live updates
4. **Testing**: Add comprehensive test suites
5. **CI/CD**: Implement automated deployment pipeline