import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { db } from './database';

type TimeRange = 'all' | '7days' | '30days' | '90days';

export const LedgerSheet = ({ category, title, color, onBack }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [ageFilter, setAgeFilter] = useState(5); // minutes (for cleanup modal)
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [showCleanup, setShowCleanup] = useState(false);
  const [showTimeRangeMenu, setShowTimeRangeMenu] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [timeRange]);

  const loadMessages = () => {
    let query = `SELECT * FROM sms WHERE category = ?`;
    const params: any[] = [category];

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = Date.now();
      let minTime = 0;
      
      switch (timeRange) {
        case '7days':
          minTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          minTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          minTime = now - (90 * 24 * 60 * 60 * 1000);
          break;
      }
      
      query += ` AND time >= ?`;
      params.push(minTime);
    }

    query += ` ORDER BY time DESC;`;
    const rows = db.getAllSync(query, params);
    setMessages(rows);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      default: return 'All time';
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === messages.length) {
      setSelected([]);
    } else {
      setSelected(messages.map(m => m.id));
    }
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;

    // Delete selected messages from database
    db.withTransactionSync(() => {
      selected.forEach(id => {
        db.runSync(`DELETE FROM sms WHERE id = ?;`, [id]);
      });
    });

    // Reload messages and clear selection
    loadMessages();
    setSelected([]);
    setShowCleanup(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="message-outline" size={64} color="#4B5563" />
      <Text style={styles.emptyTitle}>No {title.toLowerCase()} messages</Text>
      <Text style={styles.emptySubtitle}>
        {timeRange === 'all' 
          ? 'No messages found in this category'
          : `No messages found in the ${getTimeRangeLabel().toLowerCase()}`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{title} ({messages.length})</Text>
      </View>

      {/* Time Range Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Time Range:</Text>
        <TouchableOpacity 
          style={styles.filterDropdown}
          onPress={() => setShowTimeRangeMenu(true)}
        >
          <Text style={styles.filterDropdownText}>{getTimeRangeLabel()}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {messages.length > 0 && (
        <View style={styles.selectAllContainer}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
            <MaterialCommunityIcons 
              name={selected.length === messages.length ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={20} 
              color={color} 
            />
            <Text style={styles.selectAllText}>
              {selected.length === messages.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selected.length} of {messages.length} selected
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => toggleSelect(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
            </View>
            <MaterialCommunityIcons
              name={selected.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color={selected.includes(item.id) ? color : "#666"}
            />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.cleanupBtn, { backgroundColor: color }]}
        onPress={() => setShowCleanup(true)}
      >
        <Text style={styles.cleanupText}>Clean Up ({selected.length})</Text>
      </TouchableOpacity>

      {/* Time Range Selection Modal */}
      <Modal visible={showTimeRangeMenu} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTimeRangeMenu(false)}
        >
          <View style={styles.timeRangeMenu}>
            <Text style={styles.timeRangeMenuTitle}>Select Time Range</Text>
            
            <TouchableOpacity
              style={[styles.timeRangeOption, timeRange === 'all' && styles.timeRangeOptionActive]}
              onPress={() => {
                setTimeRange('all');
                setShowTimeRangeMenu(false);
              }}
            >
              <MaterialCommunityIcons 
                name={timeRange === 'all' ? "radiobox-marked" : "radiobox-blank"} 
                size={24} 
                color={timeRange === 'all' ? color : "#9CA3AF"} 
              />
              <Text style={styles.timeRangeOptionText}>All time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeRangeOption, timeRange === '7days' && styles.timeRangeOptionActive]}
              onPress={() => {
                setTimeRange('7days');
                setShowTimeRangeMenu(false);
              }}
            >
              <MaterialCommunityIcons 
                name={timeRange === '7days' ? "radiobox-marked" : "radiobox-blank"} 
                size={24} 
                color={timeRange === '7days' ? color : "#9CA3AF"} 
              />
              <Text style={styles.timeRangeOptionText}>Last 7 days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeRangeOption, timeRange === '30days' && styles.timeRangeOptionActive]}
              onPress={() => {
                setTimeRange('30days');
                setShowTimeRangeMenu(false);
              }}
            >
              <MaterialCommunityIcons 
                name={timeRange === '30days' ? "radiobox-marked" : "radiobox-blank"} 
                size={24} 
                color={timeRange === '30days' ? color : "#9CA3AF"} 
              />
              <Text style={styles.timeRangeOptionText}>Last 30 days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeRangeOption, timeRange === '90days' && styles.timeRangeOptionActive]}
              onPress={() => {
                setTimeRange('90days');
                setShowTimeRangeMenu(false);
              }}
            >
              <MaterialCommunityIcons 
                name={timeRange === '90days' ? "radiobox-marked" : "radiobox-blank"} 
                size={24} 
                color={timeRange === '90days' ? color : "#9CA3AF"} 
              />
              <Text style={styles.timeRangeOptionText}>Last 90 days</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cleanup Modal */}
      <Modal visible={showCleanup} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clean Up {title}</Text>
            <Text style={styles.modalSubtitle}>Older than:</Text>
            <Slider
              minimumValue={5}
              maximumValue={10080}
              step={1}
              value={ageFilter}
              onValueChange={setAgeFilter}
              style={{ width: '100%' }}
            />
            <Text style={styles.sliderLabel}>
              {ageFilter < 60 ? `${ageFilter}m` : ageFilter < 1440 ? `${Math.round(ageFilter/60)}h` : `${Math.round(ageFilter/1440)}d`}
            </Text>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: color }]} 
              onPress={deleteSelected}
              disabled={selected.length === 0}
            >
              <Text style={styles.actionText}>
                Delete {selected.length} Message{selected.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCleanup(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '600', marginLeft: 16 },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterDropdownText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRangeMenu: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  timeRangeMenuTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeRangeOptionActive: {
    backgroundColor: '#374151',
  },
  timeRangeOptionText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
  },
  selectAllContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8
  },
  selectAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  selectAllText: { 
    color: '#FFF', 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  selectedCount: { 
    color: '#9CA3AF', 
    fontSize: 14 
  },
  item: { backgroundColor: '#1F2937', marginHorizontal: 16, marginVertical: 4, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sender: { color: '#FFF', fontWeight: '600' },
  body: { color: '#9CA3AF', marginTop: 2 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20
  },
  cleanupBtn: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  cleanupText: { color: '#FFF', fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { color: '#9CA3AF', marginTop: 16, textAlign: 'center' },
  sliderLabel: { color: '#FFF', textAlign: 'center', marginVertical: 8 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  actionText: { color: '#FFF', fontWeight: '700' },
  cancelBtn: { marginTop: 8, alignItems: 'center' },
  cancelText: { color: '#9CA3AF' },
});