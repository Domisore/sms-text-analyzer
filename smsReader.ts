import { Platform, Alert, PermissionsAndroid } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';
import DirectSMSAccess, { DirectSMSMessage } from './directSMSReader';

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
  const messageAge = (Date.now() - time) / (1000 * 60);
  
  if (/\b\d{4,6}\b/.test(body) && messageAge > 5) {
    return 'expired';
  }
  
  if (/\b(due|bill|payment|invoice|reminder)\b/i.test(body)) {
    return 'upcoming';
  }
  
  if (/\b(win|won|free|claim|congratulations|prize|lottery|click here|limited time)\b/i.test(body)) {
    return 'spam';
  }
  
  return 'social';
};

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

// Ultimate SMS permission and access testing
export const testSMSPermissions = async () => {
  try {
    logger.info('=== ULTIMATE SMS ACCESS TEST ===');
    
    // Use the direct SMS access diagnostics
    await DirectSMSAccess.runDiagnostics();
    
  } catch (error) {
    logger.error('Ultimate SMS test failed', error);
    Alert.alert('Test Failed', `SMS test error: ${error.message}`);
  }
};

// Direct SMS permission request
export const requestSMSPermission = async (): Promise<boolean> => {
  try {
    logger.info('🔐 Starting direct SMS permission request');
    
    // Use the direct SMS access method
    return await DirectSMSAccess.requestPermission();
    
  } catch (error) {
    logger.error('Direct permission request failed', error);
    Alert.alert(
      'Permission Error',
      `Failed to request SMS permission: ${error.message}\n\nTry using file import instead.`,
      [
        { text: 'OK' },
        { text: 'File Import Guide', onPress: showBackupInstructions }
      ]
    );
    return false;
  }
};

export const importDeviceSMS = async (): Promise<number> => {
  try {
    logger.sms('Starting DIRECT device SMS import');
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // Try direct SMS access first
    if (DirectSMSAccess.isAvailable()) {
      try {
        logger.info('Using direct SMS access');
        
        // Check/request permission
        const hasPermission = await DirectSMSAccess.requestPermission();
        
        if (hasPermission) {
          // Read real SMS messages
          const directMessages = await DirectSMSAccess.readAllMessages();
          logger.info(`Got ${directMessages.length} real SMS messages`);
          
          if (directMessages.length > 0) {
            let importedCount = 0;
            
            directMessages.forEach((msg: DirectSMSMessage) => {
              try {
                const time = parseInt(msg.date);
                const category = classifyMessage(msg.body, time);
                
                db.runSync(
                  `INSERT OR REPLACE INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
                  [msg.body, msg.address, time, msg.thread_id, category]
                );
                importedCount++;
              } catch (dbError) {
                logger.error('Failed to insert real message', dbError);
              }
            });
            
            logger.sms(`Successfully imported ${importedCount} REAL SMS messages`);
            return importedCount;
          }
        }
      } catch (directError) {
        logger.error('Direct SMS access failed', directError);
      }
    }
    
    // Fallback to sample data
    logger.info('Using sample data fallback');
    Alert.alert(
      'Using Sample Data',
      'Real SMS access not available. Importing sample data for testing.\n\nFor real SMS data, use file import or check permissions.',
      [
        { text: 'OK' },
        { text: 'Test SMS Access', onPress: testSMSPermissions }
      ]
    );

    const sampleMessages: SMSMessage[] = [
      {
        id: '1',
        body: 'Your OTP is 123456. Valid for 5 minutes.',
        sender: '+1234567890',
        time: Date.now() - 10 * 60 * 1000,
        thread_id: '1',
        category: 'expired'
      },
      {
        id: '2', 
        body: 'Your electricity bill is due in 3 days. Amount: $45.50',
        sender: 'ELECTRIC',
        time: Date.now() - 2 * 60 * 60 * 1000,
        thread_id: '2',
        category: 'upcoming'
      },
      {
        id: '3',
        body: 'Congratulations! You have won $1000. Click here to claim your prize!',
        sender: '+9876543210',
        time: Date.now() - 30 * 60 * 1000,
        thread_id: '3',
        category: 'spam'
      },
      {
        id: '4',
        body: 'Hey! Are we still on for dinner tonight?',
        sender: 'John',
        time: Date.now() - 1 * 60 * 60 * 1000,
        thread_id: '4',
        category: 'social'
      }
    ];

    let importedCount = 0;
    sampleMessages.forEach((msg) => {
      try {
        db.runSync(
          `INSERT OR REPLACE INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
          [msg.body, msg.sender, msg.time, msg.thread_id, msg.category]
        );
        importedCount++;
      } catch (dbError) {
        logger.error('Failed to insert sample message', dbError);
      }
    });
    
    logger.sms(`Imported ${importedCount} sample messages to database`);
    return importedCount;
  } catch (error) {
    logger.error('Device SMS import failed', error);
    throw error;
  }
};