import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { container } from '../../../di/container';
import { useAuthStore } from '../../../store/authStore';

export function OwnerSetupScreen() {
  const login = useAuthStore(state => state.login);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOwner = async () => {
    if (loading) return;

    if (!name.trim() || !username.trim() || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please make sure both passwords are the same.',
      );
      return;
    }

    try {
      setLoading(true);

      const user = await container.useCases.createOwner.execute({
        name: name.trim(),
        username: username.trim(),
        password,
      });

      await login(user);

      Alert.alert(
        'Owner account created',
        'Your gym owner account has been created.',
      );
    } catch (error) {
      Alert.alert(
        'Setup failed',
        error instanceof Error
          ? error.message
          : 'Unable to create the owner account.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={styles.logo}>Gym Manager</Text>

            <Text style={styles.title}>Set up your gym</Text>

            <Text style={styles.subtitle}>Create the first owner account.</Text>

            <Text style={styles.label}>Your Name</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>Username</Text>

            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>Confirm Password</Text>

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleCreateOwner}
              style={styles.input}
            />

            <Pressable
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleCreateOwner}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : 'Create Owner Account'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  title: {
    marginTop: 28,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 26,
    color: '#6B7280',
  },

  label: {
    fontWeight: '700',
    marginBottom: 7,
    color: '#374151',
  },

  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 17,
    color: '#111827',
  },

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
