const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom config plugin to properly configure SMS permissions for Android 12+
 * This adds the necessary queries and intent filters for SMS functionality
 */
const withSMSPermissions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add queries for SMS apps (required for Android 11+)
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    // Add intent query for SMS
    const smsIntent = {
      intent: [
        {
          action: [{ $: { 'android:name': 'android.intent.action.SENDTO' } }],
          data: [{ $: { 'android:scheme': 'smsto' } }],
        },
      ],
    };

    // Check if query already exists
    const hasQuery = androidManifest.manifest.queries.some(
      (q) => q.intent && q.intent[0]?.action?.[0]?.$?.['android:name'] === 'android.intent.action.SENDTO'
    );

    if (!hasQuery) {
      androidManifest.manifest.queries.push(smsIntent);
    }

    // Add uses-permission with maxSdkVersion for restricted permissions
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];

    // Helper to add permission if not exists
    const addPermission = (name, maxSdk = null) => {
      const exists = permissions.some(
        (p) => p.$?.['android:name'] === name
      );
      if (!exists) {
        const perm = { $: { 'android:name': name } };
        if (maxSdk) {
          perm.$['android:maxSdkVersion'] = maxSdk;
        }
        permissions.push(perm);
      }
    };

    // Add SMS permissions with proper configuration
    // Note: On Android 12+, these will be restricted unless app is default SMS app
    addPermission('android.permission.READ_SMS');
    addPermission('android.permission.RECEIVE_SMS');
    addPermission('android.permission.SEND_SMS');
    
    // These are less restricted
    addPermission('android.permission.READ_PHONE_STATE');

    return config;
  });
};

module.exports = withSMSPermissions;
