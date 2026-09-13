import React, {useCallback, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function PlansScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const load = useCallback(async () => {
    setPlans(await container.useCases.getPlans.execute());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Plans are stored locally in SQLite.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() =>
              Alert.alert('Next step', 'Plan creation and editing will be connected next.')
            }>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {plans.map(plan => (
          <View style={styles.card} key={plan.id}>
            <View>
              <Text style={styles.name}>{plan.name}</Text>
              <Text style={styles.duration}>
                {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>
                ₹{plan.amount.toLocaleString('en-IN')}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert('Next step', `Editing ${plan.name} will be connected next.`)
                }>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280'},
  add: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  addText: {color: '#FFFFFF', fontWeight: '800'},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {fontSize: 17, fontWeight: '800', color: '#111827'},
  duration: {marginTop: 4, color: '#6B7280'},
  right: {alignItems: 'flex-end'},
  amount: {fontSize: 18, fontWeight: '800', color: '#111827'},
  edit: {marginTop: 5, fontWeight: '700', color: '#2563EB'},
});
