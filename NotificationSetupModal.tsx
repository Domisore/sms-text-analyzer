import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificationListener } from './NotificationListenerModule';

interface NotificationSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationSetupModal: React.FC<NotificationSetupModalProps> = ({
  visible,
  onClose,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (visible) {
      checkStatus();
    }
  }, [visible]);

  const checkStatus = async () => {
    setChecking(true);
    const enabled = await notificationListener.isEnabled();
    setIsEnabled(enabled);
    setChecking(false);
  };

  const handleEnable = async () => {
    await notificationListener.openSettings();
    // Check again after a delay (user might have enabled it)
    setTimeout(checkStatus, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🔔 Real-Time Urgent Alerts</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {checking ? (
              <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="loading" size={48} color="#10B981" />
                <Text style={styles.loadingText}>Checking status...</Text>
              </View>
            ) : isEnabled ? (
              <View style={styles.successContainer}>
                <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
                <Text style={styles.successTitle}>✅ Real-Time Alerts Enabled!</Text>
                <Text style={styles.successText}>
                  You'll receive instant notifications for urgent messages like bills, prescriptions, and financial alerts.
                </Text>
                
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
                    <Text style={styles.featureText}>Bill payment reminders</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="pill" size={20} color="#10B981" />
                    <Text style={styles.featureText}>Prescription ready alerts</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="bank" size={20} color="#EF4444" />
                    <Text style={styles.featureText}>Urgent financial messages</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.setupContainer}>
                <MaterialCommunityIcons name="bell-alert" size={64} color="#F59E0B" />
                <Text style={styles.setupTitle}>Get Instant Alerts for Urgent Messages</Text>
                <Text style={styles.setupDescription}>
                  Enable real-time notifications to never miss important messages like:
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons name="cash" size={24} color="#F59E0B" />
                    <View style={styles.benefitText}>
                      <Text style={styles.benefitTitle}>Bills & Payments</Text>
                      <Text style={styles.benefitDescription}>
                        Get alerted when bills are due or payments are overdue
                      </Text>
                    </View>
                  </View>

                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons name="pill" size={24} color="#10B981" />
                    <View style={styles.benefitText}>
                      <Text style={styles.benefitTitle}>Prescriptions</Text>
                      <Text style={styles.benefitDescription}>
                        Know immediately when your prescription is ready
                      </Text>
                    </View>
                  </View>

                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons name="bank" size={24} color="#EF4444" />
                    <View style={styles.benefitText}>
                      <Text style={styles.benefitTitle}>Financial Alerts</Text>
                      <Text style={styles.benefitDescription}>
                        Urgent account alerts, security warnings, etc.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
                  <Text style={styles.infoText}>
                    Your privacy is protected. We only monitor for urgent keywords. All processing happens on your device.
                  </Text>
                </View>

                <View style={styles.stepsContainer}>
                  <Text style={styles.stepsTitle}>How to Enable:</Text>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Tap "Enable Notifications" below</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Find "Textile SMS" in the list</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Toggle it ON</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <Text style={styles.stepText}>Return to app - Done!</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.enableButton} onPress={handleEnable}>
                  <MaterialCommunityIcons name="bell-ring" size={24} color="#FFF" />
                  <Text style={styles.enableButtonText}>Enable Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                  <Text style={styles.skipButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  successText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  setupContainer: {
    alignItems: 'center',
  },
  setupTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stepsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
