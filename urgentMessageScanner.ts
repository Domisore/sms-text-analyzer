import { db } from './database';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_FETCH_TASK = 'urgent-message-scanner';
const SCAN_INTERVAL = 12 * 60 * 60; // 12 hours in seconds

// Keywords that indicate urgent messages
const URGENT_KEYWORDS = [
  'urgent', 'due', 'overdue', 'past due', 'payment due',
  'prescription', 'pharmacy', 'ready for pickup',
  'bill', 'invoice', 'balance', 'payment',
  'account', 'suspended', 'expired', 'expiring',
  'reminder', 'final notice', 'action required',
  'verify', 'confirm', 'security alert'
];

export interface UrgentMessage {
  id: number;
  sender: string;
  body: string;
  time: number;
  urgencyReason: string;
}

/**
 * Check if a message contains urgent keywords
 */
export function isUrgentMessage(message: string): { isUrgent: boolean; reason: string } {
  const lowerMessage = message.toLowerCase();
  
  for (const keyword of URGENT_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return { isUrgent: true, reason: keyword };
    }
  }
  
  return { isUrgent: false, reason: '' };
}

/**
 * Scan database for urgent messages that haven't been notified
 */
export async function scanForUrgentMessages(): Promise<UrgentMessage[]> {
  try {
    console.log('[UrgentScanner] Starting scan for urgent messages...');
    
    // Get all messages from the last 7 days that haven't been marked as notified
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const messages = db.getAllSync(
      `SELECT id, sender, body, time 
       FROM sms 
       WHERE time > ? 
       AND (notified IS NULL OR notified = 0)
       ORDER BY time DESC`,
      [sevenDaysAgo]
    ) as Array<{ id: number; sender: string; body: string; time: number }>;

    console.log(`[UrgentScanner] Checking ${messages.length} recent messages...`);

    const urgentMessages: UrgentMessage[] = [];

    for (const msg of messages) {
      const { isUrgent, reason } = isUrgentMessage(msg.body);
      
      if (isUrgent) {
        urgentMessages.push({
          id: msg.id,
          sender: msg.sender,
          body: msg.body,
          time: msg.time,
          urgencyReason: reason,
        });
      }
    }

    console.log(`[UrgentScanner] Found ${urgentMessages.length} urgent messages`);
    return urgentMessages;

  } catch (error) {
    console.error('[UrgentScanner] Error scanning messages:', error);
    return [];
  }
}

/**
 * Mark messages as notified
 */
export function markAsNotified(messageIds: number[]): void {
  try {
    // Add notified column if it doesn't exist
    db.execSync(`
      ALTER TABLE sms ADD COLUMN IF NOT EXISTS notified INTEGER DEFAULT 0;
    `);

    // Mark messages as notified
    const placeholders = messageIds.map(() => '?').join(',');
    db.runSync(
      `UPDATE sms SET notified = 1 WHERE id IN (${placeholders})`,
      messageIds
    );

    console.log(`[UrgentScanner] Marked ${messageIds.length} messages as notified`);
  } catch (error) {
    console.error('[UrgentScanner] Error marking messages as notified:', error);
  }
}

/**
 * Show notification for urgent messages
 */
export async function showUrgentNotification(urgentMessages: UrgentMessage[]): Promise<void> {
  if (urgentMessages.length === 0) return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[UrgentScanner] Notification permission not granted');
      return;
    }

    if (urgentMessages.length === 1) {
      const msg = urgentMessages[0];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Urgent: ${msg.sender}`,
          body: msg.body.substring(0, 100) + (msg.body.length > 100 ? '...' : ''),
          data: { messageId: msg.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${urgentMessages.length} Urgent Messages`,
          body: `You have ${urgentMessages.length} urgent messages requiring attention`,
          data: { count: urgentMessages.length },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    }

    // Mark as notified
    markAsNotified(urgentMessages.map(m => m.id));

    console.log(`[UrgentScanner] Notification shown for ${urgentMessages.length} messages`);
  } catch (error) {
    console.error('[UrgentScanner] Error showing notification:', error);
  }
}

/**
 * Manual scan triggered by user
 */
export async function manualScan(): Promise<UrgentMessage[]> {
  console.log('[UrgentScanner] Manual scan triggered');
  const urgentMessages = await scanForUrgentMessages();
  
  if (urgentMessages.length > 0) {
    await showUrgentNotification(urgentMessages);
  }
  
  return urgentMessages;
}

/**
 * Background task definition
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[UrgentScanner] Background task running...');
    
    const urgentMessages = await scanForUrgentMessages();
    
    if (urgentMessages.length > 0) {
      await showUrgentNotification(urgentMessages);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[UrgentScanner] Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background fetch task
 */
export async function registerBackgroundTask(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('[UrgentScanner] Background fetch only supported on Android');
    return false;
  }

  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('[UrgentScanner] Background task already registered');
      return true;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: SCAN_INTERVAL, // 12 hours
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start after device reboot
    });

    console.log('[UrgentScanner] Background task registered successfully');
    return true;
  } catch (error) {
    console.error('[UrgentScanner] Error registering background task:', error);
    return false;
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[UrgentScanner] Background task unregistered');
  } catch (error) {
    console.error('[UrgentScanner] Error unregistering background task:', error);
  }
}

/**
 * Check if background task is registered
 */
export async function isBackgroundTaskRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  } catch (error) {
    console.error('[UrgentScanner] Error checking task registration:', error);
    return false;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[UrgentScanner] Notification permission denied');
      return false;
    }
    
    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('urgent-messages', {
        name: 'Urgent Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });
    }
    
    console.log('[UrgentScanner] Notification permissions granted');
    return true;
  } catch (error) {
    console.error('[UrgentScanner] Error requesting notification permissions:', error);
    return false;
  }
}
