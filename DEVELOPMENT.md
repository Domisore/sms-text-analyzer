# Textile SMS - Local Development Guide

## Running in Development Mode

### Prerequisites
- Node.js installed
- Android Studio with emulator OR physical Android device
- Expo CLI installed globally: `npm install -g expo-cli`

### Start Development Server

```bash
npm start
```

This will start the Expo development server with:
- QR code for scanning with Expo Go app
- Options to run on Android emulator
- Options to run on iOS simulator
- Web preview option

### Running on Android Emulator

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Press 'a' in the terminal** to open on Android emulator
   - Or scan QR code with Expo Go app on physical device

### Running with Debugger

1. **Start development server:**
   ```bash
   npm start
   ```

2. **Open in emulator/device**

3. **Enable debugging:**
   - Shake device or press `Ctrl+M` (emulator)
   - Select "Debug Remote JS"
   - Chrome DevTools will open automatically

4. **View logs:**
   - Console logs appear in Chrome DevTools
   - React Native logs in terminal

### Building for Production

```bash
eas build -p android --profile preview
```

## Known Issues & Solutions

### Out of Memory Errors

**Problem:** Large XML files (>100MB) cause OOM errors

**Solutions:**
1. Files >100MB: Chunked import and split are disabled
2. Only "Truncate" option available for very large files
3. Recommend users to:
   - Use computer to reduce file size
   - Export smaller date range from SMS Backup & Restore
   - Truncate to 1,000-5,000 messages

### File Picker

- Now filters to XML files only (`text/xml`, `application/xml`)
- Users won't see non-XML files in picker

### Expo Notifications Warning

**Warning:** `expo-notifications: Android Push notifications functionality removed from Expo Go`

**Solution:** This is expected. The app uses:
- Background fetch for periodic scanning
- Local notifications (not push notifications)
- Works fine in development builds and production APKs

## File Size Limits

| File Size | Chunked Import | Split Files | Truncate |
|-----------|---------------|-------------|----------|
| <30MB     | ✅ Works      | ✅ Works    | ✅ Works |
| 30-100MB  | ✅ Works      | ✅ Works    | ✅ Works |
| 100-200MB | ❌ Disabled   | ❌ Disabled | ✅ Works |
| >200MB    | ❌ Disabled   | ❌ Disabled | ⚠️ May fail |

## Testing Large Files

For testing with large files:
1. Use files <100MB for chunk/split testing
2. Use truncate for files >100MB
3. Test with 1,000-5,000 message truncation for very large files

## Debugging Tips

### View Database
```javascript
// In Chrome DevTools console
db.getAllSync('SELECT * FROM sms LIMIT 10;')
```

### Check Memory Usage
- Monitor Android Studio Profiler
- Watch for memory spikes during import
- Files >100MB will show error before attempting to load

### Test Urgent Message Scanner
```javascript
// Manually trigger scan
const { manualScan } = require('./urgentMessageScanner');
manualScan().then(console.log);
```

## Project Structure

```
├── App.tsx                          # Main app component
├── database.ts                      # SQLite database setup
├── importSMS.ts                     # File import logic
├── chunkImporter.ts                 # Large file handling
├── urgentMessageScanner.ts          # Background scanning
├── UrgentMonitoringStatus.tsx       # Lightning bolt indicator
├── ImportOptionsModal.tsx           # Import dialog
├── ImportInstructionsModal.tsx      # How-to guide
├── LargeFileImportModal.tsx         # Large file strategies
├── BillTrackerModal.tsx             # Bill tracking feature
├── QuickActionsModal.tsx            # Bulk actions
└── DashboardInsights.tsx            # Today's insights
```

## Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Run on Android
npm run android

# Build production APK
eas build -p android --profile preview

# View logs
npx react-native log-android
```
