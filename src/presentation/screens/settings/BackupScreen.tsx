import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  saveDocuments,
  types,
} from '@react-native-documents/picker';

import { container } from '../../../di/container';

export function BackupScreen() {
  const [busy, setBusy] = useState(false);

  const backup = async () => {
    try {
      setBusy(true);
      const file = await container.useCases.exportDatabase.execute();
      const fileName = file.path.split('/').pop() ?? 'gymmanager-backup.sql';

      const saved = await saveDocuments({
        sourceUris: [`file://${file.path}`],
        mimeType: 'application/sql',
        fileName,
      });

      if (!saved[0].error) {
        Alert.alert('Backup saved', 'The complete SQL database was saved.');
      }
    } catch (error) {
      Alert.alert(
        'Backup failed',
        error instanceof Error ? error.message : 'Unable to create backup.',
      );
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      setBusy(true);
      const [selection] = await pick({
        type: [types.allFiles],
        mode: 'import',
      });

      if (!selection.name?.toLowerCase().endsWith('.sql')) {
        throw new Error('Please select a .sql GymManager backup file.');
      }

      const [localCopy] = await keepLocalCopy({
        files: [
          { uri: selection.uri, fileName: selection.name ?? 'backup.sql' },
        ],
        destination: 'cachesDirectory',
      });

      if (localCopy.status !== 'success') {
        throw new Error(localCopy.copyError);
      }

      const path = localCopy.localUri;
      setBusy(false);

      Alert.alert(
        'Restore database',
        'This replaces all current gym data with the selected SQL backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                setBusy(true);
                await container.useCases.restoreDatabase.execute(path);
                Alert.alert(
                  'Restore complete',
                  'Restart GymManager to reload the restored database.',
                );
              } catch (error) {
                Alert.alert(
                  'Restore failed',
                  error instanceof Error
                    ? error.message
                    : 'Unable to restore the SQL backup.',
                );
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      setBusy(false);
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Unable to select backup.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.info}>
          <Text style={styles.title}>Backup & Restore</Text>
          <Text style={styles.text}>
            Export or restore the complete database as a SQL file.
          </Text>
        </View>

        <Pressable style={styles.primary} onPress={backup} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Export Database (.sql)</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondary} onPress={restore} disabled={busy}>
          <Text style={styles.secondaryText}>Restore Backup</Text>
        </Pressable>

        <Text style={styles.note}>
          Restore replaces the complete local database. Only use a GymManager
          .sql backup.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F9' },
  container: { padding: 16 },
  info: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  title: { fontSize: 23, fontWeight: '800', color: '#111827' },
  text: { marginTop: 8, color: '#6B7280', lineHeight: 20 },
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontWeight: '800', color: '#111827' },
  note: { marginTop: 18, color: '#6B7280', fontSize: 12, lineHeight: 18 },
});
