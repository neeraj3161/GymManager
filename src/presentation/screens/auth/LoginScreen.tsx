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

export function LoginScreen() {
  const login = useAuthStore(state => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    if (!username.trim() || !password) {
      Alert.alert('Missing information', 'Enter username and password.');
      return;
    }

    try {
      setLoading(true);

      console.log('LOGIN STARTED');

      const user = await container.useCases.login.execute({
        username: username.trim(),
        password,
      });

      console.log('LOGIN SUCCESS: User found', user);

      await login(user);

      console.log('SESSION SAVED');
    } catch (error) {
      console.error('LOGIN ERROR:', error);

      Alert.alert(
        'Login failed',
        error instanceof Error ? error.message : String(error),
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

            <Text style={styles.subtitle}>Sign in to your gym</Text>

            <Text style={styles.label}>Username</Text>

            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.input}
            />

            <Pressable
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
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
    padding: 24,
    justifyContent: 'center',
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 30,
    color: '#6B7280',
  },

  label: {
    fontWeight: '700',
    marginBottom: 7,
    color: '#374151',
  },

  input: {
    backgroundColor: '#FFFFFF',
    height: 52,
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
