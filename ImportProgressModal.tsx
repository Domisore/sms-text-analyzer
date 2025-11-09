import React from 'react';
import { View, Text, Modal, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ImportProgressModalProps {
  visible: boolean;
  message: string;
  progress: number;
}

export const ImportProgressModal: React.FC<ImportProgressModalProps> = ({
  visible,
  message,
  progress,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <MaterialCommunityIcons name="file-import" size={48} color="#10B981" />
          <Text style={styles.title}>Importing SMS Messages</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.tipContainer}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F59E0B" />
            <Text style={styles.tip}>
              Large files may take a few minutes to process
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  tip: {
    color: '#F59E0B',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});
