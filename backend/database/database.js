const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'real_estate.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  db.serialize(() => {
    // Create properties table
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price TEXT,
        location TEXT,
        property_type TEXT,
        square_feet TEXT,
        bedrooms TEXT,
        bathrooms TEXT,
        images TEXT,
        property_url TEXT,
        email_source TEXT,
        email_subject TEXT,
        email_date TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create email_logs table to track processed emails
    db.run(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id TEXT UNIQUE,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'processed'
      )
    `);

    console.log('Database initialized successfully');
  });
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  query,
  run
}; 