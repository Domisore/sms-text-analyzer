# Google Play In-App Products Setup

## Products to Create in Google Play Console

### 1. Navigate to Google Play Console
1. Go to https://play.google.com/console
2. Select your app (Textile SMS)
3. Go to **Monetize** → **In-app products**

### 2. Create Products

#### Pro Lifetime Purchase
```
Product ID: textile_pro_lifetime
Product type: Managed product (one-time purchase)
Name: Textile SMS Pro
Description: Unlock all Pro features including custom categories, advanced filtering, themes, analytics, and more. One-time purchase, lifetime access.
Price: $4.99 USD
```

#### Donation Products

**Coffee**
```
Product ID: donate_coffee
Product type: Consumable
Name: Buy us a Coffee ☕
Description: Support Textile SMS development with a small donation
Price: $0.99 USD
```

**Lunch**
```
Product ID: donate_lunch
Product type: Consumable
Name: Buy us Lunch 🍔
Description: Support Textile SMS development
Price: $2.99 USD
```

**Dinner**
```
Product ID: donate_dinner
Product type: Consumable
Name: Buy us Dinner 🍕
Description: Support Textile SMS development with a generous donation
Price: $4.99 USD
```

**Generous Supporter**
```
Product ID: donate_generous
Product type: Consumable
Name: Generous Supporter 🎉
Description: Thank you for your amazing support!
Price: $9.99 USD
```

### 3. Activate Products
- After creating each product, click **Activate** to make it available
- Products must be activated before they appear in the app

### 4. Testing

#### Test with License Testers
1. Go to **Setup** → **License testing**
2. Add test Gmail accounts
3. These accounts can make test purchases without being charged

#### Test Purchases
1. Install app on device with test account
2. Tap "Go Pro" in menu
3. Should see products with prices
4. Make test purchase
5. Verify Pro features unlock

### 5. Production Checklist

Before releasing:
- [ ] All products created and activated
- [ ] Prices set for all regions
- [ ] Product descriptions reviewed
- [ ] Test purchases completed successfully
- [ ] Restore purchases tested
- [ ] Donation flow tested

## Product IDs Reference

```typescript
PRODUCTS = {
  PRO_LIFETIME: 'textile_pro_lifetime',
  DONATE_COFFEE: 'donate_coffee',
  DONATE_LUNCH: 'donate_lunch',
  DONATE_DINNER: 'donate_dinner',
  DONATE_GENEROUS: 'donate_generous',
}
```

## Testing Commands

### Unlock Pro for Testing (without purchase)
```javascript
// In Chrome DevTools console or React Native debugger
proSystem.unlockProForTesting();
```

### Reset Pro Status
```javascript
proSystem.resetProForTesting();
```

### Check Pro Status
```javascript
proSystem.getStatus();
```

## Troubleshooting

### Products not showing
- Ensure products are activated in Play Console
- Wait 2-4 hours after activation
- Check product IDs match exactly
- Verify app is signed with release key

### Purchase not working
- Check license testing is set up
- Verify test account is added
- Ensure app has correct permissions
- Check logs for IAP errors

### Restore not working
- Verify purchase was completed
- Check Google Play account
- Try signing out and back in
- Clear Google Play Store cache

## Revenue Tracking

Track in Google Play Console:
- **Monetize** → **Financial reports**
- View by product
- Export for accounting

## Support

If users have purchase issues:
1. Check their Google Play purchase history
2. Use "Restore Previous Purchase" button
3. Contact Google Play support if needed
4. Refund through Play Console if necessary
