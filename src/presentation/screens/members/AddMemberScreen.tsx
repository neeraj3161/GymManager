import React, {useEffect, useState} from 'react';
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

import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planId, setPlanId] = useState('');
useEffect(() => {
  container.useCases.getPlans.execute().then(data => {
    setPlans(data);
    if (data[0]) {
      setPlanId(data[0].id);
    }
  });
}, []);

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Name and phone number are required.');
      return;
    }

    try {
      const parts = name.trim().split(/\s+/);
      const member = await container.useCases.addMember.execute({
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || undefined,
        phone,
        email,
        dateOfBirth: dob,
      });

      if (planId) {
        await container.useCases.createMembership.execute({
          memberId: member.id,
          planId,
        });
      }

      Alert.alert('Member added', `${name} has been saved locally.`, [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert(
        'Could not add member',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Member</Text>
        <Text style={styles.subtitle}>
          This member will be saved directly to the phone's local SQLite database.
        </Text>

        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Rahul Sharma" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Optional" keyboardType="email-address" />
        <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />

        <Text style={styles.label}>Membership plan</Text>

        {plans.map(plan => (
          <Pressable
            key={plan.id}
            style={[styles.plan, planId === plan.id && styles.planSelected]}
            onPress={() => setPlanId(plan.id)}>
            <View style={styles.planInfo}>
              <Text
                style={[
                  styles.planName,
                  planId === plan.id && styles.planTextSelected,
                ]}>
                {plan.name}
              </Text>
              <Text
                style={[
                  styles.planDescription,
                  planId === plan.id && styles.planTextSelected,
                ]}>
                {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                planId === plan.id && styles.planTextSelected,
              ]}>
              ₹{plan.amount.toLocaleString('en-IN')}
            </Text>
          </Pressable>
        ))}

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
  subtitle: {marginTop: 5, marginBottom: 24, color: '#6B7280', lineHeight: 19},
  field: {marginBottom: 16},
  label: {fontWeight: '700', color: '#374151', marginBottom: 7},
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  plan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planSelected: {backgroundColor: '#111827'},
  planInfo: {flex: 1},
  planName: {fontWeight: '800', color: '#111827'},
  planDescription: {marginTop: 3, color: '#6B7280', fontSize: 12},
  amount: {fontWeight: '800', color: '#111827'},
  planTextSelected: {color: '#FFFFFF'},
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
