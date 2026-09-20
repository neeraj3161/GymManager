import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { container } from '../../../di/container';
import { useAuthStore } from '../../../store/authStore';

import {
  AppUpdateInfo,
  appUpdateService,
} from '../../../services/appUpdateService';
import { exportCollectionPdf } from '../../../infrastructure/reports/exportCollectionPdf';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const logout = useAuthStore(state => state.logout);

  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');

  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCollections, setShowCollections] = useState(false);

  // App updater state
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);

  // ---------------------------------------------------------------------------
  // Collection settings
  // ---------------------------------------------------------------------------

  const loadCollectionSetting = useCallback(async () => {
    try {
      const value =
        await container.useCases.getShowCollectionsSetting.execute();

      setShowCollections(Boolean(value));
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Unable to load collection setting',
      );
    }
  }, []);

  const toggleCollections = async (value: boolean) => {
    setShowCollections(value);

    try {
      await container.useCases.updateShowCollectionsSetting.execute(value);
    } catch (e) {
      setShowCollections(!value);

      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Unable to save setting',
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Collection export
  // ---------------------------------------------------------------------------

  const exportCollection = async (period: 'month' | 'year') => {
    try {
      const now = new Date();

      const start =
        period === 'month'
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), 0, 1);

      const end =
        period === 'month'
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : new Date(now.getFullYear() + 1, 0, 1);

      const fmt = (x: Date) =>
        `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(x.getDate()).padStart(2, '0')}`;

      const report = await container.useCases.getCollectionReport.execute(
        fmt(start),
        fmt(end),
      );

      const monthName = now.toLocaleDateString('en-IN', { month: 'long' });
      const title =
        period === 'month'
          ? `${monthName} ${now.getFullYear()} Collection`
          : `${now.getFullYear()} Collection`;
      const fileName = `gymmanager-${period}-collection-${now.getFullYear()}.pdf`;

      await exportCollectionPdf(report, title, fileName);
    } catch (e) {
      Alert.alert(
        'Export failed',
        e instanceof Error ? e.message : 'Unable to create report',
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Gym profile
  // ---------------------------------------------------------------------------

  const loadGymProfile = useCallback(async () => {
    try {
      setLoading(true);

      const gym = await container.useCases.getGymProfile.execute();

      if (!gym) {
        throw new Error('Gym profile not found');
      }

      setGymName(gym.name);
      setPhone(gym.phone ?? '');
      setEmail(gym.email ?? '');
      setAddress(gym.address ?? '');
      setCurrency(gym.currency || 'INR');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load gym profile';

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGymProfile();
      loadCollectionSetting();
    }, [loadGymProfile, loadCollectionSetting]),
  );

  const saveGymProfile = async () => {
    if (!gymName.trim()) {
      Alert.alert('Invalid', 'Gym name is required.');
      return;
    }

    try {
      setSaving(true);

      await container.useCases.updateGymProfile.execute({
        name: gymName,
        phone,
        email,
        address,
        currency,
      });

      setEditingProfile(false);

      Alert.alert('Saved', 'Gym profile updated successfully.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save gym profile';

      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // App updater
  // ---------------------------------------------------------------------------

  const handleCheckForUpdates = async () => {
    if (checkingForUpdate) {
      return;
    }

    try {
      setCheckingForUpdate(true);

      const result = await appUpdateService.check();

      if (!result) {
        Alert.alert(
          'No update available',
          'You are using the latest version of Gym Manager.',
        );

        return;
      }

      setUpdateInfo(result);
    } catch (error) {
      console.error('Update check failed:', error);

      Alert.alert(
        'Update check failed',
        error instanceof Error ? error.message : 'Unable to check for updates.',
      );
    } finally {
      setCheckingForUpdate(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Screen
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.subtitle}>
          Manage your gym and application settings
        </Text>

        {/* ---------------------------------------------------------------- */}
        {/* Gym                                                               */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Gym</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>
              {gymName.trim().charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{gymName || 'Your Gym'}</Text>

            <Text style={styles.profileDetail}>
              {phone || 'No phone number added'}
            </Text>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() => setEditingProfile(value => !value)}
          >
            <Text style={styles.editButtonText}>
              {editingProfile ? 'Close' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        {editingProfile && (
          <View style={styles.editorCard}>
            <Text style={styles.inputLabel}>Gym Name *</Text>

            <TextInput
              style={styles.input}
              value={gymName}
              onChangeText={setGymName}
              placeholder="Enter gym name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Phone</Text>

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Gym phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email</Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Gym email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Address</Text>

            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Gym address"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Currency</Text>

            <TextInput
              style={styles.input}
              value={currency}
              onChangeText={setCurrency}
              placeholder="INR"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              maxLength={5}
            />

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveGymProfile}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Gym Profile'}
              </Text>
            </Pressable>
          </View>
        )}

        <SettingRow
          title="Membership Plans"
          subtitle="Manage durations and prices"
          onPress={() => navigation.navigate('Plans')}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Reminders                                                         */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Reminders</Text>

        <ToggleRow
          title="Birthday reminders"
          subtitle="Show upcoming birthdays"
        />

        <ToggleRow title="Fee reminders" subtitle="Remind about overdue fees" />

        {/* ---------------------------------------------------------------- */}
        {/* Collections                                                       */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Collections</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Show Collections on Dashboard</Text>

            <Text style={styles.rowSubtitle}>
              Show monthly and yearly payments received
            </Text>
          </View>

          <Switch value={showCollections} onValueChange={toggleCollections} />
        </View>

        <SettingRow
          title="Download Monthly Collection"
          subtitle="Save a monthly collection PDF with insights"
          onPress={() => exportCollection('month')}
        />

        <SettingRow
          title="Download Yearly Collection"
          subtitle="Save a yearly collection PDF with insights"
          onPress={() => exportCollection('year')}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Data                                                              */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Data</Text>

        <SettingRow
          title="Backup & Restore"
          subtitle="Export or restore your database"
          onPress={() => navigation.navigate('Backup')}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Application                                                       */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Application</Text>

        <SettingRow
          title="Check for updates"
          subtitle={
            checkingForUpdate
              ? 'Checking for updates...'
              : 'Check for a newer version of Gym Manager'
          }
          onPress={handleCheckForUpdates}
          disabled={checkingForUpdate}
        />

        <SettingRow
          title="About Gym Manager"
          subtitle="Offline-first gym management"
          onPress={() =>
            Alert.alert('Gym Manager', 'Local-first gym management app.')
          }
        />

        {/* ---------------------------------------------------------------- */}
        {/* Account                                                           */}
        {/* ---------------------------------------------------------------- */}

        <Text style={styles.group}>Account</Text>

        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Log out', 'Are you sure you want to log out?', [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await logout();
                  } catch (error) {
                    Alert.alert(
                      'Logout failed',
                      error instanceof Error
                        ? error.message
                        : 'Unable to log out.',
                    );
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Update Modal                                                        */}
      {/* ------------------------------------------------------------------ */}

      <AppUpdateModal
        updateInfo={updateInfo}
        onClose={() => setUpdateInfo(null)}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Setting Row
// ============================================================================

function SettingRow({
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// ============================================================================
// Toggle Row
// ============================================================================

function ToggleRow({ title, subtitle }: { title: string; subtitle: string }) {
  const [enabled, setEnabled] = useState(true);

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Switch value={enabled} onValueChange={setEnabled} />
    </View>
  );
}

// ============================================================================
// Update Modal
// ============================================================================

function AppUpdateModal({
  updateInfo,
  onClose,
}: {
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!updateInfo) {
    return null;
  }

  const { update } = updateInfo;

  const handleUpdate = async () => {
    if (updating) {
      return;
    }

    try {
      setError(null);
      setUpdating(true);

      await appUpdateService.downloadAndInstall(update);

      // Android installer should now be open.
      onClose();
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
      <View style={styles.updateOverlay}>
        <View style={styles.updateCard}>
          <Text style={styles.updateTitle}>New update available</Text>

          <Text style={styles.updateVersion}>Version {update.versionName}</Text>

          <Text style={styles.updateCurrentVersion}>
            Current version: {updateInfo.currentVersionName}
          </Text>

          {update.releaseNotes ? (
            <View style={styles.updateNotesContainer}>
              <Text style={styles.updateNotesTitle}>What's new</Text>

              <Text style={styles.updateNotes}>{update.releaseNotes}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.updateError}>{error}</Text> : null}

          {updating ? (
            <View style={styles.updateProgress}>
              <ActivityIndicator size="large" />

              <Text style={styles.updateProgressText}>
                Downloading update...
              </Text>

              <Text style={styles.updateSubText}>
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

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 13,
  },

  group: {
    marginTop: 24,
    marginBottom: 9,
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileIconText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#4F46E5',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  profileDetail: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },

  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    marginBottom: 13,
  },

  multilineInput: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowDisabled: {
    opacity: 0.6,
  },

  rowInfo: {
    flex: 1,
  },

  rowTitle: {
    fontWeight: '800',
    color: '#111827',
  },

  rowSubtitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
  },

  chevron: {
    fontSize: 28,
    color: '#9CA3AF',
  },

  logoutButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },

  // --------------------------------------------------------------------------
  // Update modal
  // --------------------------------------------------------------------------

  updateOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },

  updateCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },

  updateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  updateVersion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  updateCurrentVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },

  updateNotesContainer: {
    marginBottom: 20,
  },

  updateNotesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },

  updateNotes: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },

  updateError: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  updateProgress: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  updateProgressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },

  updateSubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },

  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#111827',
    marginTop: 8,
  },

  updateButtonText: {
    color: '#FFFFFF',
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
    color: '#666666',
  },

  mandatoryText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666666',
    marginTop: 12,
  },
});
