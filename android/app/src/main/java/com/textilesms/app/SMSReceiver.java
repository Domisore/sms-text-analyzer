package com.textilesms.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "TextileSMSReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "SMS received: " + intent.getAction());
        
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction()) ||
            Telephony.Sms.Intents.SMS_DELIVER_ACTION.equals(intent.getAction())) {
            
            // Extract SMS messages
            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            
            if (messages != null) {
                for (SmsMessage message : messages) {
                    String sender = message.getDisplayOriginatingAddress();
                    String body = message.getMessageBody();
                    long timestamp = message.getTimestampMillis();
                    
                    Log.d(TAG, "SMS from: " + sender + ", Body: " + body);
                    
                    // Here you could process the SMS or store it
                    // For now, we just log it to show the receiver is working
                }
            }
        }
    }
}