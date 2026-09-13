import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function BackupScreen() {
  const backup = () =>
    Alert.alert('Backup database', 'The encrypted .gymbackup export will be implemented next.');

  const restore = () =>
    Alert.alert(
      'Restore database',
      'Restoring a backup replaces the current local database. This will require confirmation and authentication.',
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.info}>
          <Text style={styles.title}>Backup & Restore</Text>
          <Text style={styles.text}>
            Keep a copy of your gym data so it can be restored if the device
            is replaced or the app is reinstalled.
          </Text>
        </View>

        <Pressable style={styles.primary} onPress={backup}>
          <Text style={styles.primaryText}>Export Database</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={restore}>
          <Text style={styles.secondaryText}>Restore Backup</Text>
        </Pressable>

        <Text style={styles.note}>
          Recommended format: encrypted .gymbackup with schema and app
          version metadata.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  info: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16},
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  text: {marginTop: 8, color: '#6B7280', lineHeight: 20},
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: {color: '#FFFFFF', fontWeight: '800'},
  secondary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {fontWeight: '800', color: '#111827'},
  note: {marginTop: 18, color: '#6B7280', fontSize: 12, lineHeight: 18},
});
