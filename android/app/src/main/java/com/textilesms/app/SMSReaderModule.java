package com.textilesms.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class SMSReaderModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "SMSReader";
    private ReactApplicationContext reactContext;

    public SMSReaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void checkSMSPermission(Promise promise) {
        try {
            int permissionCheck = ContextCompat.checkSelfPermission(
                reactContext, 
                Manifest.permission.READ_SMS
            );
            boolean hasPermission = permissionCheck == PackageManager.PERMISSION_GRANTED;
            promise.resolve(hasPermission);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestSMSPermission(Promise promise) {
        try {
            // Check if permission is already granted
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                == PackageManager.PERMISSION_GRANTED) {
                promise.resolve("granted");
                return;
            }

            // For React Native, we need to handle this differently
            // The permission request should be handled by React Native's PermissionsAndroid
            promise.resolve("needs_request");
        } catch (Exception e) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void readSMSMessages(int limit, Promise promise) {
        try {
            // Check permission first
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "SMS permission not granted");
                return;
            }

            ContentResolver contentResolver = reactContext.getContentResolver();
            Uri smsUri = Telephony.Sms.CONTENT_URI;
            
            String[] projection = {
                Telephony.Sms._ID,
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE,
                Telephony.Sms.TYPE,
                Telephony.Sms.THREAD_ID
            };

            String sortOrder = Telephony.Sms.DATE + " DESC LIMIT " + limit;
            
            Cursor cursor = contentResolver.query(
                smsUri,
                projection,
                null,
                null,
                sortOrder
            );

            WritableArray messages = Arguments.createArray();

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    WritableMap message = Arguments.createMap();
                    
                    String id = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms._ID));
                    String address = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));
                    String date = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE));
                    String type = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.TYPE));
                    String threadId = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.THREAD_ID));

                    message.putString("id", id != null ? id : "");
                    message.putString("address", address != null ? address : "Unknown");
                    message.putString("body", body != null ? body : "");
                    message.putString("date", date != null ? date : "0");
                    message.putString("type", type != null ? type : "1");
                    message.putString("threadId", threadId != null ? threadId : "0");

                    messages.pushMap(message);
                }
                cursor.close();
            }

            promise.resolve(messages);

        } catch (Exception e) {
            promise.reject("SMS_READ_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getSMSCount(Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "SMS permission not granted");
                return;
            }

            ContentResolver contentResolver = reactContext.getContentResolver();
            Uri smsUri = Telephony.Sms.CONTENT_URI;
            
            Cursor cursor = contentResolver.query(
                smsUri,
                new String[]{"COUNT(*)"},
                null,
                null,
                null
            );

            int count = 0;
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    count = cursor.getInt(0);
                }
                cursor.close();
            }

            promise.resolve(count);

        } catch (Exception e) {
            promise.reject("SMS_COUNT_ERROR", e.getMessage());
        }
    }
}