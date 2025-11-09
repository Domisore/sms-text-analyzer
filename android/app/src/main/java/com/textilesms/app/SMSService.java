package com.textilesms.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

public class SMSService extends Service {
    private static final String TAG = "TextileSMSService";

    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "SMS Service bound");
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "SMS Service started: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent != null && "android.intent.action.RESPOND_VIA_MESSAGE".equals(intent.getAction())) {
            // Handle respond via message
            Log.d(TAG, "Respond via message requested");
            
            // For now, we just log it to show the service is working
            // In a full SMS app, you would handle the response here
        }
        
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "SMS Service destroyed");
    }
}