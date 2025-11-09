import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  importLargeFileInChunks,
  splitLargeFile,
  truncateFile,
  analyzeFileAndRecommend,
} from './chunkImporter';

interface LargeFileImportModalProps {
  visible: boolean;
  fileUri: string;
  fileSizeMB: number;
  onClose: () => void;
  onComplete: () => void;
}

export const LargeFileImportModal: React.FC<LargeFileImportModalProps> = ({
  visible,
  fileUri,
  fileSizeMB,
  onClose,
  onComplete,
}) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ message: '', percent: 0 });

  const handleChunkedImport = async () => {
    try {
      setProcessing(true);
      await importLargeFileInChunks(fileUri, {
        onProgress: (message, percent, stats) => {
          setProgress({
            message: `${message}\n${stats.processedMessages}/${stats.totalMessages} messages`,
            percent,
          });
        },
        chunkSize: 1000,
      });
      setProcessing(false);
      onComplete();
      onClose();
    } catch (error) {
      setProcessing(false);
      Alert.alert('Import Failed', 'Failed to import file in chunks. Try splitting instead.');
    }
  };

  const handleSplitFile = async () => {
    try {
      setProcessing(true);
      setProgress({ message: 'Splitting file...', percent: 50 });

      const outputFiles = await splitLargeFile(fileUri, 5000);

      setProcessing(false);
      Alert.alert(
        'Files Created',
        `Created ${outputFiles.length} smaller files.\n\n` +
          `Go to Menu → Import SMS → From File and import each file separately.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      setProcessing(false);
      Alert.alert('Split Failed', 'Failed to split file. Try truncating instead.');
    }
  };

  const handleTruncate = () => {
    // Adjust options based on file size
    const options = fileSizeMB > 150 
      ? [
          { text: 'Cancel', style: 'cancel' as const },
          { text: '1,000 messages', onPress: () => performTruncate(1000) },
          { text: '2,500 messages', onPress: () => performTruncate(2500) },
          { text: '5,000 messages', onPress: () => performTruncate(5000) },
        ]
      : [
          { text: 'Cancel', style: 'cancel' as const },
          { text: '5,000 messages', onPress: () => performTruncate(5000) },
          { text: '10,000 messages', onPress: () => performTruncate(10000) },
          { text: '20,000 messages', onPress: () => performTruncate(20000) },
        ];

    Alert.alert(
      'Truncate File',
      fileSizeMB > 150
        ? `File is very large (${fileSizeMB.toFixed(0)}MB). Recommend keeping fewer messages to avoid memory issues.\n\nHow many recent messages?`
        : 'How many recent messages do you want to keep?',
      options
    );
  };

  const performTruncate = async (maxMessages: number) => {
    try {
      setProcessing(true);
      setProgress({ message: 'Truncating file...', percent: 50 });

      const truncatedUri = await truncateFile(fileUri, maxMessages);

      setProcessing(false);
      Alert.alert(
        'File Truncated',
        'Truncated file created. Import it now?',
        [
          { text: 'Later', style: 'cancel', onPress: onClose },
          {
            text: 'Import Now',
            onPress: async () => {
              await handleChunkedImport();
            },
          },
        ]
      );
    } catch (error) {
      setProcessing(false);
      Alert.alert('Truncate Failed', 'Failed to truncate file.');
    }
  };

  const strategies = [
    {
      id: 'chunked',
      title: 'Import in Chunks',
      description: fileSizeMB > 100 ? 'Not available for files >100MB' : 'Process the file in small batches',
      icon: 'file-import',
      color: '#10B981',
      recommended: fileSizeMB < 50,
      disabled: fileSizeMB > 100,
      pros: ['Processes entire file', 'Better memory management', 'Shows progress'],
      cons: ['May take several minutes', 'Only works for files <100MB'],
      action: handleChunkedImport,
    },
    {
      id: 'split',
      title: 'Split into Smaller Files',
      description: fileSizeMB > 100 ? 'Not available for files >100MB' : 'Create multiple smaller XML files',
      icon: 'file-multiple',
      color: '#F59E0B',
      recommended: fileSizeMB >= 50 && fileSizeMB < 100,
      disabled: fileSizeMB > 100,
      pros: ['Import at your own pace', 'Can pause between files', 'More reliable'],
      cons: ['Creates multiple files', 'Only works for files <100MB'],
      action: handleSplitFile,
    },
    {
      id: 'truncate',
      title: 'Keep Recent Messages Only',
      description: 'Truncate to most recent N messages',
      icon: 'content-cut',
      color: '#8B5CF6',
      recommended: fileSizeMB >= 50,
      disabled: false,
      pros: ['Works for any file size', 'Smaller file size', 'Keeps recent data'],
      cons: ['Loses older messages', 'May still fail for very large files'],
      action: handleTruncate,
    },
  ];

  if (processing) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.processingContainer}>
            <MaterialCommunityIcons name="loading" size={48} color="#10B981" />
            <Text style={styles.processingTitle}>Processing...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>
            <Text style={styles.processingMessage}>{progress.message}</Text>
            <Text style={styles.processingPercent}>{Math.round(progress.percent)}%</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⚠️ Large File Detected</Text>
              <Text style={styles.subtitle}>
                {fileSizeMB.toFixed(1)}MB file - Choose import strategy
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Large files may cause memory issues. Choose a strategy below for best results.
              </Text>
            </View>

            {strategies.map((strategy) => (
              <TouchableOpacity
                key={strategy.id}
                style={[
                  styles.strategyCard,
                  strategy.recommended && styles.strategyCardRecommended,
                  strategy.disabled && styles.strategyCardDisabled,
                ]}
                onPress={strategy.disabled ? undefined : strategy.action}
                activeOpacity={strategy.disabled ? 1 : 0.7}
                disabled={strategy.disabled}
              >
                {strategy.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.strategyHeader}>
                  <View style={[styles.strategyIcon, { backgroundColor: `${strategy.color}20` }]}>
                    <MaterialCommunityIcons
                      name={strategy.icon}
                      size={28}
                      color={strategy.color}
                    />
                  </View>
                  <View style={styles.strategyInfo}>
                    <Text style={styles.strategyTitle}>{strategy.title}</Text>
                    <Text style={styles.strategyDescription}>{strategy.description}</Text>
                  </View>
                </View>

                <View style={styles.prosConsContainer}>
                  <View style={styles.prosContainer}>
                    <Text style={styles.prosConsLabel}>✓ Pros:</Text>
                    {strategy.pros.map((pro, index) => (
                      <Text key={index} style={styles.proText}>
                        • {pro}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.consContainer}>
                    <Text style={styles.prosConsLabel}>✗ Cons:</Text>
                    {strategy.cons.map((con, index) => (
                      <Text key={index} style={styles.conText}>
                        • {con}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={styles.actionButton}>
                  <Text style={[styles.actionButtonText, { color: strategy.color }]}>
                    Choose This Option
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={strategy.color} />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                Tip: For files over 100MB, we recommend truncating to keep only recent messages.
                You can always re-import older messages later if needed.
              </Text>
            </View>
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
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
    lineHeight: 18,
  },
  strategyCard: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategyCardRecommended: {
    borderColor: '#10B981',
  },
  strategyCardDisabled: {
    opacity: 0.5,
    borderColor: '#4B5563',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  strategyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  strategyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  strategyDescription: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  prosConsContainer: {
    marginBottom: 16,
  },
  prosContainer: {
    marginBottom: 12,
  },
  consContainer: {},
  prosConsLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  proText: {
    color: '#10B981',
    fontSize: 12,
    marginBottom: 4,
  },
  conText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
  },
  processingContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  processingTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  processingMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  processingPercent: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
});
