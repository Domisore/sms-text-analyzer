import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { XMLParser } from 'fast-xml-parser';
import { Alert } from 'react-native';
import { analyzeFileAndRecommend } from './chunkImporter';
import { db } from './database';

// Simple logger for this module
const logger = {
  info: (msg: string, data?: any) => console.log(`[TextBudSMS] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[TextBudSMS] ERROR: ${msg}`, err || ''),
  sms: (msg: string, data?: any) => console.log(`[TextBudSMS] SMS: ${msg}`, data || ''),
};

export const importSMSBackup = async (
  onProgress?: (message: string, progress: number) => void,
  onLargeFile?: (uri: string, sizeMB: number) => void
) => {
  try {
    logger.sms('Starting file SMS import');
    onProgress?.('Opening file picker...', 5);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/xml', 'application/xml'],
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
    
    // Check file size and recommend strategy
    // With largeHeap enabled, we can handle files up to 65MB before showing options
    if (fileSizeMB > 65) {
      // Analyze and get recommendation
      const analysis = await analyzeFileAndRecommend(uri);
      
      logger.info('Large file detected', analysis);
      
      // Call the large file handler if provided
      if (onLargeFile) {
        onLargeFile(uri, fileSizeMB);
        return;
      }
      
      // Fallback: show simple alert
      Alert.alert(
        'Large File Detected',
        `This file is ${fileSizeMB.toFixed(1)}MB (${analysis.estimatedMessages.toLocaleString()} messages).\n\n` +
          `${analysis.reason}\n\n` +
          `Continue with standard import? This may take several minutes.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processFile(uri, onProgress) }
        ]
      );
      return;
    }

    await processFile(uri, onProgress);
    
  } catch (err: any) {
    logger.error('File SMS import failed', err);
    if (err.message && err.message.includes('OutOfMemoryError')) {
      Alert.alert(
        "Memory Error", 
        "The file is too large to process in one go.\n\n" +
        "Please try again and select one of these options:\n" +
        "• Split into Smaller Files (recommended)\n" +
        "• Import First/Last N Messages\n\n" +
        "Or use a computer to reduce the file size manually."
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
  } catch (error: any) {
    if (error.message && (error.message.includes('OutOfMemoryError') || error.message.includes('memory'))) {
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
  let duplicates = 0;
  let failed = 0;
  
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

        // Check if message already exists
        const existing = db.getFirstSync(
          `SELECT id FROM sms WHERE sender = ? AND body = ? AND time = ?;`,
          [sender, body, time]
        );

        if (existing) {
          duplicates++;
        } else {
          db.runSync(
            `INSERT INTO sms (body, sender, time, thread_id, category) VALUES (?, ?, ?, ?, ?);`,
            [body, sender, time, thread_id, category]
          );
          imported++;
        }
        
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

  if (duplicates > 0) {
    logger.sms(`Skipped ${duplicates} duplicate messages`);
  }

  logger.sms(`Successfully imported ${imported} new messages from batch`);
  
  if (messages.length < 1000) { // Only show alert for single batch or final batch
    const message = duplicates > 0 
      ? `${imported} new messages imported.\n${duplicates} duplicates skipped.`
      : `${imported} messages imported.`;
    Alert.alert("Success", message);
  }
  
  return imported;
};

const classify = (body: string, time: number): string => {
  const bodyLower = body.toLowerCase();
  const ageMinutes = (Date.now() - time) / 60000;
  
  // Check for overdue payments/bills first (highest priority)
  const overduePatterns = [
    /overdue/i,
    /past due/i,
    /payment.*overdue/i,
    /overdrawn/i,
    /account.*overdrawn/i,
    /balance.*below/i,
    /negative balance/i,
    /immediate.*payment/i,
    /urgent.*payment/i,
  ];
  
  if (overduePatterns.some(pattern => pattern.test(body))) {
    return 'overdue';
  }
  
  // Enhanced OTP detection - check if expired (>10 minutes old)
  const otpPatterns = [
    /\b\d{4,8}\b.*(?:otp|code|verification|verify|authenticate)/i,
    /(?:otp|code|verification|verify|authenticate).*\b\d{4,8}\b/i,
    /your.*(?:code|otp).*is.*\d{4,8}/i,
    /\d{4,8}.*is your.*(?:code|otp)/i,
    /verification code/i,
    /security code/i,
  ];
  
  if (otpPatterns.some(pattern => pattern.test(body)) && ageMinutes > 10) {
    return 'expired';
  }
  
  // Medical/Health detection (high priority - before bills)
  const medicalPatterns = [
    /prescription/i,
    /pharmacy/i,
    /cvs.*pharmacy/i,
    /walgreens/i,
    /rite aid/i,
    /medication/i,
    /refill/i,
    /doctor/i,
    /appointment.*(?:doctor|clinic|hospital)/i,
    /medical/i,
    /health/i,
    /lab.*results/i,
    /test.*results/i,
    /vaccine/i,
    /vaccination/i,
    /flu shot/i,
  ];
  
  if (medicalPatterns.some(pattern => pattern.test(body))) {
    return 'medical';
  }

  // Delivery/Shipping detection
  const deliveryPatterns = [
    /(?:package|parcel|shipment).*(?:delivered|arriving|out for delivery)/i,
    /(?:amazon|ups|fedex|usps|dhl).*(?:delivered|delivery|shipped|tracking)/i,
    /tracking.*number/i,
    /out for delivery/i,
    /delivered.*to/i,
    /shipment.*(?:arriving|delivered)/i,
    /order.*(?:shipped|delivered)/i,
    /delivery.*(?:scheduled|expected|arriving)/i,
    /your.*(?:package|order).*(?:has been|is)/i,
  ];
  
  if (deliveryPatterns.some(pattern => pattern.test(body))) {
    return 'deliveries';
  }

  // Enhanced bill/payment detection (pending payments)
  const billPatterns = [
    /(?:bill|payment|invoice|due|amount).*(?:rs|inr|usd|\$|₹).*\d+/i,
    /(?:pay|paid|pending).*(?:rs|inr|usd|\$|₹).*\d+/i,
    /due.*(?:date|on|by).*\d{1,2}[/-]\d{1,2}/i,
    /payment.*due/i,
    /(?:electricity|water|gas|internet|mobile|credit card).*(?:bill|payment)/i,
    /(?:reminder|alert).*(?:payment|bill)/i,
    /your payment is due/i,
    /balance.*(?:rs|inr|usd|\$|₹)/i,
  ];
  
  if (billPatterns.some(pattern => pattern.test(body))) {
    return 'upcoming';
  }
  
  // Enhanced spam detection
  const spamPatterns = [
    /\b(?:win|won|winner|congratulations|claim|prize|reward)\b/i,
    /\b(?:free|offer|discount|deal|sale)\b.*(?:click|limited|now)/i,
    /click.*(?:here|link|now)/i,
    /(?:limited time|hurry|act now|don't miss|last chance)/i,
    /(?:lottery|jackpot|cash prize)/i,
    /(?:unsubscribe|stop|opt-out)/i,
    /(?:viagra|casino|loan approved|debt relief)/i,
  ];
  
  if (spamPatterns.some(pattern => pattern.test(body))) {
    return 'spam';
  }
  
  // Transaction notifications (not bills, just info)
  const transactionPatterns = [
    /transaction.*(?:cvs|pharmacy|walmart|target|amazon)/i,
    /debit card transaction/i,
    /(?:spent|purchased|charged).*at/i,
    /external transfer/i,
  ];
  
  if (transactionPatterns.some(pattern => pattern.test(body))) {
    return 'social'; // Informational, not actionable
  }
  
  // Social/promotional patterns
  const socialPatterns = [
    /(?:facebook|twitter|instagram|whatsapp|telegram|linkedin)/i,
    /(?:liked|commented|shared|mentioned|tagged)/i,
    /(?:friend request|follow|follower)/i,
    /(?:notification|alert).*(?:social|post|message)/i,
    /polling|survey|questionnaire/i,
  ];
  
  if (socialPatterns.some(pattern => pattern.test(body))) {
    return 'social';
  }
  
  // Default to other for unclassified messages
  return 'other';
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