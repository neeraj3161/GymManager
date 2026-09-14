import React, { useCallback, useState } from 'react';
import {
  Alert,
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

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');

  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
    }, [loadGymProfile]),
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <Text style={styles.group}>Reminders</Text>

        <ToggleRow
          title="Birthday reminders"
          subtitle="Show upcoming birthdays"
        />

        <ToggleRow title="Fee reminders" subtitle="Remind about overdue fees" />

        <Text style={styles.group}>Data</Text>

        <SettingRow
          title="Backup & Restore"
          subtitle="Export or restore your database"
          onPress={() => navigation.navigate('Backup')}
        />

        <Text style={styles.group}>Application</Text>

        <SettingRow
          title="About Gym Manager"
          subtitle="Offline-first gym management"
          onPress={() =>
            Alert.alert('Gym Manager', 'Local-first gym management app.')
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

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

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
