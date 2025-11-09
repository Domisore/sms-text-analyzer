import { PermissionsAndroid, Platform, Alert, Linking, NativeModules } from 'react-native';
// import SmsAndroid from 'react-native-get-sms-android';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

// Simple logger for this module
const logger = {
  info: (msg: string, data?: any) => console.log(`[TextileSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[TextileSMS] ERROR: ${msg}`, err || ''),
  sms: (msg: string, data?: any) => console.log(`[TextileSMS] SMS: ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[TextileSMS] WARN: ${msg}`, data || ''),
};

// Simple manual instructions for enabling SMS permission
const showManualInstructions = () => {
  Alert.alert(
    'Enable SMS Permission Manually',
    '📱 Follow these steps:\n\n1️⃣ Open your device SETTINGS\n2️⃣ Tap APPS (or App Manager)\n3️⃣ Find and tap "Textile"\n4️⃣ Tap PERMISSIONS\n5️⃣ Enable SMS permission\n6️⃣ Return to this app\n\n✅ Then try "From Device" import again!',
    [
      { text: 'Got It!' },
      { 
        text: 'Test After Enabling', 
        onPress: async () => {
          // Test if permission is now granted
          const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
          if (hasPermission) {
            Alert.alert('Success!', 'SMS permission is now enabled! You can use "From Device" import.');
          } else {
            Alert.alert('Not Yet', 'SMS permission is still disabled. Please follow the steps above.');
          }
        }
      }
    ]
  );
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

// Request SMS permissions - simplified version
export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    logger.warn('SMS reading attempted on non-Android platform');
    Alert.alert('Not Supported', 'SMS reading is only supported on Android devices.');
    return false;
  }

  try {
    logger.info('Starting SMS permission request process');
    
    // First check if permission is already granted
    const currentPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    logger.info(`Current SMS permission status: ${currentPermission}`);
    
    if (currentPermission) {
      logger.info('SMS permission already granted');
      Alert.alert('Permission Status', 'SMS permission is already granted!');
      return true;
    }

    // Request permission directly
    logger.info('Requesting SMS permission from user');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Access Required',
        message: 'Textile needs SMS access to read and categorize your messages. This helps identify expired OTPs, spam, and important messages.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );

    logger.info(`Permission request result: ${granted}`);
    
    // Handle the result
    switch (granted) {
      case PermissionsAndroid.RESULTS.GRANTED:
        logger.info('SMS permission granted successfully');
        Alert.alert('Success!', 'SMS permission granted. You can now import messages from your device.');
        return true;
        
      case PermissionsAndroid.RESULTS.DENIED:
        logger.warn('SMS permission denied by user');
        Alert.alert('Permission Denied', 'SMS access was denied. You can still import messages from backup files.');
        return false;
        
      case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        logger.warn('SMS permission permanently denied');
        Alert.alert(
          'Permission Blocked', 
          'SMS permission was permanently denied. You need to enable it manually in device settings.',
          [
            { text: 'OK' },
            { text: 'Show Instructions', onPress: showManualInstructions }
          ]
        );
        return false;
        
      default:
        logger.error(`Unexpected permission result: ${granted}`);
        Alert.alert('Error', 'Unexpected permission result. Please try again.');
        return false;
    }
    
  } catch (err) {
    logger.error('Permission request failed with error', err);
    Alert.alert(
      'Permission Error',
      `Failed to request SMS permission. Error: ${err.message || 'Unknown error'}. Please try granting permission manually in device settings.`
    );
    return false;
  }
};

// Read all SMS messages from device using native Android content provider
export const readDeviceSMS = async (): Promise<SMSMessage[]> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'android') {
      reject(new Error('SMS reading is only supported on Android'));
      return;
    }

    try {
      // For now, we'll create some sample data to test the permission flow
      // In a real implementation, this would use native Android SMS content provider
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
        }
      ];

      logger.sms(`Simulated reading ${sampleMessages.length} messages from device`);
      resolve(sampleMessages);
    } catch (error) {
      logger.error('Failed to read device SMS', error);
      reject(new Error('Failed to read SMS messages from device'));
    }
  });
};

// Import SMS messages to database
export const importDeviceSMS = async (): Promise<number> => {
  try {
    logger.sms('Starting device SMS import process');
    
    // Running in standalone APK - SMS permissions should work
    logger.info(`App ownership: ${Constants.appOwnership || 'standalone'}`);
    logger.info('Proceeding with SMS permission request in standalone APK');
    
    // Check if database is available
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const hasPermission = await requestSMSPermission();
    if (!hasPermission) {
      throw new Error('SMS permission denied');
    }

    const messages = await readDeviceSMS();
    logger.sms(`Retrieved ${messages.length} messages from device`);
    let importedCount = 0;
    let failedCount = 0;

    // Clear existing data first (optional)
    // db.runSync('DELETE FROM sms;');

    messages.forEach((msg) => {
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
    
    logger.sms(`Successfully imported ${importedCount} messages to database`);
    return importedCount;
  } catch (error) {
    logger.error('Device SMS import failed', error);
    throw error;
  }
};

// Set up real-time SMS monitoring (requires additional setup)
export const startSMSMonitoring = () => {
  if (Platform.OS !== 'android') {
    console.warn('SMS monitoring is only supported on Android');
    return;
  }

  // This would require additional native module setup for real-time monitoring
  console.log('SMS monitoring would be implemented here');
};

// Test function to trigger permission request
export const testSMSPermission = async () => {
  try {
    logger.info('=== Starting SMS Permission Test ===');
    
    // Check platform first
    if (Platform.OS !== 'android') {
      Alert.alert('Platform Error', 'SMS permissions are only available on Android devices.');
      return;
    }
    
    // Check if PermissionsAndroid is available
    if (!PermissionsAndroid) {
      Alert.alert('API Error', 'PermissionsAndroid API is not available.');
      return;
    }
    
    // Check if READ_SMS permission constant exists
    if (!PermissionsAndroid.PERMISSIONS.READ_SMS) {
      Alert.alert('Permission Error', 'READ_SMS permission constant is not available.');
      return;
    }
    
    logger.info('Platform and API checks passed');
    logger.info(`READ_SMS constant: ${PermissionsAndroid.PERMISSIONS.READ_SMS}`);
    
    // Now try the permission request
    const hasPermission = await requestSMSPermission();
    logger.info(`=== Permission Test Result: ${hasPermission} ===`);
    
  } catch (error) {
    logger.error('Permission test failed with error', error);
    Alert.alert(
      'Test Failed', 
      `Permission test failed: ${error.message || 'Unknown error'}`
    );
  }
};

// Check current permission status and guide user
const checkPermissionStatus = async () => {
  try {
    const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceiveSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    
    if (hasReadSMS) {
      Alert.alert(
        '✅ Permission Enabled!',
        'SMS permission is already enabled! You can now use "From Device" import to read your messages.',
        [
          { text: 'Great!' },
          { text: 'Test Import', onPress: () => {
            // This will trigger the import with sample data
            Alert.alert('Test Import', 'Go to the hamburger menu and tap "Import" → "From Device" to test!');
          }}
        ]
      );
    } else {
      Alert.alert(
        '❌ Permission Disabled',
        `SMS permission status:\n• Read SMS: ${hasReadSMS ? '✅' : '❌'}\n• Receive SMS: ${hasReceiveSMS ? '✅' : '❌'}\n\nYou need to enable SMS permission manually in device settings.`,
        [
          { text: 'OK' },
          { text: 'Show Instructions', onPress: showManualInstructions }
        ]
      );
    }
  } catch (error) {
    logger.error('Permission status check failed', error);
    Alert.alert('Error', 'Could not check permission status.');
  }
};

// Function to help user with SMS permission
export const resetAndRequestPermission = async () => {
  try {
    logger.info('Helping user with SMS permission');
    
    Alert.alert(
      'SMS Permission Help',
      'Choose what you want to do:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Current Status', onPress: checkPermissionStatus },
        { text: 'Show Instructions', onPress: showManualInstructions },
        { 
          text: 'Try Request Again', 
          onPress: async () => {
            const result = await requestSMSPermission();
            if (!result) {
              showManualInstructions();
            }
          }
        }
      ]
    );
  } catch (error) {
    logger.error('Permission help failed', error);
  }
};

// Debug function to check permission status
export const debugPermissions = async () => {
  if (Platform.OS !== 'android') {
    logger.info('Not on Android platform');
    return;
  }

  try {
    const isExpoGo = Constants.appOwnership === 'expo';
    logger.info(`Running in Expo Go: ${isExpoGo}`);
    
    const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceiveSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    
    logger.info(`READ_SMS permission: ${hasReadSMS}`);
    logger.info(`RECEIVE_SMS permission: ${hasReceiveSMS}`);
    
    const canRequestRead = await PermissionsAndroid.shouldShowRequestPermissionRationale(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    
    logger.info(`Can request READ_SMS: ${canRequestRead}`);
    
    Alert.alert(
      'Permission Debug Info',
      `App Type: ${Constants.appOwnership || 'standalone'}\nREAD_SMS: ${hasReadSMS ? '✅ Enabled' : '❌ Disabled'}\nRECEIVE_SMS: ${hasReceiveSMS ? '✅ Enabled' : '❌ Disabled'}\nCan Request: ${canRequestRead}`,
      [
        { text: 'OK' },
        { text: 'Check Status', onPress: checkPermissionStatus },
        { text: 'Show Instructions', onPress: showManualInstructions },
        { text: 'Test Permission', onPress: testSMSPermission }
      ]
    );
    
  } catch (error) {
    logger.error('Permission debug failed', error);
  }
};