import { PermissionsAndroid, Platform, Alert } from 'react-native';
import SmsAndroid from 'react-native-sms-android';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('textile.db');

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

// Request SMS permissions
export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    Alert.alert('Not Supported', 'SMS reading is only supported on Android devices.');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'Textile SMS needs access to read your messages for categorization and cleanup.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
};

// Read all SMS messages from device
export const readDeviceSMS = async (): Promise<SMSMessage[]> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'android') {
      reject(new Error('SMS reading is only supported on Android'));
      return;
    }

    const filter = {
      box: 'inbox', // 'inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'
      maxCount: 1000, // Limit to prevent performance issues
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: any) => {
        console.error('Failed to read SMS:', fail);
        reject(new Error('Failed to read SMS messages'));
      },
      (count: number, smsList: string) => {
        try {
          const messages: any[] = JSON.parse(smsList);
          const processedMessages: SMSMessage[] = messages.map((msg) => ({
            id: msg._id,
            body: msg.body || '',
            sender: msg.address || 'Unknown',
            time: parseInt(msg.date) || Date.now(),
            thread_id: msg.thread_id || '',
            category: classifyMessage(msg.body || '', parseInt(msg.date) || Date.now()),
          }));
          
          resolve(processedMessages);
        } catch (parseError) {
          console.error('Failed to parse SMS data:', parseError);
          reject(new Error('Failed to parse SMS data'));
        }
      }
    );
  });
};

// Import SMS messages to database
export const importDeviceSMS = async (): Promise<number> => {
  try {
    const hasPermission = await requestSMSPermission();
    if (!hasPermission) {
      throw new Error('SMS permission denied');
    }

    const messages = await readDeviceSMS();
    let importedCount = 0;

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
        console.error('Failed to insert message:', dbError);
      }
    });

    return importedCount;
  } catch (error) {
    console.error('Import failed:', error);
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