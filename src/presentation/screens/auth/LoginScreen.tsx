import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.logo}>Gym Manager</Text>
        <Text style={styles.subtitle}>Sign in to your gym</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          style={styles.button}
          onPress={() => Alert.alert('Login', 'Authentication will be connected to the local user database next.')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 24, justifyContent: 'center', flex: 1},
  logo: {fontSize: 30, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 6, marginBottom: 30, color: '#6B7280'},
  label: {fontWeight: '700', marginBottom: 7, color: '#374151'},
  input: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 17,
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {color: '#FFFFFF', fontWeight: '800'},
});
