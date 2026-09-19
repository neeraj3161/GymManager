import React, { useState } from 'react';
import { Alert, Button, Text, View } from 'react-native';
import { appUpdater } from '../../services/appUpdater';

type UpdateManifest = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  fileName: string;
  mandatory?: boolean;
  releaseNotes?: string;
};

const UPDATE_URL = 'http://10.0.2.2:8080/update.json';

export default function UpdateTestScreen() {
  const [version, setVersion] = useState<string>('Loading...');
  const [checking, setChecking] = useState(false);

  const loadVersion = async () => {
    try {
      const result = await appUpdater.getVersion();

      setVersion(`${result.versionName} (${result.versionCode})`);

      return result;
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Updater Error',
        error instanceof Error ? error.message : 'Unable to read app version',
      );

      throw error;
    }
  };

  const checkForUpdate = async () => {
    try {
      setChecking(true);

      const current = await loadVersion();

      const response = await fetch(UPDATE_URL);

      if (!response.ok) {
        throw new Error(`Update server returned ${response.status}`);
      }

      const update = (await response.json()) as UpdateManifest;

      if (update.versionCode <= current.versionCode) {
        Alert.alert('No Update', 'You are already on the latest version.');
        return;
      }

      Alert.alert(
        `Update ${update.versionName}`,
        update.releaseNotes ?? 'A new version is available.',
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update',
            onPress: async () => {
              try {
                const fileName = await appUpdater.downloadApk(
                  update.apkUrl,
                  update.fileName,
                );

                await appUpdater.installApk(fileName);
              } catch (error) {
                console.error(error);

                Alert.alert(
                  'Update Error',
                  error instanceof Error
                    ? error.message
                    : 'Unable to install update.',
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Update Check Failed',
        error instanceof Error ? error.message : 'Unable to check for updates.',
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 16,
      }}
    >
      <Text>Installed version: {version}</Text>

      <Button title="Load Version" onPress={loadVersion} />

      <Button
        title={checking ? 'Checking...' : 'Check for Update'}
        onPress={checkForUpdate}
        disabled={checking}
      />
    </View>
  );
}
