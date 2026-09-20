import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppUpdateInfo, appUpdateService } from '../services/appUpdateService';

type Props = {
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
};

export default function AppUpdateModal({ updateInfo, onClose }: Props) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!updateInfo) {
    return null;
  }

  const { update } = updateInfo;

  const handleUpdate = async () => {
    try {
      setError(null);
      setUpdating(true);

      await appUpdateService.downloadAndInstall(update);
    } catch (err) {
      console.error('App update failed:', err);

      setUpdating(false);

      setError(
        err instanceof Error ? err.message : 'Unable to install the update.',
      );
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!update.mandatory && !updating) {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>New update available</Text>

          <Text style={styles.version}>Version {update.versionName}</Text>

          <Text style={styles.currentVersion}>
            Current version: {updateInfo.currentVersionName}
          </Text>

          {update.releaseNotes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>What's new</Text>

              <Text style={styles.notes}>{update.releaseNotes}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {updating ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" />

              <Text style={styles.progressText}>Downloading update...</Text>

              <Text style={styles.subText}>
                Android installer will open when the download finishes.
              </Text>
            </View>
          ) : (
            <>
              <Pressable style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Update</Text>
              </Pressable>

              {!update.mandatory ? (
                <Pressable style={styles.laterButton} onPress={onClose}>
                  <Text style={styles.laterButtonText}>Later</Text>
                </Pressable>
              ) : (
                <Text style={styles.mandatoryText}>
                  This update is required.
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },

  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },

  version: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  currentVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },

  notesContainer: {
    marginBottom: 20,
  },

  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  notes: {
    fontSize: 14,
    lineHeight: 20,
  },

  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#111',
    marginTop: 8,
  },

  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  laterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8,
  },

  laterButtonText: {
    fontSize: 15,
    color: '#666',
  },

  mandatoryText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    marginTop: 12,
  },

  error: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 12,
  },

  progressContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  progressText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },

  subText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
});
