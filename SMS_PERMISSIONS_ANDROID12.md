# SMS Permissions on Android 12+ (Pixel 7)

## 🚨 The Problem

On **Android 12+ (API 31+)**, Google introduced **severe restrictions** on SMS permissions:

### What You're Seeing
- SMS permission is **grayed out** in app settings
- Cannot be toggled on/off
- System prevents granting the permission

### Why This Happens
Android 12+ restricts SMS permissions to:
1. **Default SMS apps only** (like Google Messages)
2. Apps with **companion device roles**
3. Apps with **specific system roles**

**Regular apps cannot get SMS permissions anymore!**

---

## 🔍 Technical Details

### Android's Restriction
From Android 12 (API 31), the following permissions are **restricted**:
- `READ_SMS`
- `RECEIVE_SMS`
- `SEND_SMS`
- `RECEIVE_WAP_PUSH`
- `RECEIVE_MMS`

### Official Google Documentation
> "Starting in Android 12 (API level 31), the system restricts which apps can be granted SMS and call log permissions. Only apps that are selected as the default app for making calls or text messages can request these permissions."

Source: https://developer.android.com/about/versions/12/behavior-changes-12#sms-call-log-restricted

---

## ✅ Solutions

### Solution 1: File-Based Import (RECOMMENDED) ✅
**This is what your app already does!**

**Advantages:**
- ✅ Works on ALL Android versions
- ✅ No permission restrictions
- ✅ Access to ALL messages (not just recent)
- ✅ More reliable
- ✅ Privacy-focused
- ✅ Used by professional SMS tools

**How it works:**
1. User exports SMS using "SMS Backup & Restore" app
2. User imports the XML file into your app
3. All messages are processed and categorized

**This is actually BETTER than direct SMS access!**

---

### Solution 2: Make App Default SMS Handler (NOT RECOMMENDED)

To get SMS permissions, you would need to:

1. **Implement full SMS app functionality:**
   - Send/receive SMS
   - MMS support
   - Conversation management
   - Notification handling
   - SMS database management

2. **Add required components:**
   ```xml
   <receiver android:name=".SmsReceiver">
     <intent-filter>
       <action android:name="android.provider.Telephony.SMS_RECEIVED"/>
     </intent-filter>
   </receiver>
   
   <service android:name=".HeadlessSmsSendService"/>
   
   <activity android:name=".ComposeSmsActivity">
     <intent-filter>
       <action android:name="android.intent.action.SEND"/>
       <action android:name="android.intent.action.SENDTO"/>
     </intent-filter>
   </activity>
   ```

3. **Request to be default SMS app:**
   ```java
   Intent intent = new Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT);
   intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, getPackageName());
   startActivity(intent);
   ```

**Why NOT recommended:**
- ❌ Massive development effort
- ❌ Must replace user's current SMS app
- ❌ Responsibility for all SMS functionality
- ❌ User must switch back to original SMS app after
- ❌ Poor user experience

---

### Solution 3: Companion Device API (COMPLEX)

Use the Companion Device Manager API for specific use cases:
- Requires pairing with another device
- Limited to specific scenarios
- Complex implementation

**Not suitable for SMS management apps**

---

## 🎯 Recommendation

**Use File-Based Import (Solution 1)**

Your app is already built around this approach, which is:
- ✅ The most reliable method
- ✅ Works on all devices
- ✅ No permission headaches
- ✅ Better user experience
- ✅ Professional approach

### What to Do

1. **Keep the "From Device" option** - It will work on older Android versions (<12)
2. **Promote "From File" as primary method** - This works everywhere
3. **Show helpful message** - Explain why file import is better

---

## 📱 User Instructions

### For Android 12+ Users (Like Your Pixel 7)

**Step 1: Export Your SMS**
1. Install "SMS Backup & Restore" from Play Store
2. Open app → Backup → Create Backup
3. Choose XML format
4. Save to device

**Step 2: Import to Textile SMS**
1. Open Textile SMS
2. Menu → Import SMS → **From File**
3. Select your backup XML file
4. Done! All messages categorized

**This method:**
- ✅ Works perfectly on Pixel 7
- ✅ Accesses ALL your messages
- ✅ No permission issues
- ✅ One-time setup

---

## 🔧 Technical Workarounds (For Reference)

### Workaround 1: Lower Target SDK
**NOT RECOMMENDED** - Would need to target API 30 or lower:
- ❌ Google Play requires API 33+ (as of Aug 2023)
- ❌ Misses security updates
- ❌ Can't use new features
- ❌ App may be rejected

### Workaround 2: ADB Grant (Developer Only)
For testing only:
```bash
adb shell pm grant com.textilesms.app android.permission.READ_SMS
```
- ❌ Requires USB debugging
- ❌ Not for end users
- ❌ Resets on app update

### Workaround 3: Root Access
- ❌ Requires rooted device
- ❌ Voids warranty
- ❌ Security risk
- ❌ Not practical for users

---

## 📊 Comparison

| Method | Android 12+ | Permissions | Reliability | User Experience |
|--------|-------------|-------------|-------------|-----------------|
| **File Import** | ✅ Works | ✅ None needed | ✅ Excellent | ✅ Simple |
| Direct SMS | ❌ Blocked | ❌ Restricted | ❌ Fails | ❌ Confusing |
| Default SMS App | ⚠️ Complex | ✅ Full access | ⚠️ Moderate | ❌ Disruptive |

---

## 🎉 Conclusion

**The grayed-out SMS permission is NOT a bug - it's Android 12+ security!**

**Your app's file-based approach is the RIGHT solution:**
- Works on all devices
- No permission restrictions
- Better user experience
- Professional implementation

**Don't fight Android's restrictions - embrace the better solution you already have!** 🚀

---

## 📚 References

1. [Android 12 Behavior Changes](https://developer.android.com/about/versions/12/behavior-changes-12#sms-call-log-restricted)
2. [SMS Permissions Guide](https://developer.android.com/guide/topics/permissions/overview#sms)
3. [Default SMS App Requirements](https://developer.android.com/guide/topics/text/sms-apps)
4. [Companion Device Manager](https://developer.android.com/guide/topics/connectivity/companion-device-pairing)

---

**Last Updated:** v2.4.1  
**Status:** File import is the recommended solution ✅  
**Android 12+ Compatibility:** Full (via file import) ✅
