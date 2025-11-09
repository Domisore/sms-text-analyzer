// Quick SMS Permission Test - Add this to your existing APK
// You can test this in the React Native debugger or add it to a button

import { PermissionsAndroid, Platform, Alert } from 'react-native';

const quickSMSTest = async () => {
  console.log('=== QUICK SMS PERMISSION TEST ===');
  
  if (Platform.OS !== 'android') {
    Alert.alert('Error', 'SMS permissions only work on Android');
    return;
  }
  
  try {
    // Check current permissions
    const hasReadSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceiveSMS = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    
    console.log('Current permissions:');
    console.log('READ_SMS:', hasReadSMS);
    console.log('RECEIVE_SMS:', hasReceiveSMS);
    
    if (hasReadSMS) {
      Alert.alert('Success!', 'SMS permission is already granted!');
      return;
    }
    
    // Try to request permission
    console.log('Requesting SMS permission...');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Access Test',
        message: 'Testing SMS permission request for Textile app.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    
    console.log('Permission result:', granted);
    
    switch (granted) {
      case PermissionsAndroid.RESULTS.GRANTED:
        Alert.alert('Success!', 'SMS permission granted! The permission system is working.');
        break;
      case PermissionsAndroid.RESULTS.DENIED:
        Alert.alert('Denied', 'SMS permission was denied. You can try again or enable it in device settings.');
        break;
      case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        Alert.alert('Blocked', 'SMS permission was permanently blocked. Enable it manually in Settings > Apps > Textile > Permissions.');
        break;
      default:
        Alert.alert('Unknown', `Unexpected result: ${granted}`);
    }
    
  } catch (error) {
    console.error('SMS permission test failed:', error);
    Alert.alert('Error', `Permission test failed: ${error.message}`);
  }
};

// Call this function to test
quickSMSTest();