import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { proSystem, PRODUCTS } from './proSystem';

// Safely import IAP - may not be available in Expo Go
let RNIap: any = null;
try {
  RNIap = require('react-native-iap');
} catch (error) {
  console.log('[ProModal] IAP not available (Expo Go or dev mode)');
}

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
  onProUnlocked?: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ visible, onClose, onProUnlocked }) => {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);

  useEffect(() => {
    if (visible) {
      loadStatus();
      loadProducts();
    }
  }, [visible]);

  useEffect(() => {
    // Only set up listeners if IAP is available
    if (!RNIap) {
      return;
    }

    // Listen for purchase updates
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: any) => {
      console.log('[ProModal] Purchase updated:', purchase.productId);
      await proSystem.handlePurchase(purchase);
      loadStatus();
      
      if (purchase.productId === PRODUCTS.PRO_LIFETIME) {
        onProUnlocked?.();
        Alert.alert(
          '🎉 Welcome to Pro!',
          'Thank you for upgrading! All Pro features are now unlocked.',
          [{ text: 'Awesome!', onPress: onClose }]
        );
      } else if (purchase.productId.startsWith('donate_')) {
        Alert.alert(
          '❤️ Thank You!',
          'Your support means the world to us! Thank you for your generous donation.',
          [{ text: 'You\'re Welcome!' }]
        );
      }
    });

    const purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
      if (error.code !== 'E_USER_CANCELLED') {
        console.error('[ProModal] Purchase error:', error);
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, []);

  const loadStatus = () => {
    const status = proSystem.getStatus();
    setIsPro(status.isPro);
    setTotalDonated(status.totalDonated || 0);
  };

  const loadProducts = async () => {
    const prods = await proSystem.getProducts();
    setProducts(prods);
  };

  const handlePurchasePro = async () => {
    if (!RNIap) {
      Alert.alert(
        'Development Mode',
        'In-app purchases are not available in Expo Go.\n\nFor testing, use:\nproSystem.unlockProForTesting()\n\nOr build a production APK.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Unlock for Testing', 
            onPress: async () => {
              await proSystem.unlockProForTesting();
              loadStatus();
              onProUnlocked?.();
              Alert.alert('✅ Pro Unlocked!', 'Pro features enabled for testing.');
            }
          }
        ]
      );
      return;
    }

    setLoading(true);
    await proSystem.purchasePro();
    setLoading(false);
  };

  const handleDonate = async (productId: string) => {
    if (!RNIap) {
      Alert.alert(
        'Development Mode',
        'Donations are not available in Expo Go. Build a production APK to test payments.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    await proSystem.donate(productId);
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!RNIap) {
      Alert.alert(
        'Development Mode',
        'Restore is not available in Expo Go. Build a production APK to test.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    const restored = await proSystem.restorePurchases();
    setLoading(false);
    
    if (restored) {
      loadStatus();
      onProUnlocked?.();
      Alert.alert('✅ Restored!', 'Your Pro purchase has been restored.');
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
    }
  };

  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    return product?.localizedPrice || '$?.??';
  };

  const proFeatures = [
    { icon: 'folder-plus', title: 'Custom Categories', desc: 'Create unlimited custom categories' },
    { icon: 'filter-variant', title: 'Advanced Filtering', desc: 'Filter by date, sender, keywords' },
    { icon: 'receipt-text-check', title: 'Enhanced Bill Tracking', desc: 'Custom reminders & payment history' },
    { icon: 'palette', title: 'Themes & Customization', desc: 'Dark mode, colors, fonts' },
    { icon: 'chart-line', title: 'Analytics Dashboard', desc: 'Trends, charts, insights' },
    { icon: 'package-variant', title: 'Bulk Operations Pro', desc: 'Advanced bulk actions' },
    { icon: 'backup-restore', title: 'Backup & Restore', desc: 'Save your settings & data' },
    { icon: 'file-export', title: 'Export Enhancements', desc: 'PDF, date ranges, categories' },
  ];

  if (isPro) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>✨ Pro Member</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.proActiveCard}>
                <MaterialCommunityIcons name="crown" size={64} color="#F59E0B" />
                <Text style={styles.proActiveTitle}>You're a Pro Member!</Text>
                <Text style={styles.proActiveText}>
                  Thank you for supporting Textile SMS. All Pro features are unlocked.
                </Text>
              </View>

              {totalDonated > 0 && (
                <View style={styles.donationCard}>
                  <MaterialCommunityIcons name="heart" size={24} color="#EF4444" />
                  <Text style={styles.donationText}>
                    Total donated: ${totalDonated.toFixed(2)}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Support Development</Text>
              <Text style={styles.sectionDesc}>
                Love the app? Consider buying us a coffee! ☕
              </Text>

              <View style={styles.donateGrid}>
                <TouchableOpacity
                  style={styles.donateCard}
                  onPress={() => handleDonate(PRODUCTS.DONATE_COFFEE)}
                  disabled={loading}
                >
                  <Text style={styles.donateEmoji}>☕</Text>
                  <Text style={styles.donateTitle}>Coffee</Text>
                  <Text style={styles.donatePrice}>{getProductPrice(PRODUCTS.DONATE_COFFEE)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.donateCard}
                  onPress={() => handleDonate(PRODUCTS.DONATE_LUNCH)}
                  disabled={loading}
                >
                  <Text style={styles.donateEmoji}>🍔</Text>
                  <Text style={styles.donateTitle}>Lunch</Text>
                  <Text style={styles.donatePrice}>{getProductPrice(PRODUCTS.DONATE_LUNCH)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.donateCard}
                  onPress={() => handleDonate(PRODUCTS.DONATE_DINNER)}
                  disabled={loading}
                >
                  <Text style={styles.donateEmoji}>🍕</Text>
                  <Text style={styles.donateTitle}>Dinner</Text>
                  <Text style={styles.donatePrice}>{getProductPrice(PRODUCTS.DONATE_DINNER)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.donateCard}
                  onPress={() => handleDonate(PRODUCTS.DONATE_GENEROUS)}
                  disabled={loading}
                >
                  <Text style={styles.donateEmoji}>🎉</Text>
                  <Text style={styles.donateTitle}>Generous</Text>
                  <Text style={styles.donatePrice}>{getProductPrice(PRODUCTS.DONATE_GENEROUS)}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>✨ Upgrade to Pro</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.priceCard}>
              <MaterialCommunityIcons name="crown" size={48} color="#F59E0B" />
              <Text style={styles.priceTitle}>Textile SMS Pro</Text>
              <Text style={styles.priceAmount}>{getProductPrice(PRODUCTS.PRO_LIFETIME)}</Text>
              <Text style={styles.priceSubtitle}>One-time purchase • Lifetime access</Text>
            </View>

            <Text style={styles.featuresTitle}>Pro Features:</Text>
            <View style={styles.featuresList}>
              {proFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons name={feature.icon as any} size={24} color="#10B981" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
              onPress={handlePurchasePro}
              disabled={loading}
            >
              <MaterialCommunityIcons name="crown" size={24} color="#FFF" />
              <Text style={styles.purchaseButtonText}>
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={loading}
            >
              <Text style={styles.restoreButtonText}>Restore Previous Purchase</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#10B981" />
              <Text style={styles.infoText}>
                One-time purchase. No subscriptions. All future Pro features included.
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
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
  content: {
    padding: 20,
  },
  priceCard: {
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  priceTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  priceAmount: {
    color: '#F59E0B',
    fontSize: 48,
    fontWeight: '700',
    marginTop: 8,
  },
  priceSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  featuresTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#10B98110',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#10B981',
    fontSize: 12,
    lineHeight: 18,
  },
  proActiveCard: {
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
  },
  proActiveTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  proActiveText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  donationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444420',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  donationText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDesc: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  donateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  donateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  donateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  donateTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  donatePrice: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
