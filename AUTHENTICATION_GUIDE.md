# Authentication System Guide

## Overview

The Real Estate Email Processor now includes a comprehensive multi-user authentication system that allows different users to:
- Register and login with secure credentials
- Manage their own property listings separately
- Configure their own Gmail API settings for email processing
- Access only their own data (complete data isolation)

## Features

### Backend Features
- **JWT-based Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with salt rounds
- **User Management**: Registration, login, profile updates, password changes
- **Data Isolation**: All properties and emails are user-specific
- **Role-based Access**: Support for user and admin roles
- **Email Configuration**: Per-user Gmail API settings
- **Middleware Protection**: All property routes are protected

### Frontend Features
- **Authentication Context**: Centralized state management
- **Login/Register Forms**: Beautiful, responsive authentication forms
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Profile Management**: Update profile, change password, configure email
- **Token Management**: Automatic token handling and refresh
- **User Menu**: Profile access and logout from header

## Getting Started

### 1. Environment Setup

#### Backend Environment Variables
Copy `backend/env.example` to `backend/.env` and add:

```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@localhost:3102/real-estate-email-processor?authSource=admin

# Gmail API Configuration (Optional - for global fallback)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
```

#### Frontend Environment Variables
Copy `frontend/env.example` to `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3101/real-estate-email-system-backend/api
```

### 2. Install Dependencies

```bash
# Backend dependencies (already installed)
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Start the Application

```bash
# Start backend (port 3101)
cd backend
npm run dev

# Start frontend (port 3100) in another terminal
cd frontend
npm start
```

## User Registration and Login

### First Time Setup
1. Navigate to `http://localhost:3100`
2. You'll see the login/register screen
3. Click "Don't have an account? Sign up"
4. Fill in your details:
   - **Name**: Your full name
   - **Email**: Your email address (must be unique)
   - **Password**: At least 6 characters with uppercase, lowercase, and number
   - **Confirm Password**: Must match your password

### Login Process
1. Enter your email and password
2. Click "Sign in"
3. You'll be redirected to the dashboard

## User Profile Management

Access your profile by clicking your name in the header → "Profile"

### Profile Tab
- Update your name and real estate agent information
- Add license, company, phone, and bio

### Password Tab
- Change your password securely
- Requires current password verification

### Email Configuration Tab
- Configure your personal Gmail API settings
- Required for email processing functionality
- Instructions provided for obtaining Gmail API credentials

## Multi-User Data Isolation

### How It Works
- Each user has their own isolated data
- Properties are automatically associated with the logged-in user
- Email processing creates properties only for the authenticated user
- No user can see another user's data

### Property Management
- All existing property features work the same way
- Properties are filtered by user automatically
- Follow-ups, ratings, likes are user-specific

### Email Processing
- Configure your Gmail API credentials in your profile
- Email processing will use your personal Gmail account
- Processed properties are associated only with your account

## API Endpoints

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password
- `PUT /auth/email-config` - Update email configuration
- `POST /auth/logout` - Logout user

### Protected Property Endpoints
All property endpoints now require authentication:
- `GET /properties` - Get user's properties
- `POST /properties` - Create property (auto-assigned to user)
- `GET /properties/:id` - Get user's property by ID
- `PUT /properties/:id` - Update user's property
- `DELETE /properties/:id` - Delete user's property
- All other property endpoints are similarly protected

## Security Features

### Password Security
- Minimum 6 characters
- Must contain uppercase, lowercase, and number
- Bcrypt hashing with 12 salt rounds
- Passwords never returned in API responses

### JWT Token Security
- 30-day expiration (configurable)
- Stored securely in localStorage
- Automatic token validation
- Invalid tokens cleared automatically

### API Security
- All property routes protected with JWT middleware
- User isolation enforced at database level
- Error handling for authentication failures
- Automatic logout on token expiration

## Development Notes

### Database Changes
- **User Model**: New collection for user management
- **Property Model**: Added `user` field (required)
- **EmailLog Model**: Added `user` field for email tracking

### Code Structure
```
backend/
├── middleware/auth.js      # JWT authentication middleware
├── models/User.js          # User data model
├── routes/auth.js          # Authentication routes
├── utils/generateToken.js  # JWT token generation
└── services/emailProcessor.js # Updated for multi-user

frontend/src/
├── contexts/AuthContext.js     # Authentication state management
├── components/auth/            # Authentication components
│   ├── Login.js
│   ├── Register.js
│   ├── AuthWrapper.js
│   └── ProtectedRoute.js
├── components/UserProfile.js   # User profile management
└── services/api.js            # Updated API with auth headers
```

### Migration Considerations
- Existing properties without user association will need manual assignment
- Create a migration script if you have existing data
- Consider creating an admin user for existing properties

## Troubleshooting

### Common Issues

1. **"Invalid token" errors**
   - Clear localStorage: `localStorage.clear()`
   - Check JWT_SECRET is set in backend .env

2. **Properties not showing**
   - Ensure you're logged in
   - Check that properties have `user` field in database

3. **Email processing not working**
   - Configure Gmail API credentials in your profile
   - Check that email configuration is marked as "configured"

4. **Login redirect issues**
   - Clear browser cache and localStorage
   - Check frontend API URL in .env

### Database Reset
If you need to start fresh:

```bash
# Connect to MongoDB and drop collections
use real-estate-email-processor
db.users.drop()
db.properties.drop()
db.emaillogs.drop()
```

## Next Steps

1. **Create your first user account**
2. **Configure your Gmail API settings** (if you want email processing)
3. **Start adding properties** - they'll be automatically associated with your account
4. **Invite other users** to create their own accounts

The system is now fully functional with complete multi-user support and data isolation!