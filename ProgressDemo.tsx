import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ImportProgressModal } from './ImportProgressModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Demo component to showcase all progress indicators
 * Add this to your app to test progress bars
 */
export const ProgressDemo: React.FC = () => {
  const [progress, setProgress] = useState({ visible: false, message: '', percent: 0 });

  const simulateImport = () => {
    setProgress({ visible: true, message: 'Opening file picker...', percent: 5 });

    const steps = [
      { percent: 15, message: 'Analyzing file...', delay: 500 },
      { percent: 30, message: 'Reading file contents...', delay: 1000 },
      { percent: 50, message: 'Parsing XML data...', delay: 1000 },
      { percent: 70, message: 'Processing messages...', delay: 1500 },
      { percent: 85, message: 'Saving to database...', delay: 1000 },
      { percent: 95, message: 'Finalizing import...', delay: 500 },
      { percent: 100, message: 'Import complete!', delay: 500 },
    ];

    let currentStep = 0;

    const runNextStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setTimeout(() => {
          setProgress({ visible: true, message: step.message, percent: step.percent });
          currentStep++;
          runNextStep();
        }, step.delay);
      } else {
        setTimeout(() => {
          setProgress({ visible: false, message: '', percent: 0 });
          Alert.alert('Demo Complete', 'Import simulation finished!');
        }, 1000);
      }
    };

    runNextStep();
  };

  const simulateChunkedImport = () => {
    setProgress({ visible: true, message: 'Starting chunked import...', percent: 0 });

    const totalChunks = 20;
    let currentChunk = 0;

    const processChunk = () => {
      if (currentChunk < totalChunks) {
        currentChunk++;
        const percent = (currentChunk / totalChunks) * 100;
        const processed = currentChunk * 1000;
        const total = totalChunks * 1000;

        setProgress({
          visible: true,
          message: `Processing chunk ${currentChunk}/${totalChunks}\n${processed}/${total} messages`,
          percent,
        });

        setTimeout(processChunk, 300);
      } else {
        setProgress({ visible: true, message: 'Import complete!', percent: 100 });
        setTimeout(() => {
          setProgress({ visible: false, message: '', percent: 0 });
          Alert.alert('Demo Complete', 'Chunked import simulation finished!');
        }, 1000);
      }
    };

    processChunk();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Bar Demo</Text>
      <Text style={styles.subtitle}>Test all progress indicators</Text>

      <TouchableOpacity style={styles.button} onPress={simulateImport}>
        <MaterialCommunityIcons name="file-import" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Simulate Standard Import</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={simulateChunkedImport}>
        <MaterialCommunityIcons name="file-multiple" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Simulate Chunked Import</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={20} color="#10B981" />
        <Text style={styles.infoText}>
          These demos show the progress bars in action. Watch the percentage and messages update in real-time!
        </Text>
      </View>

      <ImportProgressModal
        visible={progress.visible}
        message={progress.message}
        progress={progress.percent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  buttonSecondary: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
  },
});
