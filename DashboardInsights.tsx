import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from './database';

interface DashboardInsightsProps {
  onBillsPress: () => void;
  onQuickActionsPress: () => void;
}

export const DashboardInsights: React.FC<DashboardInsightsProps> = ({
  onBillsPress,
  onQuickActionsPress,
}) => {
  const [insights, setInsights] = useState({
    billsDueThisWeek: 0,
    expiredOTPs: 0,
    spamToday: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    loadInsights();
    // Refresh every minute
    const interval = setInterval(loadInsights, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadInsights = () => {
    // Bills due this week
    const weekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const billsDue = (
      db.getFirstSync(
        `SELECT COUNT(*) as count FROM sms WHERE category = 'upcoming' AND time <= ?;`,
        [weekFromNow]
      ) as any
    )?.count || 0;

    // Expired OTPs
    const expired = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms WHERE category = 'expired';`) as any
    )?.count || 0;

    // Spam today
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const spam = (
      db.getFirstSync(
        `SELECT COUNT(*) as count FROM sms WHERE category = 'spam' AND time >= ?;`,
        [todayStart]
      ) as any
    )?.count || 0;

    // Total messages
    const total = (
      db.getFirstSync(`SELECT COUNT(*) as count FROM sms;`) as any
    )?.count || 0;

    setInsights({
      billsDueThisWeek: billsDue,
      expiredOTPs: expired,
      spamToday: spam,
      totalMessages: total,
    });
  };

  if (insights.totalMessages === 0) {
    return null; // Don't show if no messages
  }

  const hasActionableItems =
    insights.billsDueThisWeek > 0 || insights.expiredOTPs > 0 || insights.spamToday > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Insights</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {/* Bills Due */}
        {insights.billsDueThisWeek > 0 && (
          <TouchableOpacity style={styles.insightCard} onPress={onBillsPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
              <MaterialCommunityIcons name="calendar-alert" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.insightValue}>{insights.billsDueThisWeek}</Text>
            <Text style={styles.insightLabel}>Bills Due This Week</Text>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Bills</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#F59E0B" />
            </View>
          </TouchableOpacity>
        )}

        {/* Expired OTPs */}
        {insights.expiredOTPs > 0 && (
          <TouchableOpacity
            style={styles.insightCard}
            onPress={onQuickActionsPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.insightValue}>{insights.expiredOTPs}</Text>
            <Text style={styles.insightLabel}>Expired OTPs</Text>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Clean Up</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#EF4444" />
            </View>
          </TouchableOpacity>
        )}

        {/* Spam Today */}
        {insights.spamToday > 0 && (
          <TouchableOpacity
            style={styles.insightCard}
            onPress={onQuickActionsPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
              <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.insightValue}>{insights.spamToday}</Text>
            <Text style={styles.insightLabel}>Spam Today</Text>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Remove</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#8B5CF6" />
            </View>
          </TouchableOpacity>
        )}

        {/* All Good */}
        {!hasActionableItems && (
          <View style={[styles.insightCard, styles.allGoodCard]}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.insightValue}>✓</Text>
            <Text style={styles.insightLabel}>All Caught Up!</Text>
            <Text style={styles.allGoodText}>No urgent actions needed</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Action Buttons */}
      <View style={styles.quickButtons}>
        <TouchableOpacity style={styles.quickButton} onPress={onBillsPress}>
          <MaterialCommunityIcons name="receipt-text" size={20} color="#F59E0B" />
          <Text style={styles.quickButtonText}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={onQuickActionsPress}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#10B981" />
          <Text style={styles.quickButtonText}>Clean Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    width: 160,
    marginRight: 12,
  },
  allGoodCard: {
    width: 200,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  allGoodText: {
    color: '#10B981',
    fontSize: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  quickButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
