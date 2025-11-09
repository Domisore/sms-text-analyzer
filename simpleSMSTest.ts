import { PermissionsAndroid, Platform, Alert } from 'react-native';

// Ultra-simple SMS permission test that will definitely work
export const runSimpleSMSTest = async () => {
  try {
    console.log('=== SIMPLE SMS TEST STARTING ===');
    
    if (Platform.OS !== 'android') {
      Alert.alert('❌ Platform Error', 'This test only works on Android devices.');
      return;
    }
    
    console.log('✅ Platform: Android confirmed');
    
    // Step 1: Check if we can even access the permission system
    let canCheckPermissions = false;
    try {
      await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      canCheckPermissions = true;
      console.log('✅ Permission system accessible');
    } catch (error) {
      console.log('❌ Permission system error:', error);
    }
    
    if (!canCheckPermissions) {
      Alert.alert('❌ Permission System Error', 'Cannot access Android permission system.');
      return;
    }
    
    // Step 2: Check current SMS permission status
    const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    console.log(`📋 READ_SMS permission: ${hasReadSMS}`);
    
    if (hasReadSMS) {
      Alert.alert(
        '✅ SUCCESS!', 
        'SMS permission is already granted! The permission system is working.',
        [
          { text: 'Great!' },
          { text: 'Test Import', onPress: () => {
            Alert.alert('Next Step', 'Try using "Import SMS" → "From Device" to test reading your actual messages.');
          }}
        ]
      );
      return;
    }
    
    // Step 3: Try to request permission
    console.log('🔄 Requesting SMS permission...');
    
    Alert.alert(
      '🔐 Permission Test',
      'SMS permission is not granted. Tap "Request Permission" to test if the permission dialog appears.',
      [
        { text: 'Cancel' },
        { 
          text: 'Request Permission', 
          onPress: async () => {
            try {
              const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_SMS,
                {
                  title: 'SMS Permission Test',
                  message: 'This is a test to see if SMS permission dialogs work on your device.',
                  buttonPositive: 'Allow',
                  buttonNegative: 'Deny',
                }
              );
              
              console.log(`📝 Permission result: ${result}`);
              
              if (result === PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('🎉 SUCCESS!', 'SMS permission granted! The permission system is working perfectly.');
              } else if (result === PermissionsAndroid.RESULTS.DENIED) {
                Alert.alert('⚠️ Permission Denied', 'Permission was denied, but the dialog appeared - that\'s progress!');
              } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert('🚫 Permission Blocked', 'Permission was permanently blocked. You can enable it manually in Settings > Apps > Textile > Permissions.');
              } else {
                Alert.alert('❓ Unexpected Result', `Permission result: ${result}`);
              }
              
            } catch (requestError) {
              console.log('❌ Permission request error:', requestError);
              Alert.alert('❌ Request Failed', `Permission request failed: ${requestError.message}`);
            }
          }
        }
      ]
    );
    
  } catch (error) {
    console.log('❌ Test failed:', error);
    Alert.alert('❌ Test Failed', `SMS test failed: ${error.message}`);
  }
};

// Export for easy access
export default runSimpleSMSTest;