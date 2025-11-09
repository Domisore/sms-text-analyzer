import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ImportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onShowInstructions: () => void;
  onImportFile: () => void;
}

export const ImportOptionsModal: React.FC<ImportOptionsModalProps> = ({
  visible,
  onClose,
  onShowInstructions,
  onImportFile,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Import SMS Messages</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Import your SMS messages from a backup file to analyze and categorize them.
            </Text>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                onShowInstructions();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={32} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>How to Import SMS</Text>
                <Text style={styles.optionDescription}>
                  Step-by-step guide on creating an SMS backup file
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                onImportFile();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, styles.optionIconPrimary]}>
                <MaterialCommunityIcons name="file-import" size={32} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Import from File</Text>
                <Text style={styles.optionDescription}>
                  Select your SMS backup XML file to import
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#10B981" />
              <Text style={styles.infoText}>
                Recommended: Use "SMS Backup & Restore" app from Play Store to create your backup file.
              </Text>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
  description: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconPrimary: {
    backgroundColor: '#F59E0B20',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98110',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
  },
});
