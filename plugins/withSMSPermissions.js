const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Custom config plugin for SMS Notification Listener
 * Adds NotificationListenerService for real-time urgent message alerts
 */
const withSMSNotificationListener = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add POST_NOTIFICATIONS permission for Android 13+
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];

    const addPermission = (name) => {
      const exists = permissions.some(
        (p) => p.$?.['android:name'] === name
      );
      if (!exists) {
        permissions.push({ $: { 'android:name': name } });
      }
    };

    addPermission('android.permission.POST_NOTIFICATIONS');
    addPermission('android.permission.READ_SMS');
    addPermission('android.permission.RECEIVE_SMS');

    // Enable large heap for processing large SMS backup files
    // This increases memory limit from 256MB to 512MB
    if (!mainApplication.$) {
      mainApplication.$ = {};
    }
    mainApplication.$['android:largeHeap'] = 'true';

    // Add NotificationListenerService
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceExists = mainApplication.service.some(
      (s) => s.$?.['android:name'] === '.SMSNotificationListener'
    );

    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': '.SMSNotificationListener',
          'android:label': 'Textile SMS Urgent Alerts',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withSMSNotificationListener;
