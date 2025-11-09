import React, { useState, useEffect } from 'react';
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
import { db } from './database';

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const [counts, setCounts] = useState({
    expired: 0,
    spam: 0,
    old: 0,
  });

  useEffect(() => {
    if (visible) {
      loadCounts();
    }
  }, [visible]);

  const loadCounts = () => {
    const expired = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'expired';`) as any
    )?.count || 0;

    const spam = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'spam';`) as any
    )?.count || 0;

    // Messages older than 90 days
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const old = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE time < ?;`, [ninetyDaysAgo]) as any
    )?.count || 0;

    setCounts({ expired, spam, old });
  };

  const deleteExpiredOTPs = () => {
    if (counts.expired === 0) {
      Alert.alert('No OTPs', 'No expired OTPs to delete.');
      return;
    }

    Alert.alert(
      'Delete Expired OTPs',
      `Delete ${counts.expired} expired OTP messages? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            db.runSync(`DELETE FROM sms WHERE category = 'expired';`);
            
            // Log action
            db.runSync(
              `INSERT INTO action_history (action_type, items_affected, timestamp, details) VALUES (?, ?, ?, ?);`,
              ['delete_expired', counts.expired, Date.now(), 'Deleted expired OTP messages']
            );

            Alert.alert('Success', `Deleted ${counts.expired} expired OTP messages.`);
            loadCounts();
            onUpdate();
          },
        },
      ]
    );
  };

  const deleteSpam = () => {
    if (counts.spam === 0) {
      Alert.alert('No Spam', 'No spam messages to delete.');
      return;
    }

    Alert.alert(
      'Delete Spam Messages',
      `Delete ${counts.spam} spam messages? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            db.runSync(`DELETE FROM sms WHERE category = 'spam';`);
            
            // Log action
            db.runSync(
              `INSERT INTO action_history (action_type, items_affected, timestamp, details) VALUES (?, ?, ?, ?);`,
              ['delete_spam', counts.spam, Date.now(), 'Deleted spam messages']
            );

            Alert.alert('Success', `Deleted ${counts.spam} spam messages.`);
            loadCounts();
            onUpdate();
          },
        },
      ]
    );
  };

  const deleteOldMessages = () => {
    if (counts.old === 0) {
      Alert.alert('No Old Messages', 'No messages older than 90 days.');
      return;
    }

    Alert.alert(
      'Delete Old Messages',
      `Delete ${counts.old} messages older than 90 days? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
            db.runSync(`DELETE FROM sms WHERE time < ?;`, [ninetyDaysAgo]);
            
            // Log action
            db.runSync(
              `INSERT INTO action_history (action_type, items_affected, timestamp, details) VALUES (?, ?, ?, ?);`,
              ['delete_old', counts.old, Date.now(), 'Deleted messages older than 90 days']
            );

            Alert.alert('Success', `Deleted ${counts.old} old messages.`);
            loadCounts();
            onUpdate();
          },
        },
      ]
    );
  };

  const clearAllMessages = () => {
    const total = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms;`) as any
    )?.count || 0;

    if (total === 0) {
      Alert.alert('No Messages', 'No messages to delete.');
      return;
    }

    Alert.alert(
      '⚠️ Clear All Data',
      `Delete ALL ${total} messages? This will permanently delete everything and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            db.runSync(`DELETE FROM sms;`);
            db.runSync(`DELETE FROM bills;`);
            
            // Log action
            db.runSync(
              `INSERT INTO action_history (action_type, items_affected, timestamp, details) VALUES (?, ?, ?, ?);`,
              ['clear_all', total, Date.now(), 'Cleared all messages']
            );

            Alert.alert('Success', 'All messages deleted.');
            loadCounts();
            onUpdate();
            onClose();
          },
        },
      ]
    );
  };

  const actions = [
    {
      id: 'expired',
      title: 'Delete Expired OTPs',
      description: 'Remove old verification codes',
      icon: 'clock-alert-outline',
      color: '#EF4444',
      count: counts.expired,
      action: deleteExpiredOTPs,
    },
    {
      id: 'spam',
      title: 'Delete Spam',
      description: 'Remove promotional messages',
      icon: 'shield-alert-outline',
      color: '#8B5CF6',
      count: counts.spam,
      action: deleteSpam,
    },
    {
      id: 'old',
      title: 'Delete Old Messages',
      description: 'Remove messages older than 90 days',
      icon: 'calendar-remove',
      color: '#F59E0B',
      count: counts.old,
      action: deleteOldMessages,
    },
    {
      id: 'all',
      title: 'Clear All Data',
      description: 'Delete everything (use with caution)',
      icon: 'delete-forever',
      color: '#EF4444',
      count: null,
      action: clearAllMessages,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>⚡ Quick Actions</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Clean up your messages with one tap</Text>

            {actions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionCard}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${item.color}20` }]}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionDescription}>{item.description}</Text>
                </View>
                {item.count !== null && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionCount}>{item.count}</Text>
                  </View>
                )}
                <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Deleted messages cannot be recovered. Export your data before cleaning up.
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  actionBadge: {
    backgroundColor: '#10B98120',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  actionCount: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 18,
  },
});
