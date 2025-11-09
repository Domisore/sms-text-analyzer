import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';

// Product IDs
export const PRODUCTS = {
  PRO_LIFETIME: 'textile_pro_lifetime',
  DONATE_COFFEE: 'donate_coffee',
  DONATE_LUNCH: 'donate_lunch',
  DONATE_DINNER: 'donate_dinner',
  DONATE_GENEROUS: 'donate_generous',
};

const STORAGE_KEY = '@textile_pro_status';

interface ProStatus {
  isPro: boolean;
  purchaseDate?: number;
  productId?: string;
  totalDonated?: number;
}

class ProSystem {
  private status: ProStatus = { isPro: false, totalDonated: 0 };
  private initialized = false;

  /**
   * Initialize the IAP system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[ProSystem] Initializing...');
      
      // Load saved status
      await this.loadStatus();

      // Initialize IAP
      if (Platform.OS === 'android') {
        await RNIap.initConnection();
        console.log('[ProSystem] IAP connection initialized');

        // Get available products
        const products = await RNIap.getProducts({
          skus: Object.values(PRODUCTS),
        });
        console.log('[ProSystem] Available products:', products.length);

        // Check for existing purchases
        await this.restorePurchases();
      }

      this.initialized = true;
      console.log('[ProSystem] Initialization complete');
    } catch (error) {
      console.error('[ProSystem] Initialization failed:', error);
      // Continue anyway - app should work without IAP
    }
  }

  /**
   * Load pro status from storage
   */
  private async loadStatus(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.status = JSON.parse(saved);
        console.log('[ProSystem] Loaded status:', this.status);
      }
    } catch (error) {
      console.error('[ProSystem] Failed to load status:', error);
    }
  }

  /**
   * Save pro status to storage
   */
  private async saveStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.status));
      console.log('[ProSystem] Status saved');
    } catch (error) {
      console.error('[ProSystem] Failed to save status:', error);
    }
  }

  /**
   * Check if user has Pro
   */
  isPro(): boolean {
    return this.status.isPro;
  }

  /**
   * Get pro status details
   */
  getStatus(): ProStatus {
    return { ...this.status };
  }

  /**
   * Purchase Pro
   */
  async purchasePro(): Promise<boolean> {
    try {
      console.log('[ProSystem] Starting Pro purchase...');

      if (Platform.OS !== 'android') {
        console.log('[ProSystem] IAP only available on Android');
        return false;
      }

      // Request purchase
      await RNIap.requestPurchase({
        sku: PRODUCTS.PRO_LIFETIME,
      });

      // Purchase listener will handle the rest
      return true;
    } catch (error: any) {
      console.error('[ProSystem] Purchase failed:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        console.log('[ProSystem] User cancelled purchase');
      }
      
      return false;
    }
  }

  /**
   * Donate/Tip
   */
  async donate(productId: string): Promise<boolean> {
    try {
      console.log('[ProSystem] Starting donation:', productId);

      if (Platform.OS !== 'android') {
        console.log('[ProSystem] IAP only available on Android');
        return false;
      }

      // Request purchase
      await RNIap.requestPurchase({
        sku: productId,
      });

      return true;
    } catch (error: any) {
      console.error('[ProSystem] Donation failed:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        console.log('[ProSystem] User cancelled donation');
      }
      
      return false;
    }
  }

  /**
   * Handle purchase update
   */
  async handlePurchase(purchase: RNIap.Purchase): Promise<void> {
    try {
      console.log('[ProSystem] Processing purchase:', purchase.productId);

      // Verify purchase (in production, verify with backend)
      const isValid = await this.verifyPurchase(purchase);
      
      if (!isValid) {
        console.error('[ProSystem] Purchase verification failed');
        return;
      }

      // Handle Pro purchase
      if (purchase.productId === PRODUCTS.PRO_LIFETIME) {
        this.status.isPro = true;
        this.status.purchaseDate = Date.now();
        this.status.productId = purchase.productId;
        await this.saveStatus();
        console.log('[ProSystem] Pro unlocked!');
      }

      // Handle donations
      if (purchase.productId.startsWith('donate_')) {
        const amounts: Record<string, number> = {
          [PRODUCTS.DONATE_COFFEE]: 0.99,
          [PRODUCTS.DONATE_LUNCH]: 2.99,
          [PRODUCTS.DONATE_DINNER]: 4.99,
          [PRODUCTS.DONATE_GENEROUS]: 9.99,
        };
        
        const amount = amounts[purchase.productId] || 0;
        this.status.totalDonated = (this.status.totalDonated || 0) + amount;
        await this.saveStatus();
        console.log('[ProSystem] Donation recorded:', amount);
      }

      // Acknowledge purchase
      if (Platform.OS === 'android') {
        await RNIap.acknowledgePurchaseAndroid({
          token: purchase.purchaseToken!,
        });
        console.log('[ProSystem] Purchase acknowledged');
      }

      // Finish transaction
      await RNIap.finishTransaction({ purchase });
      console.log('[ProSystem] Transaction finished');

    } catch (error) {
      console.error('[ProSystem] Failed to handle purchase:', error);
    }
  }

  /**
   * Verify purchase (basic client-side verification)
   * In production, verify with your backend server
   */
  private async verifyPurchase(purchase: RNIap.Purchase): Promise<boolean> {
    try {
      // Basic checks
      if (!purchase.transactionReceipt) {
        return false;
      }

      // In production, send to backend for verification
      // For now, accept all purchases
      return true;
    } catch (error) {
      console.error('[ProSystem] Verification error:', error);
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      console.log('[ProSystem] Restoring purchases...');

      if (Platform.OS !== 'android') {
        return false;
      }

      const purchases = await RNIap.getAvailablePurchases();
      console.log('[ProSystem] Found purchases:', purchases.length);

      for (const purchase of purchases) {
        if (purchase.productId === PRODUCTS.PRO_LIFETIME) {
          this.status.isPro = true;
          this.status.purchaseDate = purchase.transactionDate;
          this.status.productId = purchase.productId;
          await this.saveStatus();
          console.log('[ProSystem] Pro restored!');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[ProSystem] Restore failed:', error);
      return false;
    }
  }

  /**
   * Get available products with prices
   */
  async getProducts(): Promise<RNIap.Product[]> {
    try {
      if (Platform.OS !== 'android') {
        return [];
      }

      const products = await RNIap.getProducts({
        skus: Object.values(PRODUCTS),
      });

      return products;
    } catch (error) {
      console.error('[ProSystem] Failed to get products:', error);
      return [];
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await RNIap.endConnection();
        console.log('[ProSystem] Connection closed');
      }
    } catch (error) {
      console.error('[ProSystem] Cleanup failed:', error);
    }
  }

  /**
   * FOR TESTING ONLY - Unlock Pro without purchase
   */
  async unlockProForTesting(): Promise<void> {
    this.status.isPro = true;
    this.status.purchaseDate = Date.now();
    this.status.productId = 'testing';
    await this.saveStatus();
    console.log('[ProSystem] Pro unlocked for testing');
  }

  /**
   * FOR TESTING ONLY - Reset Pro status
   */
  async resetProForTesting(): Promise<void> {
    this.status = { isPro: false, totalDonated: 0 };
    await this.saveStatus();
    console.log('[ProSystem] Pro status reset');
  }
}

// Singleton instance
export const proSystem = new ProSystem();
