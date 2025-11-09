package com.textilesms.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.List;

public class DirectSMSReader extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "DirectSMSReader";
    private ReactApplicationContext reactContext;

    public DirectSMSReader(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            boolean hasReadSMS = ContextCompat.checkSelfPermission(
                reactContext, 
                Manifest.permission.READ_SMS
            ) == PackageManager.PERMISSION_GRANTED;
            
            promise.resolve(hasReadSMS);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void readAllSMS(Promise promise) {
        try {
            // Check permission first
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "SMS permission not granted");
                return;
            }

            List<WritableMap> messages = new ArrayList<>();
            ContentResolver contentResolver = reactContext.getContentResolver();
            
            // Use the SMS content provider directly
            Uri smsUri = Uri.parse("content://sms/");
            
            String[] projection = {
                "_id",
                "address", 
                "body",
                "date",
                "type",
                "thread_id"
            };

            // Query all SMS messages, ordered by date descending
            Cursor cursor = contentResolver.query(
                smsUri,
                projection,
                null,
                null,
                "date DESC LIMIT 1000"
            );

            if (cursor != null) {
                int idIndex = cursor.getColumnIndex("_id");
                int addressIndex = cursor.getColumnIndex("address");
                int bodyIndex = cursor.getColumnIndex("body");
                int dateIndex = cursor.getColumnIndex("date");
                int typeIndex = cursor.getColumnIndex("type");
                int threadIndex = cursor.getColumnIndex("thread_id");

                while (cursor.moveToNext()) {
                    WritableMap message = Arguments.createMap();
                    
                    message.putString("id", cursor.getString(idIndex));
                    message.putString("address", cursor.getString(addressIndex));
                    message.putString("body", cursor.getString(bodyIndex));
                    message.putString("date", cursor.getString(dateIndex));
                    message.putString("type", cursor.getString(typeIndex));
                    message.putString("thread_id", cursor.getString(threadIndex));

                    messages.add(message);
                }
                cursor.close();
            }

            // Convert to WritableArray
            WritableArray result = Arguments.createArray();
            for (WritableMap message : messages) {
                result.pushMap(message);
            }

            promise.resolve(result);

        } catch (Exception e) {
            promise.reject("SMS_READ_ERROR", "Failed to read SMS: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getSMSCount(Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.resolve(0);
                return;
            }

            ContentResolver contentResolver = reactContext.getContentResolver();
            Uri smsUri = Uri.parse("content://sms/");
            
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
            promise.resolve(0);
        }
    }

    @ReactMethod
    public void testDirectAccess(Promise promise) {
        try {
            // Test if we can access SMS content provider at all
            ContentResolver contentResolver = reactContext.getContentResolver();
            Uri smsUri = Uri.parse("content://sms/");
            
            Cursor cursor = contentResolver.query(
                smsUri,
                new String[]{"_id"},
                null,
                null,
                "_id DESC LIMIT 1"
            );

            boolean canAccess = cursor != null;
            if (cursor != null) {
                cursor.close();
            }

            WritableMap result = Arguments.createMap();
            result.putBoolean("canAccessSMS", canAccess);
            result.putBoolean("hasPermission", ContextCompat.checkSelfPermission(
                reactContext, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED);
            
            promise.resolve(result);

        } catch (Exception e) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("canAccessSMS", false);
            result.putBoolean("hasPermission", false);
            result.putString("error", e.getMessage());
            promise.resolve(result);
        }
    }
}