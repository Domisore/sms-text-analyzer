import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { XMLParser } from 'fast-xml-parser';
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';

const db = SQLite.openDatabaseSync('textile.db');

export const importSMSBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const xml = await FileSystem.readAsStringAsync(uri);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const data = parser.parse(xml);
    const messages = data.smses?.sms || [];

    let imported = 0;
    messages.forEach((msg: any) => {
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
    });

    Alert.alert("Success", `${imported} messages imported.`);
  } catch (err) {
    Alert.alert("Error", "Failed to import. Try again.");
  }
};

const classify = (body: string, time: number): string => {
  if (/\b\d{4,6}\b/.test(body) && (Date.now() - time) / 60000 > 5) return 'expired';
  if (/due in \d+ day/i.test(body)) return 'upcoming';
  if (/win|free|claim/i.test(body)) return 'spam';
  return 'social';
};