import React from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

// Standalone SMS Test Component that can be called from anywhere
export const SMSTestComponent = {
  
  // Simple SMS permission test
  runTest: async () => {
    try {
      console.log('🔐 SMS Test Starting...');
      
      if (Platform.OS !== 'android') {
        Alert.alert('❌ Platform Error', 'SMS permissions only work on Android devices.');
        return;
      }
      
      // Check if permission system works
      let canCheckPermissions = false;
      try {
        await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
        canCheckPermissions = true;
      } catch (error) {
        console.log('❌ Permission system error:', error);
      }
      
      if (!canCheckPermissions) {
        Alert.alert('❌ System Error', 'Cannot access Android permission system.');
        return;
      }
      
      // Check current SMS permission
      const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      console.log(`📋 Current SMS permission: ${hasReadSMS}`);
      
      if (hasReadSMS) {
        Alert.alert(
          '✅ SUCCESS!', 
          'SMS permission is already granted!\n\nThe permission system is working correctly.',
          [
            { text: 'Great!' },
            { text: 'Test Import', onPress: () => {
              Alert.alert('Next Step', 'Try "Import SMS" → "From Device" to test reading your actual messages.');
            }}
          ]
        );
        return;
      }
      
      // Permission not granted - offer to request it
      Alert.alert(
        '🔐 SMS Permission Test',
        'SMS permission is not currently granted.\n\nWould you like to test requesting the permission?',
        [
          { text: 'Cancel' },
          { 
            text: 'Test Request', 
            onPress: async () => {
              try {
                console.log('🔄 Requesting SMS permission...');
                
                const result = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.READ_SMS,
                  {
                    title: 'SMS Permission Test',
                    message: 'Textile needs SMS access to read and organize your messages.\n\nThis is a test to see if permission dialogs work on your Pixel 7.',
                    buttonPositive: 'Allow',
                    buttonNegative: 'Deny',
                  }
                );
                
                console.log(`📝 Permission result: ${result}`);
                
                // Analyze the result
                switch (result) {
                  case PermissionsAndroid.RESULTS.GRANTED:
                    Alert.alert(
                      '🎉 BREAKTHROUGH!', 
                      'SMS permission was GRANTED!\n\nThis means:\n✅ Permission system works\n✅ Your device allows SMS access\n✅ The app is configured correctly\n\nYou can now use "From Device" import!'
                    );
                    break;
                    
                  case PermissionsAndroid.RESULTS.DENIED:
                    Alert.alert(
                      '⚠️ Permission Denied', 
                      'Permission was denied, but the dialog appeared!\n\nThis means:\n✅ Permission system works\n✅ Dialog can be shown\n❌ You chose to deny\n\nYou can grant it manually in Settings.'
                    );
                    break;
                    
                  case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
                    Alert.alert(
                      '🚫 Permission Blocked', 
                      'Permission was permanently blocked.\n\nThis means:\n✅ Permission system works\n❌ Previously denied permanently\n\n💡 Enable manually:\nSettings > Apps > Textile > Permissions > SMS'
                    );
                    break;
                    
                  default:
                    Alert.alert(
                      '❓ Unexpected Result', 
                      `Permission returned: ${result}\n\nThis is unusual but shows the permission system is responding.`
                    );
                }
                
              } catch (requestError) {
                console.log('❌ Permission request failed:', requestError);
                Alert.alert(
                  '❌ Request Failed', 
                  `Permission request failed:\n${requestError.message}\n\nThis suggests a deeper Android configuration issue.`
                );
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.log('❌ SMS test failed:', error);
      Alert.alert('❌ Test Failed', `SMS test encountered an error:\n${error.message}`);
    }
  },
  
  // Quick status check
  checkStatus: async () => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Info', 'SMS permissions are Android-only.');
        return;
      }
      
      const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      const hasReceiveSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      
      Alert.alert(
        '📊 SMS Permission Status',
        `READ_SMS: ${hasReadSMS ? '✅ Granted' : '❌ Not Granted'}\nRECEIVE_SMS: ${hasReceiveSMS ? '✅ Granted' : '❌ Not Granted'}`,
        [
          { text: 'OK' },
          { text: 'Run Full Test', onPress: SMSTestComponent.runTest }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', `Status check failed: ${error.message}`);
    }
  }
};

export default SMSTestComponent;