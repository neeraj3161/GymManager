import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const plans = [
  {name: '1 Month', months: 1, amount: '₹1,200'},
  {name: '3 Months', months: 3, amount: '₹3,000'},
  {name: '6 Months', months: 6, amount: '₹5,500'},
  {name: '1 Year', months: 12, amount: '₹9,500'},
];

export function PlansScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Create and manage gym plans.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() => Alert.alert('Create plan', 'Plan creation will be connected to SQLite next.')}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {plans.map(plan => (
          <View style={styles.card} key={plan.name}>
            <View>
              <Text style={styles.name}>{plan.name}</Text>
              <Text style={styles.duration}>{plan.months} month{plan.months > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{plan.amount}</Text>
              <Pressable onPress={() => Alert.alert('Edit plan', `Edit ${plan.name}`)}>
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
