import React from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const payments = [
  {id: '1', member: 'Rahul Sharma', amount: '₹2,000', date: '13 Sep 2026', type: 'Membership'},
  {id: '2', member: 'Sneha Kulkarni', amount: '₹9,500', date: '12 Sep 2026', type: 'Membership'},
  {id: '3', member: 'Amit Patil', amount: '₹1,000', date: '11 Sep 2026', type: 'Partial payment'},
];

export function PaymentsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Collected this month</Text>
        <Text style={styles.total}>₹1,24,500</Text>
        <Text style={styles.pending}>₹24,500 pending</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Recent payments</Text>
        <Pressable
          style={styles.button}
          onPress={() => undefined}>
          <Text style={styles.buttonText}>+ Payment</Text>
        </Pressable>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Text>₹</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.member}>{item.member}</Text>
              <Text style={styles.meta}>{item.type} • {item.date}</Text>
            </View>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  summary: {backgroundColor: '#FFFFFF', margin: 16, padding: 18, borderRadius: 18},
  summaryLabel: {color: '#6B7280'},
  total: {fontSize: 30, fontWeight: '800', marginTop: 4, color: '#111827'},
  pending: {marginTop: 4, color: '#B45309'},
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: '800', color: '#111827'},
  button: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  buttonText: {color: '#FFFFFF', fontWeight: '800'},
  list: {padding: 16},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1, marginLeft: 12},
  member: {fontWeight: '800', color: '#111827'},
  meta: {marginTop: 4, color: '#6B7280', fontSize: 12},
  amount: {fontWeight: '800', color: '#111827'},
});
