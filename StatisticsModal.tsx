import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from './database';

interface StatisticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ visible, onClose }) => {
  const [stats, setStats] = useState({
    total: 0,
    expired: 0,
    upcoming: 0,
    spam: 0,
    social: 0,
    topSenders: [] as { sender: string; count: number }[],
    recentImport: '',
  });

  useEffect(() => {
    if (visible) {
      loadStatistics();
    }
  }, [visible]);

  const loadStatistics = () => {
    try {
      const total = (db.getFirstSync(`SELECT COUNT(*) as count FROM sms;`) as any)?.count || 0;
    const expired = (db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'expired';`) as any)?.count || 0;
    const upcoming = (db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'upcoming';`) as any)?.count || 0;
    const spam = (db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'spam';`) as any)?.count || 0;
    const social = (db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'social';`) as any)?.count || 0;
    
    const topSenders = db.getAllSync(
      `SELECT sender, COUNT(*) as count FROM sms GROUP BY sender ORDER BY count DESC LIMIT 5;`
    ) as { sender: string; count: number }[];
    
    const mostRecent = db.getFirstSync(
      `SELECT MAX(time) as latest FROM sms;`
    ) as { latest: number } | null;
    
    const recentImport = mostRecent?.latest 
      ? new Date(mostRecent.latest).toLocaleDateString()
      : 'No messages yet';

      setStats({
        total,
        expired,
        upcoming,
        spam,
        social,
        topSenders,
        recentImport,
      });
    } catch (error) {
      console.error('[Statistics] Error loading statistics:', error);
      setStats({
        total: 0,
        expired: 0,
        upcoming: 0,
        spam: 0,
        social: 0,
        topSenders: [],
        recentImport: 'Error loading data',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 Statistics</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="message-text" size={32} color="#10B981" />
                <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Messages</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoryGrid}>
                <View style={[styles.categoryCard, { backgroundColor: '#EF444420' }]}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#EF4444" />
                  <Text style={styles.categoryValue}>{stats.expired}</Text>
                  <Text style={styles.categoryLabel}>Expired OTPs</Text>
                </View>
                <View style={[styles.categoryCard, { backgroundColor: '#F59E0B20' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#F59E0B" />
                  <Text style={styles.categoryValue}>{stats.upcoming}</Text>
                  <Text style={styles.categoryLabel}>Bills</Text>
                </View>
                <View style={[styles.categoryCard, { backgroundColor: '#8B5CF620' }]}>
                  <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#8B5CF6" />
                  <Text style={styles.categoryValue}>{stats.spam}</Text>
                  <Text style={styles.categoryLabel}>Spam</Text>
                </View>
                <View style={[styles.categoryCard, { backgroundColor: '#10B98120' }]}>
                  <MaterialCommunityIcons name="account-group-outline" size={24} color="#10B981" />
                  <Text style={styles.categoryValue}>{stats.social}</Text>
                  <Text style={styles.categoryLabel}>Social</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Senders</Text>
              {stats.topSenders.length > 0 ? (
                stats.topSenders.map((sender, index) => (
                  <View key={index} style={styles.senderRow}>
                    <Text style={styles.senderRank}>#{index + 1}</Text>
                    <Text style={styles.senderName} numberOfLines={1}>
                      {sender.sender || 'Unknown'}
                    </Text>
                    <Text style={styles.senderCount}>{sender.count}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No messages imported yet</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Import</Text>
              <Text style={styles.infoText}>{stats.recentImport}</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  categoryValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  categoryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  senderRank: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
    width: 40,
  },
  senderName: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
    marginHorizontal: 12,
  },
  senderCount: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    color: '#FFF',
    fontSize: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});
