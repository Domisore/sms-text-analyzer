import { NativeModules, PermissionsAndroid, Platform, Alert } from 'react-native';

const { SMSReader } = NativeModules;

export interface NativeSMSMessage {
  id: string;
  address: string;
  body: string;
  date: string;
  type: string;
  threadId: string;
}

// Logger for native SMS operations
const logger = {
  info: (msg: string, data?: any) => console.log(`[NativeSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[NativeSMS] ERROR: ${msg}`, err || ''),
  warn: (msg: string, data?: any) => console.warn(`[NativeSMS] WARN: ${msg}`, data || ''),
};

export class NativeSMSReader {
  
  // Check if SMS permission is granted
  static async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      logger.warn('SMS reading only supported on Android');
      return false;
    }

    try {
      // First check using React Native's permission system
      const rnPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      logger.info(`RN Permission check: ${rnPermission}`);

      // Also check using our native module
      if (SMSReader && SMSReader.checkSMSPermission) {
        const nativePermission = await SMSReader.checkSMSPermission();
        logger.info(`Native permission check: ${nativePermission}`);
        return nativePermission;
      }

      return rnPermission;
    } catch (error) {
      logger.error('Permission check failed', error);
      return false;
    }
  }

  // Request SMS permission
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'SMS reading is only supported on Android devices.');
      return false;
    }

    try {
      logger.info('Requesting SMS permission');

      // Use React Native's permission request system
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

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      if (isGranted) {
        Alert.alert('Permission Granted!', 'SMS access has been granted. You can now import messages from your device.');
      } else {
        Alert.alert(
          'Permission Required',
          'SMS permission is needed to read your messages. You can grant it later in device settings or use file import instead.',
          [
            { text: 'OK' },
            { text: 'Use File Import', onPress: () => {
              Alert.alert('File Import', 'Use the "Import SMS" → "From Backup File" option to import your messages.');
            }}
          ]
        );
      }

      return isGranted;
    } catch (error) {
      logger.error('Permission request failed', error);
      Alert.alert('Permission Error', `Failed to request SMS permission: ${error.message}`);
      return false;
    }
  }

  // Read SMS messages using native module
  static async readMessages(limit: number = 1000): Promise<NativeSMSMessage[]> {
    if (Platform.OS !== 'android') {
      throw new Error('SMS reading is only supported on Android');
    }

    try {
      // Check permission first
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        throw new Error('SMS permission not granted');
      }

      // Check if native module is available
      if (!SMSReader || !SMSReader.readSMSMessages) {
        throw new Error('Native SMS reader module not available');
      }

      logger.info(`Reading SMS messages with limit: ${limit}`);
      const messages = await SMSReader.readSMSMessages(limit);
      logger.info(`Successfully read ${messages.length} messages`);

      return messages;
    } catch (error) {
      logger.error('Failed to read SMS messages', error);
      throw error;
    }
  }

  // Get total SMS count
  static async getMessageCount(): Promise<number> {
    if (Platform.OS !== 'android') {
      return 0;
    }

    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return 0;
      }

      if (!SMSReader || !SMSReader.getSMSCount) {
        return 0;
      }

      const count = await SMSReader.getSMSCount();
      logger.info(`Total SMS count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Failed to get SMS count', error);
      return 0;
    }
  }

  // Test native module availability
  static isNativeModuleAvailable(): boolean {
    const available = !!(SMSReader && SMSReader.readSMSMessages);
    logger.info(`Native SMS module available: ${available}`);
    return available;
  }
}

export default NativeSMSReader;