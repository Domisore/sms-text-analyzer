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
      category TEXT,
      notified INTEGER DEFAULT 0,
      UNIQUE(sender, body, time)
    );
  `);
  
  // Add notified column to existing tables (migration)
  try {
    db.execSync(`ALTER TABLE sms ADD COLUMN notified INTEGER DEFAULT 0;`);
  } catch (e) {
    // Column already exists, ignore error
  }

  // Migration: Add unique constraint to prevent duplicates
  // Check if the constraint already exists by trying to get table info
  try {
    const tableInfo = db.getAllSync(`PRAGMA table_info(sms);`) as any[];
    const hasUniqueConstraint = db.getAllSync(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='sms';`
    ) as any[];
    
    const tableSql = hasUniqueConstraint[0]?.sql || '';
    
    // If the table doesn't have UNIQUE constraint, recreate it
    if (!tableSql.includes('UNIQUE')) {
      console.log('[TextileSMS] Migrating database to add unique constraint...');
      
      // Create new table with unique constraint
      db.execSync(`
        CREATE TABLE IF NOT EXISTS sms_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          body TEXT,
          sender TEXT,
          time INTEGER,
          thread_id TEXT,
          category TEXT,
          notified INTEGER DEFAULT 0,
          UNIQUE(sender, body, time)
        );
      `);
      
      // Copy data, removing duplicates
      db.execSync(`
        INSERT OR IGNORE INTO sms_new (id, body, sender, time, thread_id, category, notified)
        SELECT id, body, sender, time, thread_id, category, notified FROM sms;
      `);
      
      // Drop old table and rename new one
      db.execSync(`DROP TABLE sms;`);
      db.execSync(`ALTER TABLE sms_new RENAME TO sms;`);
      
      console.log('[TextileSMS] Database migration complete - duplicates removed');
    }
  } catch (e) {
    // Migration already done or error occurred, continue
    console.log('[TextileSMS] Unique constraint migration skipped or already applied');
  }

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
