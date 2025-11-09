import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

const logger = {
  info: (msg: string, data?: any) => console.log(`[TextileSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[TextileSMS] ERROR: ${msg}`, err || ''),
  sms: (msg: string, data?: any) => console.log(`[TextileSMS] SMS: ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[TextileSMS] WARN: ${msg}`, data || ''),
};

const showManualInstructions = () => {
  Alert.alert(
    'Enable SMS Permission Manually',
    '📱 Follow these steps:\n\n1️⃣ Open your device SETTINGS\n2️⃣ Tap APPS (or App Manager)\n3️⃣ Find and tap "Textile"\n4️⃣ Tap PERMISSIONS\n5️⃣ Enable SMS permission\n6️⃣ Return to this app\n\n✅ Then try "From Device" import again!',
    [
      { text: 'Got It!' },
    ]
  );
};

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

const classifyMessage = (body: string, time: number): string => {
  const messageAge = (Date.now() - time) / (1000 * 60); // minutes
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

export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    logger.warn('SMS reading attempted on non-Android platform');
    return false;
  }
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);

    if (granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED) {
      logger.info('SMS permissions granted');
      return true;
    } else {
      logger.warn('SMS permissions denied');
      showManualInstructions();
      return false;
    }
  } catch (err) {
    logger.error('Permission request failed with error', err);
    return false;
  }
};

export const readDeviceSMS = async (): Promise<SMSMessage[]> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'android') {
      reject(new Error('SMS reading is only supported on Android'));
      return;
    }
    const filter = {
      box: 'inbox',
      maxCount: 10000,
    };
    try {
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          logger.error('Failed to list SMS', fail);
          reject(new Error('Failed to read SMS messages from device.'));
        },
        (count: number, smsList: string) => {
          logger.info(`Found ${count} messages`);
          const messages = JSON.parse(smsList);
          const formattedMessages: SMSMessage[] = messages.map((message: any) => ({
            id: message._id,
            body: message.body,
            sender: message.address,
            time: message.date,
            thread_id: message.thread_id,
            category: classifyMessage(message.body, message.date),
          }));
          resolve(formattedMessages);
        }
      );
    } catch (err) {
      logger.error('Error listing SMS', err);
      reject(err);
    }
  });
};

export const importDeviceSMS = async (): Promise<number> => {
  try {
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
    messages.forEach((msg) => {
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