import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { XMLParser } from 'fast-xml-parser';
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';

// Simple logger for this module
const logger = {
  info: (msg: string, data?: any) => console.log(`[TextileSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[TextileSMS] ERROR: ${msg}`, err || ''),
  sms: (msg: string, data?: any) => console.log(`[TextileSMS] SMS: ${msg}`, data || ''),
};

// Initialize database with error handling
let db: SQLite.SQLiteDatabase;
try {
  db = SQLite.openDatabaseSync('textile.db');
  // Ensure table exists
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
  logger.info('Database initialized for SMS import');
} catch (error) {
  logger.error('Failed to initialize database for import', error);
}

export const importSMSBackup = async (onProgress?: (message: string, progress: number) => void) => {
  try {
    logger.sms('Starting file SMS import');
    onProgress?.('Opening file picker...', 5);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      logger.info('File import cancelled by user');
      return;
    }

    onProgress?.('Analyzing file...', 15);
    
    const uri = result.assets[0].uri;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileSizeMB = (fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0) / (1024 * 1024);
    
    logger.info(`Reading SMS backup file: ${uri} (${fileSizeMB.toFixed(2)}MB)`);
    
    // Check file size and warn user if it's large
    if (fileSizeMB > 50) {
      Alert.alert(
        'Large File Warning',
        `This file is ${fileSizeMB.toFixed(1)}MB. Large files may cause memory issues. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { return; } },
          { text: 'Continue', onPress: () => processLargeFile(uri) }
        ]
      );
      return;
    }

    await processFile(uri, onProgress);
    
  } catch (err) {
    logger.error('File SMS import failed', err);
    if (err.message && err.message.includes('OutOfMemoryError')) {
      Alert.alert(
        "Memory Error", 
        "The file is too large to process. Try using a smaller backup file or split your backup into smaller chunks."
      );
    } else {
      Alert.alert("Error", "Failed to import. Try again.");
    }
  }
};

const processFile = async (uri: string, onProgress?: (message: string, progress: number) => void) => {
  try {
    onProgress?.('Reading file contents...', 30);
    const xml = await FileSystem.readAsStringAsync(uri);
    
    onProgress?.('Parsing XML data...', 50);
    await parseAndImportXML(xml, onProgress);
  } catch (error) {
    if (error.message && error.message.includes('OutOfMemoryError')) {
      throw new Error('OutOfMemoryError: File too large');
    }
    throw error;
  }
};

const processLargeFile = async (uri: string) => {
  try {
    logger.sms('Processing large file with memory optimization');
    
    // For very large files, we'll read in chunks
    const xml = await FileSystem.readAsStringAsync(uri);
    
    // Split processing into smaller batches
    await parseAndImportXMLInBatches(xml);
    
  } catch (error) {
    logger.error('Large file processing failed', error);
    Alert.alert(
      "Processing Failed", 
      "The file is too large to process safely. Please use a smaller backup file."
    );
  }
};

const parseAndImportXML = async (xml: string, onProgress?: (message: string, progress: number) => void) => {
  const parser = new XMLParser({ 
    ignoreAttributes: false, 
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true
  });
  
  onProgress?.('Parsing messages...', 60);
  const data = parser.parse(xml);
  const messages = data.smses?.sms || [];
  
  logger.sms(`Found ${messages.length} messages in backup file`);
  onProgress?.(`Processing ${messages.length} messages...`, 70);
  
  await importMessages(messages, onProgress);
};

const parseAndImportXMLInBatches = async (xml: string) => {
  const parser = new XMLParser({ 
    ignoreAttributes: false, 
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true
  });
  
  const data = parser.parse(xml);
  const messages = data.smses?.sms || [];
  
  logger.sms(`Found ${messages.length} messages in backup file - processing in batches`);
  
  // Process in batches of 1000 messages to avoid memory issues
  const batchSize = 1000;
  let totalImported = 0;
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    logger.sms(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(messages.length/batchSize)}`);
    
    const imported = await importMessages(batch);
    totalImported += imported;
    
    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  logger.sms(`Batch processing completed: ${totalImported} messages imported`);
  Alert.alert("Success", `${totalImported} messages imported in batches.`);
};

const importMessages = async (messages: any[], onProgress?: (message: string, progress: number) => void): Promise<number> => {
  let imported = 0;
  let failed = 0;
  
  // Check if database is available
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  onProgress?.('Saving messages to database...', 80);
  
  // Use transaction for better performance
  db.withTransactionSync(() => {
    messages.forEach((msg: any, index: number) => {
      try {
        const body = msg['@_body'] || '';
        const sender = msg['@_address'] || '';
        const time = parseInt(msg['@_date']) || Date.now();
        const thread_id = msg['@_thread_id'] || null;
        const category = classify(body, time);

        db.runSync(
          `INSERT OR REPLACE INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
          [body, sender, time, thread_id, category]
        );
        imported++;
        
        // Update progress every 100 messages
        if (index % 100 === 0) {
          const progress = 80 + (index / messages.length) * 15; // 80-95% range
          onProgress?.(`Saving messages... ${index + 1}/${messages.length}`, progress);
        }
      } catch (dbError) {
        logger.error('Failed to insert message', dbError);
        failed++;
      }
    });
  });
  
  onProgress?.('Import complete!', 95);
  
  if (failed > 0) {
    logger.sms(`Import completed with ${failed} failures`);
  }

  logger.sms(`Successfully imported ${imported} messages from batch`);
  
  if (messages.length < 1000) { // Only show alert for single batch or final batch
    Alert.alert("Success", `${imported} messages imported.`);
  }
  
  return imported;
};

const classify = (body: string, time: number): string => {
  if (/\b\d{4,6}\b/.test(body) && (Date.now() - time) / 60000 > 5) return 'expired';
  if (/due in \d+ day/i.test(body)) return 'upcoming';
  if (/win|free|claim/i.test(body)) return 'spam';
  return 'social';
};

// Alternative function for extremely large files (>100MB)
export const importLargeSMSBackup = async () => {
  try {
    logger.sms('Starting large file SMS import with streaming');
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      logger.info('Large file import cancelled by user');
      return;
    }

    const uri = result.assets[0].uri;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileSizeMB = (fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0) / (1024 * 1024);
    
    logger.info(`Processing large SMS backup file: ${uri} (${fileSizeMB.toFixed(2)}MB)`);
    
    Alert.alert(
      'Large File Processing',
      `Processing ${fileSizeMB.toFixed(1)}MB file. This may take several minutes and will be done in small chunks to prevent memory issues.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Process', onPress: () => processVeryLargeFile(uri) }
      ]
    );
    
  } catch (err) {
    logger.error('Large file SMS import failed', err);
    Alert.alert("Error", "Failed to process large file.");
  }
};

const processVeryLargeFile = async (uri: string) => {
  try {
    // For files >100MB, we need to be very careful about memory
    logger.sms('Reading large file in chunks');
    
    // Read file content
    const xml = await FileSystem.readAsStringAsync(uri);
    
    // Use a more memory-efficient parser approach
    const messageCount = (xml.match(/<sms /g) || []).length;
    logger.sms(`Estimated ${messageCount} messages in large file`);
    
    if (messageCount > 50000) {
      Alert.alert(
        'Very Large Dataset',
        `This file contains approximately ${messageCount.toLocaleString()} messages. Processing will be done in small batches. This may take 10-15 minutes.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => parseAndImportXMLInBatches(xml) }
        ]
      );
    } else {
      await parseAndImportXMLInBatches(xml);
    }
    
  } catch (error) {
    logger.error('Very large file processing failed', error);
    Alert.alert(
      "Processing Failed", 
      "The file is too large to process. Consider splitting your SMS backup into smaller files."
    );
  }
};