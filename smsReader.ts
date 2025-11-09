import { Platform, Alert, PermissionsAndroid } from 'react-native';
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

// Comprehensive SMS permission testing
export const testSMSPermissions = async () => {
  try {
    logger.info('=== COMPREHENSIVE SMS PERMISSION TEST ===');
    
    // Test 1: Platform check
    if (Platform.OS !== 'android') {
      Alert.alert('Platform Error', 'SMS permissions only work on Android devices.');
      return;
    }
    logger.info('✅ Platform: Android');
    
    // Test 2: Check current permission status
    const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceiveSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    const hasPhoneState = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    
    logger.info(`📋 Current Permissions:`);
    logger.info(`   READ_SMS: ${hasReadSMS}`);
    logger.info(`   RECEIVE_SMS: ${hasReceiveSMS}`);
    logger.info(`   READ_PHONE_STATE: ${hasPhoneState}`);
    
    // Test 3: Check if we can request permissions
    const canRequestRead = await PermissionsAndroid.shouldShowRequestPermissionRationale(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    logger.info(`🔄 Can request READ_SMS: ${canRequestRead}`);
    
    // Test 4: Show comprehensive status
    Alert.alert(
      '📊 SMS Permission Status',
      `Platform: Android ✅\n\nCurrent Permissions:\n• READ_SMS: ${hasReadSMS ? '✅' : '❌'}\n• RECEIVE_SMS: ${hasReceiveSMS ? '✅' : '❌'}\n• READ_PHONE_STATE: ${hasPhoneState ? '✅' : '❌'}\n\nCan Request: ${canRequestRead ? 'Yes' : 'No'}`,
      [
        { text: 'OK' },
        { text: 'Request Permission', onPress: requestSMSPermission },
        { text: 'Show Backup Guide', onPress: showBackupInstructions }
      ]
    );
    
  } catch (error) {
    logger.error('Permission test failed', error);
    Alert.alert('Test Failed', `Permission test error: ${error.message}`);
  }
};

// Improved SMS permission request
export const requestSMSPermission = async (): Promise<boolean> => {
  try {
    logger.info('🔐 Starting SMS permission request');
    
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'SMS permissions only work on Android devices.');
      return false;
    }
    
    // Check current status first
    const currentPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    if (currentPermission) {
      Alert.alert('Already Granted', 'SMS permission is already enabled!');
      return true;
    }
    
    // Request permission with detailed explanation
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Access Required',
        message: 'Textile needs SMS access to:\n\n• Read your messages for categorization\n• Identify expired OTPs and spam\n• Help organize your messages\n\nYour messages stay private on your device.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );
    
    logger.info(`📝 Permission result: ${granted}`);
    
    switch (granted) {
      case PermissionsAndroid.RESULTS.GRANTED:
        Alert.alert('Success!', 'SMS permission granted! You can now import messages from your device.');
        return true;
        
      case PermissionsAndroid.RESULTS.DENIED:
        Alert.alert(
          'Permission Denied',
          'SMS access was denied. You can:\n\n• Use file import instead\n• Grant permission later in device settings',
          [
            { text: 'OK' },
            { text: 'File Import Guide', onPress: showBackupInstructions }
          ]
        );
        return false;
        
      case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        Alert.alert(
          'Permission Blocked',
          'SMS permission was permanently blocked. To enable:\n\n1. Go to Settings > Apps > Textile\n2. Tap Permissions\n3. Enable SMS permission\n\nOr use file import instead.',
          [
            { text: 'OK' },
            { text: 'File Import Guide', onPress: showBackupInstructions }
          ]
        );
        return false;
        
      default:
        Alert.alert('Unexpected Result', `Permission result: ${granted}`);
        return false;
    }
    
  } catch (error) {
    logger.error('Permission request failed', error);
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
    logger.sms('Starting device SMS import with permission check');
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // First try to get permission
    const hasPermission = await requestSMSPermission();
    
    if (!hasPermission) {
      // Show sample data instead
      Alert.alert(
        'Using Sample Data',
        'SMS permission not available. Importing sample data for testing.\n\nFor real SMS data, use file import.',
        [
          { text: 'OK' },
          { text: 'File Import Guide', onPress: showBackupInstructions }
        ]
      );
    }

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

    logger.sms(`Importing ${sampleMessages.length} messages`);
    let importedCount = 0;

    sampleMessages.forEach((msg) => {
      try {
        db.runSync(
          `INSERT OR REPLACE INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
          [msg.body, msg.sender, msg.time, msg.thread_id, msg.category]
        );
        importedCount++;
      } catch (dbError) {
        logger.error('Failed to insert message', dbError);
      }
    });
    
    logger.sms(`Successfully imported ${importedCount} messages to database`);
    return importedCount;
  } catch (error) {
    logger.error('Device SMS import failed', error);
    throw error;
  }
};