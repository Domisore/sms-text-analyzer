# 💰 Google Play Payments Setup Guide

Complete guide to setting up payments and getting paid for Textile SMS Pro.

---

## Step 1: Set Up Google Play Merchant Account

### Initial Setup (One-Time)

1. **Go to Google Play Console**
   - Visit: https://play.google.com/console
   - Sign in with your developer account

2. **Navigate to Payments Profile**
   - Click **Setup** → **Payments profile**
   - Click **Create payments profile**

3. **Fill in Business Information**
   ```
   Account Type: Individual or Business
   Legal Name: [Your full legal name]
   Address: [Your business/home address]
   Phone: [Your phone number]
   ```

4. **Add Tax Information**
   
   **For US Developers:**
   - Form: W-9
   - Tax ID: SSN (individual) or EIN (business)
   - Purpose: IRS reporting
   
   **For International Developers:**
   - Form: W-8BEN
   - Tax ID: Your country's tax ID
   - Check if tax treaty exists with US (may reduce withholding)

5. **Add Bank Account**
   ```
   Account Type: Checking or Savings
   Account Holder Name: [Must match legal name]
   Routing Number: [9 digits for US banks]
   Account Number: [Your account number]
   Bank Name: [Your bank's name]
   ```

6. **Verify Account**
   - Google will send 2 small deposits (< $1 each)
   - Check your bank in 2-3 business days
   - Enter the exact amounts in Play Console
   - Account verified! ✅

---

## Step 2: Create In-App Products

### Navigate to In-App Products
1. Go to **Monetize** → **In-app products**
2. Click **Create product** for each item below

### Product 1: Pro Lifetime Purchase

```
Product ID: textile_pro_lifetime
Product type: Managed product (one-time purchase)
Name: Textile SMS Pro
Description: Unlock all Pro features including custom categories, advanced filtering, themes, analytics, bulk operations, backup & restore, and enhanced exports. One-time purchase with lifetime access to all current and future Pro features.

Default price: $4.99 USD

Status: Active ✅
```

### Product 2: Coffee Donation

```
Product ID: donate_coffee
Product type: Consumable
Name: Buy us a Coffee ☕
Description: Support Textile SMS development with a small donation. Thank you for your support!

Default price: $0.99 USD

Status: Active ✅
```

### Product 3: Lunch Donation

```
Product ID: donate_lunch
Product type: Consumable
Name: Buy us Lunch 🍔
Description: Support Textile SMS development with a generous donation. Your support helps us continue improving the app!

Default price: $2.99 USD

Status: Active ✅
```

### Product 4: Dinner Donation

```
Product ID: donate_dinner
Product type: Consumable
Name: Buy us Dinner 🍕
Description: Support Textile SMS development with a very generous donation. We truly appreciate your support!

Default price: $4.99 USD

Status: Active ✅
```

### Product 5: Generous Supporter

```
Product ID: donate_generous
Product type: Consumable
Name: Generous Supporter 🎉
Description: Thank you for your amazing support! Your generous donation helps us dedicate more time to making Textile SMS even better.

Default price: $9.99 USD

Status: Active ✅
```

### Important Notes
- ⏰ **Wait 2-4 hours** after creating products before they appear in app
- ✅ **Activate each product** by clicking the "Activate" button
- 🌍 **Set prices for other countries** (optional) or use auto-conversion
- 📝 **Product IDs must match exactly** - they're already coded in the app

---

## Step 3: Test Payments (Before Launch)

### Set Up License Testing

1. **Add Test Accounts**
   - Go to **Setup** → **License testing**
   - Add Gmail accounts (yours and testers)
   - These accounts can make test purchases without being charged

2. **Test Purchase Flow**
   ```
   1. Install app on device with test account
   2. Open app → Menu → "Go Pro"
   3. Tap "Upgrade to Pro" ($4.99)
   4. Complete purchase (won't be charged)
   5. Verify Pro features unlock
   6. Check "Pro Member ✨" appears in menu
   ```

3. **Test Restore Purchases**
   ```
   1. Uninstall app
   2. Reinstall app
   3. Open app → Menu → "Go Pro"
   4. Tap "Restore Previous Purchase"
   5. Verify Pro unlocks again
   ```

4. **Test Donations**
   ```
   1. As Pro member, open "Pro Member ✨"
   2. Tap any donation amount
   3. Complete purchase (won't be charged)
   4. Verify thank you message appears
   ```

### Testing Commands (Development)

```javascript
// In Chrome DevTools console or React Native debugger:

// Unlock Pro without purchase (testing only)
proSystem.unlockProForTesting();

// Reset to free version
proSystem.resetProForTesting();

// Check current status
proSystem.getStatus();
```

---

## Step 4: Publish App

### No Special Steps Required!

Just publish your app normally:
```bash
# Build production APK
eas build -p android --profile production

# Upload to Play Console
# Go to Production → Create new release
# Upload APK/AAB
# Submit for review
```

**That's it!** Payments automatically work once:
- ✅ Merchant account verified
- ✅ Products created & activated
- ✅ App published

---

## Step 5: Get Paid (Automatic)

### Payment Schedule

**Monthly Payments:**
```
Purchase Date → 30-day hold → Paid next month around 15th

Example Timeline:
- Jan 5: User buys Pro ($4.99)
- Feb 5: Hold period ends
- Feb 15: You get paid ($4.24 after 15% fee)
```

**Minimum Threshold:**
- Must earn at least **$10** to receive payment
- If under $10, rolls over to next month

### Payment Breakdown

**Revenue Split:**
```
First $1M per year:
- Google fee: 15%
- You keep: 85%

Over $1M per year:
- Google fee: 30%
- You keep: 70%
```

**Example Earnings:**
```
Pro Purchase ($4.99):
- Google fee (15%): $0.75
- You receive: $4.24

Coffee Donation ($0.99):
- Google fee (15%): $0.15
- You receive: $0.84

Lunch Donation ($2.99):
- Google fee (15%): $0.45
- You receive: $2.54

Dinner Donation ($4.99):
- Google fee (15%): $0.75
- You receive: $4.24

Generous Donation ($9.99):
- Google fee (15%): $1.50
- You receive: $8.49
```

### Check Your Earnings

**In Google Play Console:**
1. Go to **Monetize** → **Financial reports**
2. View:
   - Daily sales
   - Product breakdown
   - Country breakdown
   - Estimated earnings

**Payment History:**
1. Go to **Payments center**
2. See:
   - Pending payments
   - Payment history
   - Next payment date
   - Bank account status

### Export Reports

**For Accounting/Taxes:**
1. Go to **Financial reports**
2. Select date range
3. Click **Export** → CSV or Excel
4. Save for tax records

---

## Revenue Projections

### Conservative (100 active users)
```
10% buy Pro:     10 × $4.24 = $42.40/month
5% donate avg:    5 × $2.50 = $12.50/month
Total:                        $54.90/month
Annual:                       $658.80/year
```

### Moderate (1,000 active users)
```
10% buy Pro:    100 × $4.24 = $424.00/month
5% donate avg:   50 × $2.50 = $125.00/month
Total:                        $549.00/month
Annual:                     $6,588.00/year
```

### Successful (10,000 active users)
```
10% buy Pro:  1,000 × $4.24 = $4,240.00/month
5% donate avg: 500 × $2.50 = $1,250.00/month
Total:                        $5,490.00/month
Annual:                      $65,880.00/year
```

---

## Tax Information

### US Developers

**Tax Forms:**
- Google sends **1099-K** if you earn >$600/year
- Report on **Schedule C** (self-employment income)
- Pay self-employment tax (15.3%) + income tax

**Quarterly Estimated Taxes:**
- If earning >$1,000/year, pay quarterly
- Due: April 15, June 15, Sept 15, Jan 15
- Use Form 1040-ES

**Deductions:**
- Phone/internet bills (business portion)
- Computer equipment
- Software subscriptions
- Home office (if applicable)
- Marketing expenses

**Recommended:**
- Set aside 25-30% of earnings for taxes
- Use accounting software (QuickBooks, Wave)
- Consult tax professional

### International Developers

**Withholding Tax:**
- US withholds 0-30% depending on country
- Check tax treaty with US
- Fill out W-8BEN form correctly

**Local Taxes:**
- Report earnings in your country
- Pay local income tax
- Keep records of all transactions

---

## Troubleshooting

### Products Not Showing in App

**Possible causes:**
- Products not activated → Activate in Play Console
- Just created → Wait 2-4 hours
- Product IDs don't match → Check spelling exactly
- App not signed with release key → Use production build

**Solution:**
```bash
# Check product IDs in code match Play Console
# Wait 2-4 hours after creating products
# Ensure app is production build, not debug
```

### Purchase Not Working

**Possible causes:**
- Not using test account → Add to license testing
- Products not activated → Activate in Play Console
- Network issues → Check internet connection
- Google Play cache → Clear Play Store cache

**Solution:**
```
1. Settings → Apps → Google Play Store
2. Storage → Clear cache
3. Restart device
4. Try purchase again
```

### Payment Delayed

**Possible causes:**
- Bank account not verified → Verify with deposits
- Tax forms incomplete → Complete W-9/W-8BEN
- Under $10 threshold → Wait until you reach $10
- 30-day hold period → Wait for hold to end

**Solution:**
```
1. Check Payments center for status
2. Verify all forms completed
3. Check bank account verified
4. Wait for payment date (around 15th)
```

### Wrong Payment Amount

**Check for:**
- Refunds/chargebacks → View in reports
- Currency conversion → Check exchange rates
- Fee percentage → Verify 15% or 30%
- Adjustments → Check payment details

---

## Support & Resources

### Google Play Support
- **Help Center:** https://support.google.com/googleplay/android-developer
- **Email:** apps-dev-support@google.com
- **Phone:** Available in Play Console

### Useful Links
- **Play Console:** https://play.google.com/console
- **Payments Center:** Play Console → Payments center
- **Financial Reports:** Play Console → Monetize → Financial reports
- **Tax Forms:** Play Console → Setup → Payments profile

### Community
- **Reddit:** r/androiddev
- **Stack Overflow:** [google-play-billing] tag
- **Discord:** Android Dev communities

---

## Quick Reference Checklist

### One-Time Setup
- [ ] Create Google Play merchant account
- [ ] Add bank account details
- [ ] Complete tax forms (W-9 or W-8BEN)
- [ ] Verify bank account (2-3 days)
- [ ] Create 5 in-app products
- [ ] Activate all products
- [ ] Add test accounts for testing
- [ ] Test purchase flow
- [ ] Test restore purchases
- [ ] Publish app

### Monthly Tasks
- [ ] Check earnings in Financial reports
- [ ] Verify payment received (around 15th)
- [ ] Export reports for records
- [ ] Set aside money for taxes
- [ ] Review refunds/chargebacks

### Annual Tasks
- [ ] File taxes (1099-K if >$600)
- [ ] Review pricing strategy
- [ ] Analyze conversion rates
- [ ] Plan feature updates

---

## Success Tips

### Maximize Revenue
1. **Clear value proposition** - Show what Pro includes
2. **Fair pricing** - $4.99 is competitive
3. **Optional donations** - Extra revenue from supporters
4. **Regular updates** - Keep users engaged
5. **Respond to reviews** - Build trust
6. **Market features** - Let users know about Pro

### Build Trust
1. **One-time purchase** - No subscriptions
2. **Lifetime access** - All future features included
3. **Restore purchases** - Easy to recover
4. **No ads** - Clean experience
5. **Privacy focused** - On-device processing

### Grow User Base
1. **Free version is useful** - Don't cripple it
2. **Pro adds value** - Not just removing limits
3. **Word of mouth** - Happy users share
4. **App store optimization** - Good screenshots/description
5. **Regular updates** - Shows active development

---

## Summary

**Setup (One-Time):**
1. ✅ Merchant account → 30 minutes
2. ✅ Bank verification → 2-3 days
3. ✅ Create products → 5 minutes
4. ✅ Test purchases → 15 minutes
5. ✅ Publish app → Normal process

**Then Automatic:**
- Users buy → Google collects
- Google pays you monthly
- Money in bank account
- No ongoing work needed!

**You're all set! 🎉**

The payment system is fully implemented in the app. Once you complete the setup above, users can purchase Pro and donate, and you'll automatically get paid monthly.

---

*Last updated: January 2025*
*For questions or issues, refer to Google Play Console Help Center*
