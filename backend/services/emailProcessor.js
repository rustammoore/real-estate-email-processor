const { google } = require('googleapis');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const Property = require('../models/Property');
const EmailLog = require('../models/EmailLog');

class EmailProcessor {
  constructor() {
    this.gmail = google.gmail({ version: 'v1' });
    this.auth = null;
  }

  async authenticate() {
    // You'll need to set up Gmail API credentials
    // For now, this is a placeholder
    const credentials = {
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    };

    this.auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret
    );
    this.auth.setCredentials({
      refresh_token: credentials.refresh_token
    });
  }

  async processEmails() {
    try {
      await this.authenticate();
      
      // Get recent emails
      const response = await this.gmail.users.messages.list({
        auth: this.auth,
        userId: 'me',
        q: 'is:unread', // Process unread emails
        maxResults: 10
      });

      const messages = response.data.messages || [];
      const results = [];

      for (const message of messages) {
        try {
          const emailData = await this.getEmailData(message.id);
          const properties = await this.extractProperties(emailData);
          
          for (const property of properties) {
            await this.saveProperty(property, emailData);
            results.push(property);
          }

          // Mark email as processed
          await run(
            'INSERT OR IGNORE INTO email_logs (email_id) VALUES (?)',
            [message.id]
          );

        } catch (error) {
          console.error(`Error processing email ${message.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in processEmails:', error);
      throw error;
    }
  }

  async getEmailData(messageId) {
    const response = await this.gmail.users.messages.get({
      auth: this.auth,
      userId: 'me',
      id: messageId
    });

    const message = response.data;
    const headers = message.payload.headers;
    
    return {
      id: messageId,
      subject: headers.find(h => h.name === 'Subject')?.value || '',
      from: headers.find(h => h.name === 'From')?.value || '',
      date: headers.find(h => h.name === 'Date')?.value || '',
      body: this.getEmailBody(message.payload)
    };
  }

  getEmailBody(payload) {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html') {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }
    
    return '';
  }

  async extractProperties(emailData) {
    const $ = cheerio.load(emailData.body);
    const properties = [];

    // Look for common real estate listing patterns
    // This is a basic implementation - you'll want to customize based on your email format
    
    // Extract images
    const images = [];
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) images.push(src);
    });

    // Extract links (potential property URLs)
    const links = [];
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('mailto:')) {
        links.push(href);
      }
    });

    // Extract text content
    const textContent = $.text();

    // Create a property object
    const property = {
      id: uuidv4(),
      title: emailData.subject,
      description: textContent.substring(0, 500), // First 500 chars
      images: JSON.stringify(images),
      property_url: links.length > 0 ? links[0] : '',
      email_source: emailData.from,
      email_subject: emailData.subject,
      email_date: emailData.date,
      status: 'active'
    };

    properties.push(property);
    return properties;
  }

  async saveProperty(property, emailData) {
    const sql = `
      INSERT INTO properties (
        id, title, description, images, property_url, 
        email_source, email_subject, email_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await run(sql, [
      property.id,
      property.title,
      property.description,
      property.images,
      property.property_url,
      property.email_source,
      property.email_subject,
      property.email_date,
      property.status
    ]);
  }
}

module.exports = new EmailProcessor(); 