import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Modal,
  Animated,
  Share,
  Alert,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LedgerSheet } from './LedgerSheet';
import { importSMSBackup } from './importSMS';
import { importDeviceSMS } from './smsReader';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');
const db = SQLite.openDatabaseSync('textile.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS sms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT,
    sender TEXT,
    time INTEGER,
    thread_id TEXT,
    category TEXT
  );
`);

const categories = [
  { id: 'expired', title: 'Expired OTPs', color: '#EF4444', icon: 'clock-alert-outline' },
  { id: 'upcoming', title: 'Upcoming Bills', color: '#F59E0B', icon: 'calendar-clock' },
  { id: 'spam', title: 'Spam Messages', color: '#8B5CF6', icon: 'shield-alert-outline' },
  { id: 'social', title: 'Social Updates', color: '#10B981', icon: 'account-group-outline' },
];

export default function App() {
  const [counts, setCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-250));

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = () => {
    const newCounts = {};
    categories.forEach((cat) => {
      const result = db.getFirstSync(
        `SELECT COUNT(*) as count FROM sms WHERE category = ?;`,
        [cat.id]
      );
      newCounts[cat.id] = result?.count || 0;
    });
    setCounts(newCounts);
  };

  const toggleMenu = () => {
    const toValue = menuVisible ? -250 : 0;
    setMenuVisible(!menuVisible);
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleImport = async () => {
    toggleMenu();
    
    Alert.alert(
      'Import SMS Messages',
      'Choose how you want to import SMS messages:',
      [
        {
          text: 'From Device',
          onPress: async () => {
            try {
              const count = await importDeviceSMS();
              Alert.alert('Success', `Imported ${count} messages from device.`);
              loadCounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to import messages from device. Make sure you grant SMS permission.');
            }
          }
        },
        {
          text: 'From File',
          onPress: async () => {
            await importSMSBackup();
            loadCounts();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleShare = async () => {
    toggleMenu();

    try {
      const allMessages = db.getAllSync(`SELECT * FROM sms ORDER BY time DESC;`);

      if (allMessages.length === 0) {
        Alert.alert('No Data', 'No SMS messages to share. Import some messages first.');
        return;
      }

      const csvHeader = 'Category,Sender,Body,Time,Thread ID\n';
      const csvContent = allMessages
        .map((msg) => {
          const date = new Date(msg.time).toLocaleString();
          const body = `"${msg.body.replace(/"/g, '""')}"`;
          const sender = `"${msg.sender}"`;
          return `${msg.category},${sender},${body},${date},${msg.thread_id || ''}`;
        })
        .join('\n');

      const fullCsv = csvHeader + csvContent;
      const fileName = `textile_sms_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, fullCsv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share SMS Export',
        });
      } else {
        await Share.share({
          message: `Textile SMS Export\n\nTotal Messages: ${
            allMessages.length
          }\n\nCategories:\n${categories
            .map((cat) => `${cat.title}: ${counts[cat.id] || 0}`)
            .join('\n')}`,
          title: 'Textile SMS Summary',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share data. Please try again.');
      console.error('Share error:', error);
    }
  };

  const handleGoPro = () => {
    toggleMenu();
    Alert.alert(
      'Go Pro',
      'Upgrade to Textile SMS Pro for:\n\n• Advanced filtering options\n• Custom categories\n• Bulk operations\n• Cloud backup\n• Priority support',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Learn More', onPress: () => console.log('Go Pro pressed') },
      ]
    );
  };

  const handleSettings = () => {
    toggleMenu();
    Alert.alert(
      'Settings',
      'Settings panel coming soon!\n\nFeatures planned:\n• Auto-cleanup schedules\n• Custom categories\n• Export preferences\n• Theme options',
      [{ text: 'OK' }]
    );
  };

  const renderCategoryCard = ({ item }) => {
    const count = counts[item.id] || 0;
    const cardHeight = height * 0.25;

    return (
      <TouchableOpacity
        style={[styles.card, { height: cardHeight }]}
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[item.color, `${item.color}CC`]}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name={item.icon} size={32} color="#FFF" />
              <Text style={styles.cardCount}>{count}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardFooter}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (selectedCategory) {
    const category = categories.find((cat) => cat.id === selectedCategory);
    return (
      <LedgerSheet
        category={selectedCategory}
        title={category?.title || ''}
        color={category?.color || '#666'}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Textile SMS</Text>
        <TouchableOpacity 
          onPress={async () => {
            try {
              const count = await importDeviceSMS();
              Alert.alert('Synced', `Updated with ${count} messages from device.`);
              loadCounts();
            } catch (error) {
              Alert.alert('Sync Failed', 'Could not sync with device messages.');
            }
          }}
          style={styles.syncButton}
        >
          <MaterialCommunityIcons name="sync" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.dashboard}>
        <Text style={styles.dashboardTitle}>Message Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={toggleMenu}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleMenu}>
          <Animated.View
            style={[styles.slideMenu, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.menuHeader}>
                <MaterialCommunityIcons name="message-text" size={32} color="#10B981" />
                <Text style={styles.menuTitle}>Textile SMS</Text>
              </View>

              <View style={styles.menuItems}>
                <TouchableOpacity style={styles.menuItem} onPress={handleImport}>
                  <MaterialCommunityIcons name="import" size={24} color="#FFF" />
                  <Text style={styles.menuItemText}>Import SMS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                  <MaterialCommunityIcons name="share-variant" size={24} color="#FFF" />
                  <Text style={styles.menuItemText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleGoPro}>
                  <MaterialCommunityIcons name="crown" size={24} color="#F59E0B" />
                  <Text style={styles.menuItemText}>Go Pro</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
                  <MaterialCommunityIcons name="cog" size={24} color="#FFF" />
                  <Text style={styles.menuItemText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#111827',
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  syncButton: {
    padding: 4,
  },
  dashboard: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dashboardTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: (width - 48) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCount: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  slideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#1F2937',
    paddingTop: 60,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  menuTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});