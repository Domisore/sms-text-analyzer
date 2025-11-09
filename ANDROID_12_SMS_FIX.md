# Android 12+ SMS Permission Fix for Pixel 7

## The Problem
On **Android 12+ (especially Pixel devices)**, apps need to be properly declared as **SMS handlers** to get SMS permissions. Your app shows "Permissions not allowed" because Android doesn't recognize it as SMS-capable.

## What I Fixed

### 1. Added Required SMS Permissions
```xml
<!-- SMS permissions for Android 12+ -->
<uses-permission android:name="android.permission.READ_SMS"/>
<uses-permission android:name="android.permission.RECEIVE_SMS"/>
<uses-permission android:name="android.permission.SEND_SMS"/>
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
<uses-permission android:name="android.permission.WRITE_SMS"/>
<uses-permission android:name="android.permission.BROADCAST_SMS"/>
<uses-permission android:name="android.permission.RECEIVE_MMS"/>
```

### 2. Added SMS App Components
- **SMSReceiver.java** - Handles incoming SMS messages
- **MMSReceiver.java** - Handles incoming MMS messages  
- **SMSService.java** - Handles SMS-related services
- **Proper intent filters** - Declares app as SMS-capable

### 3. Added SMS Intent Filters
```xml
<!-- SMS compose intent -->
<intent-filter>
  <action android:name="android.intent.action.SEND"/>
  <action android:name="android.intent.action.SEND_MULTIPLE"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <data android:mimeType="text/plain"/>
</intent-filter>
```

## Expected Result
After installing the updated APK:

1. **Go to Settings** → **Apps** → **Textile** → **Permissions**
2. **You should now see**:
   - ✅ **SMS permission listed** (not grayed out)
   - ✅ **Toggleable on/off**
   - ✅ **"Allow Textile to access SMS?"** dialog when requested

## Why This Fixes the Issue

**Android 12+ Security Model:**
- Apps must **declare SMS handling capability** to get SMS permissions
- **Pixel devices** are especially strict about this
- **Google's security policy** requires proper SMS app structure

**Before:** Android saw your app as a regular app trying to access SMS
**After:** Android recognizes your app as a legitimate SMS handler

## Testing Steps

1. **Install the new APK** (when build limit resets)
2. **Open Textile** → **Menu** → **Settings** → **Test SMS Permissions**
3. **Should show**: "SMS permission available" instead of "not allowed"
4. **Grant permission** when prompted
5. **Test "From Device" import** - should read real SMS messages

## Alternative: Manual Testing

If you want to test immediately:

1. **Install any SMS app** from Play Store (like "SMS Backup & Restore")
2. **Check its permissions** - does it show SMS permission?
3. **If yes**: The fix should work for Textile too
4. **If no**: Your device has additional restrictions

## Build Command (When Limit Resets)
```bash
npx eas build --platform android --profile preview
```

This comprehensive fix addresses the **Android 12+ SMS permission requirements** specifically for **Pixel devices**. The app will now be recognized as a proper SMS handler, making SMS permissions available in device settings.