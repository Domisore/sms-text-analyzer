import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

// Fallback for development/testing
const NotificationListenerModuleNative = NativeModules.NotificationListenerModule || {
  isNotificationAccessGranted: () => Promise.resolve(false),
  openNotificationSettings: () => Promise.resolve(false),
};

interface UrgentSMSEvent {
  sender: string;
  message: string;
  timestamp: number;
}

class NotificationListener {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: ((event: UrgentSMSEvent) => void)[] = [];

  constructor() {
    if (Platform.OS === 'android' && NotificationListenerModuleNative) {
      this.eventEmitter = new NativeEventEmitter(NativeModules.DeviceEventManagerModule);
    }
  }

  /**
   * Check if notification access is granted
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await NotificationListenerModuleNative.isNotificationAccessGranted();
    } catch (error) {
      console.error('Error checking notification access:', error);
      return false;
    }
  }

  /**
   * Open Android notification settings using IntentLauncher
   */
  async openSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      // Try native module first
      if (NotificationListenerModuleNative.openNotificationSettings) {
        const result = await NotificationListenerModuleNative.openNotificationSettings();
        if (result) return true;
      }
      
      // Fallback to IntentLauncher for notification listener settings
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.NOTIFICATION_LISTENER_SETTINGS
      );
      return true;
    } catch (error) {
      console.error('Error opening notification settings:', error);
      
      // Final fallback to general notification settings
      try {
        await Linking.openSettings();
        return true;
      } catch (linkError) {
        console.error('Error opening settings:', linkError);
        return false;
      }
    }
  }

  /**
   * Listen for urgent SMS events
   */
  addListener(callback: (event: UrgentSMSEvent) => void) {
    if (!this.eventEmitter) {
      console.warn('NotificationListener not available on this platform');
      return () => {};
    }

    this.listeners.push(callback);

    const subscription = this.eventEmitter.addListener('onUrgentSMS', callback);

    return () => {
      subscription.remove();
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onUrgentSMS');
    }
    this.listeners = [];
  }
}

export const notificationListener = new NotificationListener();
export type { UrgentSMSEvent };
