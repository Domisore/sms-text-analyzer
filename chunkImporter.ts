import * as FileSystem from 'expo-file-system/legacy';
import { XMLParser } from 'fast-xml-parser';
import { db } from './database';
import { Alert } from 'react-native';

const logger = {
  info: (msg: string, data?: any) => console.log(`[ChunkImporter] INFO: ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[ChunkImporter] ERROR: ${msg}`, err || ''),
};

interface ChunkImportOptions {
  onProgress?: (message: string, progress: number, stats: ChunkStats) => void;
  chunkSize?: number; // Number of messages per chunk
}

interface ChunkStats {
  totalMessages: number;
  processedMessages: number;
  importedMessages: number;
  failedMessages: number;
  currentChunk: number;
  totalChunks: number;
}

/**
 * Strategy 1: Stream-based chunking
 * For very large files, show error instead of trying to load into memory
 */
export const importLargeFileInChunks = async (
  fileUri: string,
  options: ChunkImportOptions = {}
): Promise<ChunkStats> => {
  const { onProgress, chunkSize = 1000 } = options;

  try {
    logger.info('Starting chunked import');
    onProgress?.('Analyzing file...', 5, getEmptyStats());

    // Check file size first
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      throw new Error('File not found');
    }

    const fileSizeMB = fileInfo.size / (1024 * 1024);
    logger.info(`File size: ${fileSizeMB.toFixed(2)}MB`);

    // Android heap limit is ~256MB, file needs 4x memory to process
    // So max file size is 256MB / 4 = 64MB, but use 50MB to be safe
    if (fileSizeMB > 50) {
      Alert.alert(
        'File Too Large for Chunked Import',
        `This file is ${fileSizeMB.toFixed(0)}MB, which is too large to process on mobile.\n\n` +
        `Maximum file size: 50MB\n\n` +
        `Please use:\n` +
        `• Truncate to Recent Messages (recommended)\n` +
        `• Use a computer to reduce file size\n` +
        `• Export smaller date range from backup app`,
        [{ text: 'OK' }]
      );
      throw new Error('File too large for chunked import');
    }

    onProgress?.(`Processing ${fileSizeMB.toFixed(1)}MB file...`, 10, getEmptyStats());

    // Read the file (only if <100MB)
    const fileContent = await FileSystem.readAsStringAsync(fileUri);

    // Extract SMS messages using regex (faster than full XML parsing)
    const smsMatches = extractSMSMessages(fileContent);
    const totalMessages = smsMatches.length;

    logger.info(`Found ${totalMessages} messages`);

    if (totalMessages === 0) {
      Alert.alert('No Messages', 'No SMS messages found in the file.');
      return getEmptyStats();
    }

    // Calculate chunks
    const totalChunks = Math.ceil(totalMessages / chunkSize);
    const stats: ChunkStats = {
      totalMessages,
      processedMessages: 0,
      importedMessages: 0,
      failedMessages: 0,
      currentChunk: 0,
      totalChunks,
    };

    logger.info(`Processing in ${totalChunks} chunks of ${chunkSize} messages`);

    // Process in chunks
    for (let i = 0; i < totalMessages; i += chunkSize) {
      const chunk = smsMatches.slice(i, i + chunkSize);
      stats.currentChunk = Math.floor(i / chunkSize) + 1;

      const progress = 10 + (i / totalMessages) * 85; // 10-95% range
      onProgress?.(
        `Processing chunk ${stats.currentChunk}/${totalChunks}...`,
        progress,
        stats
      );

      // Process this chunk
      const chunkResult = await processChunk(chunk);
      stats.importedMessages += chunkResult.imported;
      stats.failedMessages += chunkResult.failed;
      stats.processedMessages = i + chunk.length;

      // Small delay to prevent UI freezing
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    onProgress?.('Import complete!', 100, stats);
    logger.info('Chunked import completed', stats);

    Alert.alert(
      'Import Complete',
      `Successfully imported ${stats.importedMessages} messages\n` +
        `Failed: ${stats.failedMessages}\n` +
        `Processed in ${stats.totalChunks} chunks`
    );

    return stats;
  } catch (error) {
    logger.error('Chunked import failed', error);
    throw error;
  }
};

/**
 * Strategy 2: Split file into smaller files
 * For very large files, show error instead of trying to load into memory
 */
export const splitLargeFile = async (
  fileUri: string,
  messagesPerFile: number = 5000
): Promise<string[]> => {
  try {
    logger.info('Splitting large file');

    // Check file size first
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      throw new Error('File not found');
    }

    const fileSizeMB = fileInfo.size / (1024 * 1024);
    
    // If file is too large, don't try to read it
    if (fileSizeMB > 50) {
      Alert.alert(
        'File Too Large to Split',
        `This file is ${fileSizeMB.toFixed(0)}MB, which is too large to process on mobile.\n\n` +
        `Maximum file size: 50MB\n\n` +
        `Recommendation:\n` +
        `1. Use "Truncate" to keep only recent messages\n` +
        `2. Or use a computer to manually split the file`,
        [{ text: 'OK' }]
      );
      throw new Error('File too large to split on mobile');
    }

    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const smsMatches = extractSMSMessages(fileContent);
    const totalMessages = smsMatches.length;

    logger.info(`Splitting ${totalMessages} messages into files of ${messagesPerFile}`);

    const outputFiles: string[] = [];
    const totalFiles = Math.ceil(totalMessages / messagesPerFile);

    for (let i = 0; i < totalMessages; i += messagesPerFile) {
      const chunk = smsMatches.slice(i, i + messagesPerFile);
      const fileNumber = Math.floor(i / messagesPerFile) + 1;

      // Create XML for this chunk
      const chunkXML = createXMLFromMessages(chunk);

      // Save to file
      const fileName = `sms_backup_part${fileNumber}_of_${totalFiles}.xml`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, chunkXML);
      outputFiles.push(fileUri);

      logger.info(`Created ${fileName}`);
    }

    Alert.alert(
      'File Split Complete',
      `Created ${outputFiles.length} smaller files.\n` +
        `Each file contains up to ${messagesPerFile} messages.\n\n` +
        `Import them one by one for better performance.`
    );

    return outputFiles;
  } catch (error) {
    logger.error('File splitting failed', error);
    throw error;
  }
};

/**
 * Strategy 3: Truncate file to specific size
 * For very large files, we can't load them into memory at all
 * Instead, we'll show an error and recommend using external tools
 */
export const truncateFile = async (
  fileUri: string,
  maxMessages: number = 10000
): Promise<string> => {
  try {
    logger.info(`Attempting to truncate file to ${maxMessages} messages`);

    // Check file size first
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      throw new Error('File not found');
    }

    const fileSizeMB = fileInfo.size / (1024 * 1024);
    
    // If file is too large (>50MB), don't even try to read it
    // 50MB file needs ~200MB memory which is close to Android's 256MB limit
    if (fileSizeMB > 50) {
      Alert.alert(
        'File Too Large to Truncate',
        `This file is ${fileSizeMB.toFixed(0)}MB, which is too large to process on mobile.\n\n` +
        `Mobile devices have limited memory (256MB). Your file needs ${(fileSizeMB * 4).toFixed(0)}MB to process.\n\n` +
        `Recommendation:\n` +
        `1. Use a computer to open the XML file\n` +
        `2. Use a text editor (VS Code, Notepad++)\n` +
        `3. Keep only last 5,000-10,000 messages\n` +
        `4. Save as smaller file (under 20MB)\n` +
        `5. Transfer back to phone and import`,
        [{ text: 'OK' }]
      );
      throw new Error('File too large for mobile processing');
    }

    // For files 30-50MB, warn user
    if (fileSizeMB > 30) {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Large File Warning',
          `This file is ${fileSizeMB.toFixed(0)}MB and needs ${(fileSizeMB * 4).toFixed(0)}MB memory to process.\n\nThis may fail. Recommend using a computer instead.\n\nContinue anyway?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('User cancelled')) },
            { text: 'Try Anyway', onPress: () => resolve(undefined) }
          ]
        );
      }).then(async () => {
        // Continue with truncation
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        return processTruncation(fileContent, fileUri, maxMessages);
      });
    }

    // Try to read and process (for files <30MB - safe zone)
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    return await processTruncation(fileContent, fileUri, maxMessages);
  } catch (error) {
    logger.error('File truncation failed', error);
    
    // Show helpful error message
    Alert.alert(
      'Truncation Failed',
      `Unable to process this file due to its size.\n\n` +
      `Options:\n` +
      `1. Use "Split into Smaller Files" instead\n` +
      `2. Use a computer to manually reduce file size\n` +
      `3. Export a smaller date range from SMS Backup & Restore app`,
      [{ text: 'OK' }]
    );
    
    throw error;
  }
};

/**
 * Process truncation (extracted for reuse)
 */
const processTruncation = async (
  fileContent: string,
  fileUri: string,
  maxMessages: number
): Promise<string> => {
  const smsMatches = extractSMSMessages(fileContent);
  const totalMessages = smsMatches.length;

  logger.info(`Found ${totalMessages} messages in file`);

  if (totalMessages <= maxMessages) {
    Alert.alert('No Truncation Needed', `File has ${totalMessages} messages, which is within the limit.`);
    return fileUri;
  }

  // Keep most recent messages
  const recentMessages = smsMatches.slice(-maxMessages);

  // Create new XML
  const truncatedXML = createXMLFromMessages(recentMessages);

  // Save truncated file
  const fileName = `sms_backup_truncated_${maxMessages}.xml`;
  const outputUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(outputUri, truncatedXML);

  Alert.alert(
    'File Truncated',
    `Kept most recent ${maxMessages} messages out of ${totalMessages}.\n\n` +
      `Truncated file saved. You can now import it.`
  );

  logger.info(`Truncated file created: ${fileName}`);
  return outputUri;
};

/**
 * Extract SMS messages from XML using regex (faster than full parsing)
 */
const extractSMSMessages = (xmlContent: string): string[] => {
  // Match <sms ... /> tags
  const smsRegex = /<sms[^>]*\/>/g;
  const matches = xmlContent.match(smsRegex) || [];
  return matches;
};

/**
 * Process a chunk of SMS messages
 */
const processChunk = async (
  smsMessages: string[]
): Promise<{ imported: number; failed: number }> => {
  let imported = 0;
  let failed = 0;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true,
  });

  // Use transaction for better performance
  db.withTransactionSync(() => {
    smsMessages.forEach((smsXML) => {
      try {
        // Parse individual SMS
        const parsed = parser.parse(smsXML);
        const msg = parsed.sms;

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
      } catch (error) {
        failed++;
        logger.error('Failed to process message', error);
      }
    });
  });

  return { imported, failed };
};

/**
 * Create valid XML from SMS messages
 */
const createXMLFromMessages = (smsMessages: string[]): string => {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n<smses>\n';
  const footer = '</smses>';
  const body = smsMessages.join('\n');

  return header + body + footer;
};

/**
 * Classify message (same logic as importSMS.ts)
 */
const classify = (body: string, time: number): string => {
  const bodyLower = body.toLowerCase();
  const ageMinutes = (Date.now() - time) / 60000;

  // OTP detection
  const otpPatterns = [
    /\b\d{4,8}\b.*(?:otp|code|verification|verify|authenticate)/i,
    /(?:otp|code|verification|verify|authenticate).*\b\d{4,8}\b/i,
    /your.*(?:code|otp).*is.*\d{4,8}/i,
    /\d{4,8}.*is your.*(?:code|otp)/i,
  ];

  if (otpPatterns.some((pattern) => pattern.test(body)) && ageMinutes > 10) {
    return 'expired';
  }

  // Bill detection
  const billPatterns = [
    /(?:bill|payment|invoice|due|amount|balance|outstanding)/i,
    /(?:pay|paid|pending).*(?:rs|inr|usd|\$|₹).*\d+/i,
    /due.*(?:date|on|by).*\d{1,2}[/-]\d{1,2}/i,
    /(?:electricity|water|gas|internet|mobile|credit card).*(?:bill|payment)/i,
    /(?:reminder|alert).*(?:payment|bill)/i,
  ];

  if (billPatterns.some((pattern) => pattern.test(body))) {
    return 'upcoming';
  }

  // Spam detection
  const spamPatterns = [
    /\b(?:win|won|winner|congratulations|claim|prize|reward|free|offer|discount)\b/i,
    /click.*(?:here|link|now)/i,
    /(?:limited|hurry|act now|don't miss|last chance)/i,
    /(?:lottery|jackpot|cash prize)/i,
    /(?:unsubscribe|stop|opt-out)/i,
    /(?:viagra|casino|loan|debt)/i,
  ];

  if (spamPatterns.some((pattern) => pattern.test(body))) {
    return 'spam';
  }

  // Social patterns
  const socialPatterns = [
    /(?:facebook|twitter|instagram|whatsapp|telegram|linkedin)/i,
    /(?:liked|commented|shared|mentioned|tagged)/i,
    /(?:friend request|follow|follower)/i,
    /(?:notification|alert).*(?:social|post|message)/i,
  ];

  if (socialPatterns.some((pattern) => pattern.test(body))) {
    return 'social';
  }

  return 'social';
};

/**
 * Get empty stats object
 */
const getEmptyStats = (): ChunkStats => ({
  totalMessages: 0,
  processedMessages: 0,
  importedMessages: 0,
  failedMessages: 0,
  currentChunk: 0,
  totalChunks: 0,
});

/**
 * Analyze file and recommend strategy
 */
export const analyzeFileAndRecommend = async (
  fileUri: string
): Promise<{
  fileSizeMB: number;
  estimatedMessages: number;
  recommendation: 'direct' | 'chunked' | 'split' | 'truncate';
  reason: string;
}> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileSizeMB = (fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0) / (1024 * 1024);

    // Quick estimate: ~1KB per message average
    const estimatedMessages = Math.floor(fileSizeMB * 1000);

    let recommendation: 'direct' | 'chunked' | 'split' | 'truncate';
    let reason: string;

    if (fileSizeMB < 10) {
      recommendation = 'direct';
      reason = 'File is small enough for direct import';
    } else if (fileSizeMB < 50) {
      recommendation = 'chunked';
      reason = 'File is medium-sized. Chunked import recommended for better performance';
    } else if (fileSizeMB < 100) {
      recommendation = 'split';
      reason = 'File is large. Splitting into smaller files recommended';
    } else {
      recommendation = 'truncate';
      reason = 'File is very large. Consider truncating to most recent messages';
    }

    return {
      fileSizeMB,
      estimatedMessages,
      recommendation,
      reason,
    };
  } catch (error) {
    logger.error('File analysis failed', error);
    throw error;
  }
};
