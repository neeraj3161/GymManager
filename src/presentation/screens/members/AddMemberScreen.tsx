import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [plan, setPlan] = useState('3 Months');

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Name and phone number are required.');
      return;
    }

    Alert.alert('Member added', `${name} has been added.`, [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Member</Text>
        <Text style={styles.subtitle}>Enter the member's basic information.</Text>

        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Rahul Sharma" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Optional" keyboardType="email-address" />
        <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />

        <Text style={styles.label}>Membership plan</Text>
        <View style={styles.planRow}>
          {['1 Month', '3 Months', '6 Months', '1 Year'].map(item => (
            <Pressable
              key={item}
              style={[styles.plan, plan === item && styles.planSelected]}
              onPress={() => setPlan(item)}>
              <Text
                style={[
                  styles.planText,
                  plan === item && styles.planTextSelected,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Selected plan</Text>
          <Text style={styles.summaryValue}>{plan}</Text>
        </View>

        <Pressable style={styles.save} onPress={save}>
          <Text style={styles.saveText}>Add Member</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 40},
  title: {fontSize: 24, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 5, marginBottom: 24, color: '#6B7280'},
  field: {marginBottom: 16},
  label: {fontWeight: '700', color: '#374151', marginBottom: 7},
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  planRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  plan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  planSelected: {backgroundColor: '#111827'},
  planText: {fontWeight: '700', color: '#374151'},
  planTextSelected: {color: '#FFFFFF'},
  summary: {
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {color: '#6B7280'},
  summaryValue: {fontWeight: '800', color: '#111827'},
  save: {
    marginTop: 18,
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {color: '#FFFFFF', fontWeight: '800', fontSize: 16},
});
