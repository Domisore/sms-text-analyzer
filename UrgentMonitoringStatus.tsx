import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isBackgroundTaskRegistered } from './urgentMessageScanner';

interface UrgentMonitoringStatusProps {
  onPress?: () => void;
}

export const UrgentMonitoringStatus: React.FC<UrgentMonitoringStatusProps> = ({ onPress }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkMonitoringStatus();
    
    // Update last scan time periodically
    const interval = setInterval(() => {
      setLastScanTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isMonitoring]);

  const checkMonitoringStatus = async () => {
    const monitoring = await isBackgroundTaskRegistered();
    setIsMonitoring(monitoring);
    if (monitoring && !lastScanTime) {
      setLastScanTime(new Date());
    }
  };

  const handlePress = () => {
    setModalVisible(true);
    if (onPress) onPress();
  };

  const getTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getNextScanTime = (): string => {
    if (!lastScanTime) return 'Soon';
    
    const nextScan = new Date(lastScanTime.getTime() + 12 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = nextScan.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMins = Math.floor((diffMs % (60 * 60 * 1000)) / 60000);
    
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    if (diffMins > 0) return `${diffMins}m`;
    return 'Any moment';
  };

  const statusMessages = [
    'Monitoring for urgent messages...',
    'Scanning for bills and payments...',
    'Watching for prescription alerts...',
    'Checking for financial updates...',
    'Monitoring important messages...',
  ];

  const [currentMessage, setCurrentMessage] = useState(statusMessages[0]);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setCurrentMessage(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  if (!isMonitoring) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={styles.container}>
        <Animated.View
          style={[
            styles.glowContainer,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.glow} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.statusIndicator}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialCommunityIcons name="lightning-bolt" size={32} color="#F59E0B" />
                </Animated.View>
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Urgent Message Monitor</Text>
                <Text style={styles.modalStatus}>● Active</Text>
              </View>
            </View>

            <View style={styles.statusMessage}>
              <MaterialCommunityIcons name="radar" size={20} color="#10B981" />
              <Text style={styles.statusMessageText}>{currentMessage}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Last Scan</Text>
                <Text style={styles.statValue}>{getTimeAgo(lastScanTime)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Next Scan</Text>
                <Text style={styles.statValue}>{getNextScanTime()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Frequency</Text>
                <Text style={styles.statValue}>Every 12h</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#10B981" />
              <Text style={styles.infoText}>
                Your messages are automatically scanned for urgent keywords like bills, prescriptions, and financial alerts.
              </Text>
            </View>

            <View style={styles.keywordsList}>
              <Text style={styles.keywordsTitle}>Monitoring for:</Text>
              <View style={styles.keywordTags}>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Bills</Text>
                </View>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Payments</Text>
                </View>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Prescriptions</Text>
                </View>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Due Dates</Text>
                </View>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Urgent</Text>
                </View>
                <View style={styles.keywordTag}>
                  <Text style={styles.keywordTagText}>Action Required</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  statusIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  statusMessageText: {
    flex: 1,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#4B5563',
    marginHorizontal: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98110',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  keywordsList: {
    marginBottom: 20,
  },
  keywordsTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  keywordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordTag: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  keywordTagText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
