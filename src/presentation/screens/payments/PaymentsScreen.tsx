import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { container } from '../../../di/container';
import { Payment, PaymentMethod } from '../../../domain/entities/Payment';
import { Membership } from '../../../domain/entities/Membership';

interface PaymentsScreenProps {
  route: {
    params: {
      memberId: string;
      memberName: string;
    };
  };
}

export default function PaymentsScreen({ route }: PaymentsScreenProps) {
  const { memberId, memberName } = route.params;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [membership, setMembership] = useState<Membership | null>(null);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const loadPayments = async () => {
    try {
      const [paymentData, total, membershipData] = await Promise.all([
        container.useCases.getPaymentHistory.execute(memberId),
        container.useCases.getTotalPaid.execute(memberId),
        container.repositories.membership.getByMemberId(memberId),
      ]);

      setPayments(paymentData);
      setTotalPaid(total);
      setMembership(membershipData);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load payments.',
      );
    }
  };

  useEffect(() => {
    loadPayments();
  }, [memberId]);

  const handleRecordPayment = async () => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert(
        'Invalid amount',
        'Enter a payment amount greater than zero.',
      );
      return;
    }

    try {
      const membership = await container.repositories.membership.getByMemberId(
        memberId,
      );

      if (!membership) {
        Alert.alert(
          'No membership',
          'This member does not have an active membership.',
        );
        return;
      }

      await container.useCases.recordPayment.execute({
        memberId,
        membershipId: membership.id,
        amount: numericAmount,
        paymentMethod,
        recordedBy: 'current-user',
        notes: notes.trim() || undefined,
      });
      setAmount('');
      setNotes('');

      await loadPayments();

      Alert.alert('Success', 'Payment recorded successfully.');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to record payment.',
      );
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View>
        <Text style={styles.paymentAmount}>
          ₹{item.amount.toLocaleString('en-IN')}
        </Text>

        <Text style={styles.paymentDate}>
          {new Date(item.paymentDate).toLocaleDateString('en-IN')}
        </Text>
      </View>

      <View style={styles.paymentRight}>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod.toUpperCase()}
        </Text>

        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={renderPayment}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Payments</Text>

            <Text style={styles.memberName}>{memberName}</Text>

            {membership && (
              <View style={styles.membershipCard}>
                <View>
                  <Text style={styles.membershipLabel}>Current Membership</Text>

                  <Text style={styles.membershipPlan}>Membership</Text>

                  <Text style={styles.membershipDates}>
                    {formatDate(membership.startDate)} -{' '}
                    {formatDate(membership.endDate)}
                  </Text>
                </View>

                <Text style={styles.membershipAmount}>
                  ₹{membership.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>

              <Text style={styles.summaryAmount}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Record Payment</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Payment Method</Text>

            <View style={styles.methods}>
              {(
                ['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]
              ).map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    paymentMethod === method && styles.selectedMethod,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === method && styles.selectedMethodText,
                    ]}
                  >
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleRecordPayment}
            >
              <Text style={styles.recordButtonText}>Record Payment</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Payment History</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No payments recorded yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  memberName: {
    fontSize: 18,
    marginTop: 4,
    marginBottom: 20,
    color: '#666',
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },

  summaryAmount: {
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
    color: '#111',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    color: '#111',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },

  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  methodButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  selectedMethod: {
    backgroundColor: '#111',
  },

  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  selectedMethodText: {
    color: '#fff',
  },

  recordButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },

  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  paymentDate: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },

  paymentRight: {
    alignItems: 'flex-end',
  },

  paymentMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },

  notes: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },

  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  membershipLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  membershipPlan: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  membershipDates: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  membershipAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
});
