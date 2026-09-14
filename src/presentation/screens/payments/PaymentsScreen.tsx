import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import { container } from '../../../di/container';
import { useAuthStore } from '../../../store/authStore';

import { Payment, PaymentMethod } from '../../../domain/entities/Payment';
import { Membership } from '../../../domain/entities/Membership';
import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { MemberFeeStatus } from '../../../application/payments/GetMemberFeeStatus';

export default function PaymentsScreen() {
  const route = useRoute<any>();

  const memberId = route.params?.memberId as string;
  const memberName = route.params?.memberName ?? 'Member';

  const currentUser = useAuthStore(state => state.user);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [feeStatus, setFeeStatus] = useState<MemberFeeStatus | null>(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const loadPayments = useCallback(async () => {
    try {
      const [paymentData, membershipData, feeStatusData] = await Promise.all([
        container.useCases.getPaymentHistory.execute(memberId),
        container.repositories.membership.getByMemberId(memberId),
        container.useCases.getMemberFeeStatus.execute(memberId),
      ]);

      setPayments(paymentData);
      setMembership(membershipData);
      setFeeStatus(feeStatusData);

      if (membershipData) {
        const planData = await container.repositories.plan.getById(
          membershipData.planId,
        );

        setPlan(planData);
      } else {
        setPlan(null);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load payments.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments]),
  );

  const refresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const handleRecordPayment = async () => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert(
        'Invalid amount',
        'Enter a payment amount greater than zero.',
      );
      return;
    }

    if (!membership) {
      Alert.alert(
        'No membership',
        'This member does not have a current membership.',
      );
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'User not found',
        'Unable to identify the staff user recording this payment.',
      );
      return;
    }

    const remainingAmount = feeStatus?.remainingAmount ?? 0;

    if (remainingAmount <= 0) {
      Alert.alert(
        'Already paid',
        'There is no outstanding amount for the current membership.',
      );
      return;
    }

    if (numericAmount > remainingAmount) {
      Alert.alert(
        'Amount too high',
        `The maximum payment allowed is ${formatCurrency(remainingAmount)}.`,
      );
      return;
    }

    try {
      setSaving(true);

      await container.useCases.recordPayment.execute({
        memberId,
        membershipId: membership.id,
        amount: numericAmount,
        paymentMethod,
        recordedBy: currentUser.id,
        notes: notes.trim() || undefined,
      });

      setAmount('');
      setNotes('');

      await loadPayments();

      Alert.alert(
        'Payment recorded',
        `${formatCurrency(numericAmount)} payment recorded successfully.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to record payment',
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    } finally {
      setSaving(false);
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>

        <Text style={styles.paymentDate}>{formatDate(item.paymentDate)}</Text>
      </View>

      <View style={styles.paymentRight}>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod.toUpperCase()}
        </Text>

        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const remainingAmount = feeStatus?.remainingAmount ?? 0;
  const totalPaid = feeStatus?.totalPaid ?? 0;
  const membershipAmount = feeStatus
    ? feeStatus.membershipAmount + feeStatus.adjustmentAmount
    : membership?.amount ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={renderPayment}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Payments</Text>

            <Text style={styles.memberName}>{memberName}</Text>

            {membership ? (
              <View style={styles.membershipCard}>
                <View style={styles.membershipInfo}>
                  <Text style={styles.membershipLabel}>Current Membership</Text>

                  <Text style={styles.membershipPlan}>
                    {plan?.name ?? 'Membership'}
                  </Text>

                  <Text style={styles.membershipDates}>
                    {formatDate(membership.startDate)} -{' '}
                    {formatDate(membership.endDate)}
                  </Text>
                </View>

                <Text style={styles.membershipAmount}>
                  {formatCurrency(membershipAmount)}
                </Text>
              </View>
            ) : (
              <View style={styles.noMembershipCard}>
                <Text style={styles.noMembershipTitle}>
                  No current membership
                </Text>

                <Text style={styles.noMembershipText}>
                  Add or renew a membership before recording a payment.
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Paid</Text>

                <Text style={styles.summaryAmount}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Due</Text>

                <Text
                  style={[
                    styles.summaryAmount,
                    remainingAmount > 0 && styles.dueAmount,
                  ]}
                >
                  {formatCurrency(remainingAmount)}
                </Text>
              </View>
            </View>

            {feeStatus ? (
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Fee Status</Text>

                <Text
                  style={[styles.statusValue, getStatusStyle(feeStatus.status)]}
                >
                  {feeStatus.status}
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Record Payment</Text>

            {remainingAmount > 0 ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={`Amount (max ${formatCurrency(
                    remainingAmount,
                  )})`}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!saving}
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
                      disabled={saving}
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
                  editable={!saving}
                />

                <TouchableOpacity
                  style={[styles.recordButton, saving && styles.disabledButton]}
                  onPress={handleRecordPayment}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.recordButtonText}>Record Payment</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.paidCard}>
                <Text style={styles.paidTitle}>Membership fully paid</Text>

                <Text style={styles.paidText}>
                  There is no outstanding amount for this membership.
                </Text>
              </View>
            )}

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

function getStatusStyle(status: MemberFeeStatus['status']) {
  switch (status) {
    case 'PAID':
      return styles.paidStatus;

    case 'PARTIAL':
      return styles.partialStatus;

    case 'DUE':
      return styles.dueStatus;

    case 'OVERDUE':
      return styles.overdueStatus;

    default:
      return styles.neutralStatus;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  memberName: {
    fontSize: 17,
    marginTop: 4,
    marginBottom: 18,
    color: '#6B7280',
  },

  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  membershipInfo: {
    flex: 1,
    marginRight: 12,
  },

  membershipLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  membershipPlan: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  membershipDates: {
    marginTop: 5,
    fontSize: 13,
    color: '#6B7280',
  },

  membershipAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  noMembershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  noMembershipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  noMembershipText: {
    marginTop: 5,
    color: '#6B7280',
    lineHeight: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  summaryAmount: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  dueAmount: {
    color: '#B91C1C',
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusLabel: {
    color: '#6B7280',
    fontWeight: '600',
  },

  statusValue: {
    fontSize: 12,
    fontWeight: '900',
  },

  paidStatus: {
    color: '#15803D',
  },

  partialStatus: {
    color: '#B45309',
  },

  dueStatus: {
    color: '#B45309',
  },

  overdueStatus: {
    color: '#B91C1C',
  },

  neutralStatus: {
    color: '#6B7280',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 6,
    color: '#111827',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },

  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },

  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  methodButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  selectedMethod: {
    backgroundColor: '#111827',
  },

  methodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  selectedMethodText: {
    color: '#FFFFFF',
  },

  recordButton: {
    height: 52,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  paidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  paidTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },

  paidText: {
    marginTop: 5,
    color: '#6B7280',
  },

  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  paymentInfo: {
    flex: 1,
  },

  paymentAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  paymentDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  paymentRight: {
    alignItems: 'flex-end',
    maxWidth: '50%',
  },

  paymentMethod: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  notes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },

  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 10,
    marginBottom: 20,
  },
});
