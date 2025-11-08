import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Share,
    Dimensions,
    Modal,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function App() {
    const [showMenu, setShowMenu] = useState(false);
    const [metrics] = useState({
        expired: 5,
        upcoming: 3,
        spam: 12,
        social: 8,
    });

    const handleImport = () => {
        setShowMenu(false);
        Alert.alert('Import', 'Import functionality will be available soon!');
    };

    const handleShare = async () => {
        setShowMenu(false);
        const msg = `Textile Report - Expired: ${metrics.expired}, Upcoming: ${metrics.upcoming}, Spam: ${metrics.spam}, Social: ${metrics.social}`;
        await Share.share({ message: msg });
    };

    const handleGoPro = () => {
        setShowMenu(false);
        Linking.openURL('https://pro.textilesms.app');
    };

    const handleSettings = () => {
        setShowMenu(false);
        Alert.alert('Settings', 'Settings functionality coming soon!');
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
                        <MaterialCommunityIcons name="menu" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <MaterialCommunityIcons name="message-text" size={36} color="#FFF" />
                        <Text style={styles.title}>Textile</Text>
                        <Text style={styles.subtitle}>SMS Inbox Insights</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scroll}>
                <View style={styles.grid}>
                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#EF4444' }]} onPress={() => Alert.alert('Expired', 'Expired 2FA messages')}>
                        <MaterialCommunityIcons name="clock-remove" size={28} color="#EF4444" />
                        <Text style={styles.cardValue}>{metrics.expired}</Text>
                        <Text style={styles.cardTitle}>Expired</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#8B5CF6' }]} onPress={() => Alert.alert('Upcoming', 'Upcoming messages')}>
                        <MaterialCommunityIcons name="calendar-clock" size={28} color="#8B5CF6" />
                        <Text style={styles.cardValue}>{metrics.upcoming}</Text>
                        <Text style={styles.cardTitle}>Upcoming</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#6B7280' }]} onPress={() => Alert.alert('Spam', 'Spam messages')}>
                        <MaterialCommunityIcons name="message-alert" size={28} color="#6B7280" />
                        <Text style={styles.cardValue}>{metrics.spam}</Text>
                        <Text style={styles.cardTitle}>Spam</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#10B981' }]} onPress={() => Alert.alert('Social', 'Social messages')}>
                        <MaterialCommunityIcons name="account-group" size={28} color="#10B981" />
                        <Text style={styles.cardValue}>{metrics.social}</Text>
                        <Text style={styles.cardTitle}>Social</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Menu</Text>
                            <TouchableOpacity onPress={() => setShowMenu(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.menuItem} onPress={handleImport}>
                            <MaterialCommunityIcons name="import" size={24} color="#FBBF24" />
                            <View style={styles.menuItemContent}>
                                <Text style={styles.menuItemTitle}>Import SMS Backup</Text>
                                <Text style={styles.menuItemSubtitle}>Unlock full inbox history</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                            <MaterialCommunityIcons name="share" size={24} color="#3B82F6" />
                            <View style={styles.menuItemContent}>
                                <Text style={styles.menuItemTitle}>Share Report</Text>
                                <Text style={styles.menuItemSubtitle}>Export your SMS analysis</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleGoPro}>
                            <MaterialCommunityIcons name="crown" size={24} color="#6366F1" />
                            <View style={styles.menuItemContent}>
                                <Text style={styles.menuItemTitle}>Go Pro</Text>
                                <Text style={styles.menuItemSubtitle}>Want auto-clean? Upgrade now</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
                            <MaterialCommunityIcons name="cog" size={24} color="#9CA3AF" />
                            <View style={styles.menuItemContent}>
                                <Text style={styles.menuItemTitle}>Settings</Text>
                                <Text style={styles.menuItemSubtitle}>App preferences</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { paddingTop: 60, paddingBottom: 30 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    menuButton: { padding: 4 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 36 },
    title: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    subtitle: { fontSize: 14, color: '#E0E7FF' },
    scroll: { flex: 1, paddingHorizontal: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
    card: { backgroundColor: '#1F2937', width: (width - 50) / 2, padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5 },
    cardValue: { fontSize: 36, fontWeight: '700', color: '#FFF', marginTop: 4 },
    cardTitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-start' },
    menuContainer: { backgroundColor: '#1F2937', marginTop: 60, marginLeft: 0, width: width * 0.8, maxWidth: 300, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
    menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#374151' },
    menuTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    menuItemContent: { marginLeft: 16, flex: 1 },
    menuItemTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    menuItemSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: '#374151', marginVertical: 8, marginHorizontal: 20 },
});
