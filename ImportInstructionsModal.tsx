import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ImportInstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ImportInstructionsModal: React.FC<ImportInstructionsModalProps> = ({
  visible,
  onClose,
}) => {
  const openPlayStore = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>📖 How to Import SMS</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                Android 12+ restricts SMS permissions for security. The recommended method is to import from a backup file.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>📱 Recommended Method: Import from File</Text>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Install SMS Backup & Restore</Text>
              </View>
              <Text style={styles.stepDescription}>
                Download the free "SMS Backup & Restore" app from Google Play Store. This is a trusted app with millions of downloads.
              </Text>
              <TouchableOpacity style={styles.playStoreButton} onPress={openPlayStore}>
                <MaterialCommunityIcons name="google-play" size={20} color="#FFF" />
                <Text style={styles.playStoreButtonText}>Open in Play Store</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Create SMS Backup</Text>
              </View>
              <Text style={styles.stepDescription}>
                Open SMS Backup & Restore and follow these steps:
              </Text>
              <View style={styles.subSteps}>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Tap "Backup" on the home screen</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Select "Messages" (SMS)</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Choose backup location (e.g., Downloads folder)</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Tap "Backup Now" and wait for completion</Text>
                </View>
              </View>
              <View style={styles.tipBox}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Tip: The backup file will be named something like "sms-20250109.xml"
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Import to Textile SMS</Text>
              </View>
              <Text style={styles.stepDescription}>
                Return to Textile SMS and import your backup:
              </Text>
              <View style={styles.subSteps}>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Open menu → Tap "Import SMS"</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Choose "From File"</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Select your backup XML file</Text>
                </View>
                <View style={styles.subStep}>
                  <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                  <Text style={styles.subStepText}>Wait for import to complete</Text>
                </View>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepTitle}>Enjoy Smart Categorization!</Text>
              </View>
              <Text style={styles.stepDescription}>
                Once imported, Textile SMS will automatically categorize your messages into:
              </Text>
              <View style={styles.categoryList}>
                <View style={styles.categoryItem}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#EF4444" />
                  <Text style={styles.categoryText}>Expired OTPs</Text>
                </View>
                <View style={styles.categoryItem}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#F59E0B" />
                  <Text style={styles.categoryText}>Upcoming Bills</Text>
                </View>
                <View style={styles.categoryItem}>
                  <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#8B5CF6" />
                  <Text style={styles.categoryText}>Spam Messages</Text>
                </View>
                <View style={styles.categoryItem}>
                  <MaterialCommunityIcons name="account-group-outline" size={20} color="#10B981" />
                  <Text style={styles.categoryText}>Social Updates</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>🔧 Alternative: Import from Device</Text>
            <Text style={styles.alternativeDescription}>
              You can also try importing directly from your device, but this requires SMS permissions which may be restricted on Android 12+.
            </Text>
            <View style={styles.alternativeSteps}>
              <View style={styles.subStep}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                <Text style={styles.subStepText}>Open menu → Tap "Import SMS"</Text>
              </View>
              <View style={styles.subStep}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                <Text style={styles.subStepText}>Choose "From Device"</Text>
              </View>
              <View style={styles.subStep}>
                <MaterialCommunityIcons name="circle-small" size={20} color="#9CA3AF" />
                <Text style={styles.subStepText}>Grant SMS permissions when prompted</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Note: If permission is denied, use the file import method above instead.
              </Text>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Got It!</Text>
            </TouchableOpacity>
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
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  stepDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  subSteps: {
    marginTop: 8,
  },
  subStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  subStepText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  tipText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 18,
  },
  playStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  playStoreButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryList: {
    marginTop: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 24,
  },
  alternativeDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  alternativeSteps: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
