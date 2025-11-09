import { NativeModules, PermissionsAndroid, Platform, Alert } from 'react-native';

const { DirectSMSReader } = NativeModules;

export interface DirectSMSMessage {
  id: string;
  address: string;
  body: string;
  date: string;
  type: string;
  thread_id: string;
}

// Logger for direct SMS operations
const logger = {
  info: (msg: string, data?: any) => console.log(`[DirectSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[DirectSMS] ERROR: ${err}`, err || ''),
  warn: (msg: string, data?: any) => console.warn(`[DirectSMS] WARN: ${msg}`, data || ''),
};

export class DirectSMSAccess {
  
  // Test if the direct SMS module is available
  static isAvailable(): boolean {
    const available = !!(DirectSMSReader && DirectSMSReader.testDirectAccess);
    logger.info(`Direct SMS module available: ${available}`);
    return available;
  }

  // Comprehensive permission and access test
  static async runDiagnostics(): Promise<void> {
    try {
      logger.info('=== DIRECT SMS DIAGNOSTICS ===');
      
      if (Platform.OS !== 'android') {
        Alert.alert('Platform Error', 'Direct SMS access only works on Android');
        return;
      }

      if (!this.isAvailable()) {
        Alert.alert('Module Error', 'Direct SMS reader module is not available');
        return;
      }

      // Test direct access
      const testResult = await DirectSMSReader.testDirectAccess();
      logger.info('Direct access test result:', testResult);

      // Check React Native permission
      const rnPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      logger.info(`React Native permission: ${rnPermission}`);

      // Check native permission
      const nativePermission = await DirectSMSReader.hasPermission();
      logger.info(`Native permission: ${nativePermission}`);

      // Show comprehensive results
      Alert.alert(
        '📊 Direct SMS Diagnostics',
        `Platform: Android ✅\n\nModule Available: ${this.isAvailable() ? '✅' : '❌'}\n\nPermissions:\n• RN Permission: ${rnPermission ? '✅' : '❌'}\n• Native Permission: ${nativePermission ? '✅' : '❌'}\n\nDirect Access: ${testResult.canAccessSMS ? '✅' : '❌'}\n\nError: ${testResult.error || 'None'}`,
        [
          { text: 'OK' },
          { text: 'Request Permission', onPress: () => this.requestPermission() },
          { text: 'Test Read SMS', onPress: () => this.testReadSMS() }
        ]
      );

    } catch (error) {
      logger.error('Diagnostics failed', error);
      Alert.alert('Diagnostics Failed', `Error: ${error.message}`);
    }
  }

  // Request SMS permission using React Native
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      logger.info('Requesting SMS permission via React Native');
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Access Required',
          message: 'Textile needs SMS access to read and organize your messages. This permission is essential for the app to function.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      logger.info(`Permission request result: ${granted} (granted: ${isGranted})`);

      if (isGranted) {
        Alert.alert('Success!', 'SMS permission granted! You can now read messages from your device.');
      } else {
        Alert.alert('Permission Denied', 'SMS permission was not granted. The app will use sample data instead.');
      }

      return isGranted;
    } catch (error) {
      logger.error('Permission request failed', error);
      Alert.alert('Permission Error', `Failed to request permission: ${error.message}`);
      return false;
    }
  }

  // Test reading SMS messages directly
  static async testReadSMS(): Promise<void> {
    try {
      if (!this.isAvailable()) {
        Alert.alert('Error', 'Direct SMS module not available');
        return;
      }

      logger.info('Testing direct SMS reading');
      
      // Check permission first
      const hasPermission = await DirectSMSReader.hasPermission();
      if (!hasPermission) {
        Alert.alert(
          'No Permission',
          'SMS permission is required to read messages. Grant permission first.',
          [
            { text: 'OK' },
            { text: 'Request Permission', onPress: () => this.requestPermission() }
          ]
        );
        return;
      }

      // Try to read SMS messages
      const messages = await DirectSMSReader.readAllSMS();
      logger.info(`Successfully read ${messages.length} SMS messages`);

      if (messages.length > 0) {
        const sample = messages[0];
        Alert.alert(
          'SMS Read Success!',
          `Successfully read ${messages.length} messages!\n\nSample message:\nFrom: ${sample.address}\nBody: ${sample.body.substring(0, 50)}...`,
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert('No Messages', 'No SMS messages found on device.');
      }

    } catch (error) {
      logger.error('SMS read test failed', error);
      Alert.alert('Read Failed', `Failed to read SMS: ${error.message}`);
    }
  }

  // Read all SMS messages
  static async readAllMessages(): Promise<DirectSMSMessage[]> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Direct SMS module not available');
      }

      const hasPermission = await DirectSMSReader.hasPermission();
      if (!hasPermission) {
        throw new Error('SMS permission not granted');
      }

      const messages = await DirectSMSReader.readAllSMS();
      logger.info(`Read ${messages.length} SMS messages via direct access`);
      
      return messages;
    } catch (error) {
      logger.error('Failed to read SMS messages', error);
      throw error;
    }
  }

  // Get SMS count
  static async getMessageCount(): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 0;
      }

      const count = await DirectSMSReader.getSMSCount();
      logger.info(`Total SMS count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Failed to get SMS count', error);
      return 0;
    }
  }
}

export default DirectSMSAccess;