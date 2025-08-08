const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./database/mongodb');
// const emailProcessor = require('./services/emailProcessor'); // TODO: Fix emailProcessor for MongoDB
const propertyRoutes = require('./routes/properties');
const authRoutes = require('./routes/auth');
const cron = require('node-cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3101;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
connectToDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Real Estate Email Processor is running' });
});

// Schedule email processing (every 30 minutes)
// TODO: Re-enable after fixing emailProcessor for MongoDB
// cron.schedule('*/30 * * * *', async () => {
//   console.log('Running scheduled email processing...');
//   try {
//     await emailProcessor.processEmails();
//   } catch (error) {
//     console.error('Error in scheduled email processing:', error);
//   }
// });

// Manual email processing endpoint
app.post('/api/process-emails', async (req, res) => {
  try {
    // TODO: Fix emailProcessor for MongoDB
    // const results = await emailProcessor.processEmails();
    res.json({ success: true, message: 'Email processing temporarily disabled during migration to MongoDB' });
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add sample data endpoint
app.post('/api/add-sample-data', async (req, res) => {
  try {
    // TODO: Update sampleData for MongoDB
    // const { populateSampleData } = require('./sampleData');
    // await populateSampleData();
    res.json({ success: true, message: 'Sample data temporarily disabled during migration to MongoDB' });
  } catch (error) {
    console.error('Error adding sample data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 