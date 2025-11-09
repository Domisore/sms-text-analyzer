package com.textilesms.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.util.Log;

public class MMSReceiver extends BroadcastReceiver {
    private static final String TAG = "TextileMMSReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "MMS received: " + intent.getAction());
        
        if (Telephony.Sms.Intents.WAP_PUSH_RECEIVED_ACTION.equals(intent.getAction())) {
            // Handle MMS message
            Log.d(TAG, "MMS message received");
            
            // For now, we just log it to show the receiver is working
            // In a full SMS app, you would process the MMS content here
        }
    }
}