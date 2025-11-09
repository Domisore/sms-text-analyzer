import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('textile.db');

// Initialize all tables
export const initializeDatabase = () => {
  // Main SMS table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      body TEXT,
      sender TEXT,
      time INTEGER,
      thread_id TEXT,
      category TEXT
    );
  `);

  // Bill tracking table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sms_id INTEGER,
      sender TEXT,
      amount REAL,
      due_date INTEGER,
      bill_type TEXT,
      status TEXT DEFAULT 'unpaid',
      paid_date INTEGER,
      notes TEXT,
      FOREIGN KEY (sms_id) REFERENCES sms(id)
    );
  `);

  // Quick actions history
  db.execSync(`
    CREATE TABLE IF NOT EXISTS action_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT,
      items_affected INTEGER,
      timestamp INTEGER,
      details TEXT
    );
  `);

  // User preferences
  db.execSync(`
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
};

// Initialize on import
initializeDatabase();
