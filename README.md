# Real Estate Email Processor

A comprehensive application that processes real estate listing emails from Gmail, extracts property information, and provides a web interface for viewing and managing the listings.

## Features

- **Email Processing**: Automatically fetches and processes real estate emails from Gmail
- **Data Extraction**: Extracts property details, images, and links from email content
- **Web Portal**: Modern React interface for viewing and editing property listings
- **Property Management**: Full CRUD operations for property listings
- **Search & Filter**: Search properties and filter by status
- **Dashboard**: Overview of all properties with statistics

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite** database (can be upgraded to PostgreSQL)
- **Gmail API** for email processing
- **Cheerio** for HTML parsing
- **Node-cron** for scheduled email processing

### Frontend
- **React** with Material-UI
- **React Router** for navigation
- **Axios** for API communication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Gmail account with API access

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-email-processor
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp env.example .env
   ```

4. **Gmail API Setup**
   
   You'll need to set up Gmail API credentials:
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select existing one
   c. Enable Gmail API
   d. Create OAuth 2.0 credentials
   e. Download the credentials and update your `.env` file

5. **Environment Variables**
   
   Update `backend/.env`:
   ```
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
   PORT=5000
   ```

## Running the Application

### Development Mode

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Mode

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

## Usage

### Email Processing

1. **Automatic Processing**: The app automatically processes emails every 30 minutes
2. **Manual Processing**: Use the "Process Emails" button on the dashboard
3. **Email Requirements**: Emails should contain property information and images

### Property Management

1. **View Properties**: Navigate to the Properties page to see all listings
2. **Edit Properties**: Click on any property to view details and edit information
3. **Search & Filter**: Use the search bar and status filter to find specific properties
4. **Delete Properties**: Remove properties that are no longer relevant

### Dashboard

- View total property count
- See active properties
- Access recent properties
- Manually trigger email processing

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get single property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Email Processing
- `POST /api/process-emails` - Manually process emails
- `GET /api/health` - Health check

## Database Schema

### Properties Table
- `id` - Unique identifier
- `title` - Property title
- `description` - Property description
- `price` - Property price
- `location` - Property location
- `property_type` - Type of property
- `square_feet` - Square footage
// Fields renamed: use `CustomFieldOne` and `CustomFieldTwo` instead of `bedrooms` and `bathrooms`.
- `images` - JSON array of image URLs
- `property_url` - Original listing URL
- `email_source` - Email sender
- `email_subject` - Email subject
- `email_date` - Email date
- `status` - Property status (active, sold, pending)
- `created_at` - Record creation date
- `updated_at` - Record update date

### Email Logs Table
- `id` - Unique identifier
- `email_id` - Gmail message ID
- `processed_at` - Processing timestamp
- `status` - Processing status

## Customization

### Email Processing Rules
You can customize the email processing logic in `backend/services/emailProcessor.js`:

1. **Email Filters**: Modify the Gmail query to target specific emails
2. **Data Extraction**: Update the `extractProperties` method to parse your email format
3. **Property Mapping**: Adjust how email data maps to property fields

### UI Customization
The frontend uses Material-UI components and can be customized:

1. **Theme**: Modify the theme in `frontend/src/App.js`
2. **Components**: Update component styles and layouts
3. **Fields**: Add or remove property fields as needed

## Troubleshooting

### Common Issues

1. **Gmail API Errors**
   - Ensure your credentials are correct
   - Check that Gmail API is enabled
   - Verify OAuth 2.0 setup

2. **Database Errors**
   - Check file permissions for SQLite database
   - Ensure database directory exists

3. **Frontend Connection Issues**
   - Verify backend is running on port 5000
   - Check CORS settings
   - Ensure proxy configuration is correct

### Logs
- Backend logs are displayed in the console
- Check browser console for frontend errors
- Database errors are logged to console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation 