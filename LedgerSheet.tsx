import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Linking } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const db = SQLite.openDatabaseSync('textile.db');

export const LedgerSheet = ({ category, title, color, onBack }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [ageFilter, setAgeFilter] = useState(5); // minutes
  const [showCleanup, setShowCleanup] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [ageFilter]);

  const loadMessages = () => {
    const minTime = Date.now() - (ageFilter * 60000);
    const rows = db.getAllSync(
      `SELECT * FROM sms WHERE category = ? AND time < ? ORDER BY time DESC;`,
      [category, minTime]
    );
    setMessages(rows);
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

  const openInMessages = () => {
    const selectedMsgs = messages.filter(m => selected.includes(m.id));
    if (selectedMsgs.length === 0) return;

    const urls = selectedMsgs
      .map(m => m.thread_id ? `sms:${m.thread_id}` : `sms:${encodeURIComponent(m.sender)}`)
      .join('&');

    Linking.openURL(urls);
    setSelected([]);
    setShowCleanup(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="message-outline" size={64} color="#4B5563" />
      <Text style={styles.emptyTitle}>No {title.toLowerCase()} messages</Text>
      <Text style={styles.emptySubtitle}>
        {ageFilter < 60 
          ? `No messages found older than ${ageFilter} minutes`
          : ageFilter < 1440 
          ? `No messages found older than ${Math.round(ageFilter/60)} hours`
          : `No messages found older than ${Math.round(ageFilter/1440)} days`
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
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={openInMessages}>
              <Text style={styles.actionText}>Open in Messages</Text>
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