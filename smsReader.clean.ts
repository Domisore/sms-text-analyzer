import { Platform, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

// Simple logger for this module
const logger = {
  info: (msg: string, data?: any) => console.log(`[TextileSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[TextileSMS] ERROR: ${msg}`, err || ''),
  sms: (msg: string, data?: any) => console.log(`[TextileSMS] SMS: ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[TextileSMS] WARN: ${msg}`, data || ''),
};

// Initialize database with error handling
let db: SQLite.SQLiteDatabase;
try {
  db = SQLite.openDatabaseSync('textile.db');
  // Ensure table exists
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
  logger.info('Database initialized for SMS reader');
} catch (error) {
  logger.error('Failed to initialize database for SMS reader', error);
}

export interface SMSMessage {
  id: string;
  body: string;
  sender: string;
  time: number;
  thread_id: string;
  category: string;
}

// Classification function
const classifyMessage = (body: string, time: number): string => {
  const messageAge = (Date.now() - time) / (1000 * 60); // minutes
  
  // Check for OTP patterns
  if (/\b\d{4,6}\b/.test(body) && messageAge > 5) {
    return 'expired';
  }
  
  // Check for bill/payment reminders
  if (/\b(due|bill|payment|invoice|reminder)\b/i.test(body)) {
    return 'upcoming';
  }
  
  // Check for spam patterns
  if (/\b(win|won|free|claim|congratulations|prize|lottery|click here|limited time)\b/i.test(body)) {
    return 'spam';
  }
  
  // Default to social
  return 'social';
};

// Instructions for creating SMS backup files
export const showBackupInstructions = () => {
  Alert.alert(
    '📋 How to Import Your SMS Messages',
    '🎯 RECOMMENDED METHOD: File Import\n\n1️⃣ Install "SMS Backup & Restore" from Play Store\n\n2️⃣ Open the app and tap "BACKUP"\n\n3️⃣ Choose "Local Backup" and save as XML\n\n4️⃣ Return to Textile and use "Import SMS" → "From Backup File"\n\n5️⃣ Select your backup XML file\n\n✅ This imports ALL your messages safely!',
    [
      { text: 'Got It!' },
      { 
        text: 'Try File Import', 
        onPress: () => {
          Alert.alert(
            'File Import Ready',
            'Go to the hamburger menu → Import SMS → From Backup File to import your SMS backup.',
            [{ text: 'OK' }]
          );
        }
      }
    ]
  );
};

// Simplified device SMS import - returns sample data for testing
export const importDeviceSMS = async (): Promise<number> => {
  try {
    logger.sms('Starting simplified device SMS import');
    
    // Check if database is available
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // Show info about file import being better
    Alert.alert(
      'Device Import Info',
      'Device SMS reading has Android restrictions.\n\n📁 For best results, use "From Backup File" instead.\n\nThis will import sample data for testing.',
      [
        { text: 'OK' },
        { text: 'Show Backup Guide', onPress: showBackupInstructions }
      ]
    );

    // Create sample messages for testing
    const sampleMessages: SMSMessage[] = [
      {
        id: '1',
        body: 'Your OTP is 123456. Valid for 5 minutes.',
        sender: '+1234567890',
        time: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        thread_id: '1',
        category: 'expired'
      },
      {
        id: '2', 
        body: 'Your electricity bill is due in 3 days. Amount: $45.50',
        sender: 'ELECTRIC',
        time: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        thread_id: '2',
        category: 'upcoming'
      },
      {
        id: '3',
        body: 'Congratulations! You have won $1000. Click here to claim your prize!',
        sender: '+9876543210',
        time: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        thread_id: '3',
        category: 'spam'
      },
      {
        id: '4',
        body: 'Hey! Are we still on for dinner tonight?',
        sender: 'John',
        time: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
        thread_id: '4',
        category: 'social'
      }
    ];

    logger.sms(`Importing ${sampleMessages.length} sample messages`);
    let importedCount = 0;
    let failedCount = 0;

    sampleMessages.forEach((msg) => {
      try {
        db.runSync(
          `INSERT OR REPLACE INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
          [msg.body, msg.sender, msg.time, msg.thread_id, msg.category]
        );
        importedCount++;
      } catch (dbError) {
        logger.error('Failed to insert message', dbError);
        failedCount++;
      }
    });

    if (failedCount > 0) {
      logger.warn(`Import completed with ${failedCount} failures`);
    }
    
    logger.sms(`Successfully imported ${importedCount} sample messages to database`);
    return importedCount;
  } catch (error) {
    logger.error('Device SMS import failed', error);
    throw error;
  }
};