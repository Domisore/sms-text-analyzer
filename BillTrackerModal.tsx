import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from './database';

interface Bill {
  id: number;
  sender: string;
  amount: number;
  due_date: number;
  bill_type: string;
  status: string;
  body: string;
}

interface BillTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BillTrackerModal: React.FC<BillTrackerModalProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    if (visible) {
      loadBills();
    }
  }, [visible, filter]);

  const loadBills = () => {
    try {
      // Get bills from upcoming category
      const upcomingMessages = db.getAllSync(
        `SELECT * FROM sms WHERE category = 'upcoming' ORDER BY time DESC LIMIT 50;`
      ) as any[];

    // Extract bill information
    const extractedBills = upcomingMessages.map((msg) => {
      const amount = extractAmount(msg.body);
      const dueDate = extractDueDate(msg.body) || msg.time;
      const billType = extractBillType(msg.body, msg.sender);

      return {
        id: msg.id,
        sender: msg.sender,
        amount,
        due_date: dueDate,
        bill_type: billType,
        status: 'unpaid',
        body: msg.body,
      };
    });

      // Filter based on selection
      const filtered =
        filter === 'all'
          ? extractedBills
          : extractedBills.filter((b) => b.status === filter);

      setBills(filtered);
    } catch (error) {
      console.error('[BillTracker] Error loading bills:', error);
      setBills([]);
    }
  };

  const extractAmount = (body: string): number => {
    // Match patterns like Rs 500, $100, ₹1,234, etc.
    const patterns = [
      /(?:rs|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:amount|total|due).*?(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return 0;
  };

  const extractDueDate = (body: string): number | null => {
    // Try to extract due date from message
    const datePattern = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
    const match = body.match(datePattern);

    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
      return new Date(year, month, day).getTime();
    }

    return null;
  };

  const extractBillType = (body: string, sender: string): string => {
    const types = {
      electricity: /electricity|power|energy/i,
      water: /water|municipal/i,
      gas: /gas|lpg/i,
      internet: /internet|broadband|wifi/i,
      mobile: /mobile|phone|airtel|jio|vodafone/i,
      credit: /credit card|card payment/i,
      loan: /loan|emi/i,
      insurance: /insurance|policy/i,
    };

    const combined = `${body} ${sender}`.toLowerCase();

    for (const [type, pattern] of Object.entries(types)) {
      if (pattern.test(combined)) {
        return type;
      }
    }

    return 'other';
  };

  const markAsPaid = (billId: number) => {
    Alert.alert('Mark as Paid', 'Confirm this bill has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Paid',
        onPress: () => {
          // In a real app, update bills table
          // For now, just remove from list
          setBills(bills.filter((b) => b.id !== billId));
          onUpdate();
          Alert.alert('Success', 'Bill marked as paid!');
        },
      },
    ]);
  };

  const getTotalUnpaid = () => {
    return bills
      .filter((b) => b.status === 'unpaid')
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getBillIcon = (type: string) => {
    const icons: Record<string, string> = {
      electricity: 'lightning-bolt',
      water: 'water',
      gas: 'fire',
      internet: 'wifi',
      mobile: 'cellphone',
      credit: 'credit-card',
      loan: 'bank',
      insurance: 'shield-check',
      other: 'receipt',
    };
    return icons[type] || 'receipt';
  };

  const getDaysUntilDue = (dueDate: number) => {
    const days = Math.ceil((dueDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>💰 Bill Tracker</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Unpaid</Text>
              <Text style={styles.summaryValue}>₹{getTotalUnpaid().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Bills Due</Text>
              <Text style={styles.summaryValue}>{bills.filter((b) => b.status === 'unpaid').length}</Text>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'unpaid' && styles.filterButtonActive]}
              onPress={() => setFilter('unpaid')}
            >
              <Text style={[styles.filterText, filter === 'unpaid' && styles.filterTextActive]}>
                Unpaid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'paid' && styles.filterButtonActive]}
              onPress={() => setFilter('paid')}
            >
              <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>
                Paid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {bills.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#374151" />
                <Text style={styles.emptyText}>No bills found</Text>
                <Text style={styles.emptySubtext}>
                  Import messages to track your bills
                </Text>
              </View>
            ) : (
              bills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.due_date);
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

                return (
                  <View key={bill.id} style={styles.billCard}>
                    <View style={styles.billHeader}>
                      <View style={styles.billIconContainer}>
                        <MaterialCommunityIcons
                          name={getBillIcon(bill.bill_type)}
                          size={24}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={styles.billInfo}>
                        <Text style={styles.billSender} numberOfLines={1}>
                          {bill.sender}
                        </Text>
                        <Text style={styles.billType}>{bill.bill_type}</Text>
                      </View>
                      <View style={styles.billAmount}>
                        <Text style={styles.billAmountText}>
                          ₹{bill.amount > 0 ? bill.amount.toFixed(2) : '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.billDetails}>
                      <View style={styles.billDueDate}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={16}
                          color={isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : '#9CA3AF'}
                        />
                        <Text
                          style={[
                            styles.billDueDateText,
                            isOverdue && styles.overdue,
                            isDueSoon && styles.dueSoon,
                          ]}
                        >
                          {isOverdue
                            ? `Overdue by ${Math.abs(daysUntil)} days`
                            : isDueSoon
                            ? `Due in ${daysUntil} days`
                            : new Date(bill.due_date).toLocaleDateString()}
                        </Text>
                      </View>

                      {bill.status === 'unpaid' && (
                        <TouchableOpacity
                          style={styles.markPaidButton}
                          onPress={() => markAsPaid(bill.id)}
                        >
                          <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                          <Text style={styles.markPaidText}>Mark Paid</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.billBody} numberOfLines={2}>
                      {bill.body}
                    </Text>
                  </View>
                );
              })
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  summary: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#F59E0B',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  billCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billSender: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  billType: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  billAmountText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '700',
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billDueDateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  dueSoon: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#10B98120',
  },
  markPaidText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  billBody: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
});
