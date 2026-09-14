import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { Membership } from '../../../domain/entities/Membership';
import { container } from '../../../di/container';
import { PreviousDueSection } from '../../components/PreviousDueSection';

import type { PreviousDueAction } from '../../components/PreviousDueSection';
import { PaymentMethod } from '../../../domain/entities/Payment';

type RouteParams = {
  memberId: string;
  memberName: string;
};

export function ChangeMembershipPlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { memberId, memberName } = route.params as RouteParams;

  const [currentMembership, setCurrentMembership] = useState<Membership | null>(
    null,
  );

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [unusedDays, setUnusedDays] = useState(0);
  const [unusedCredit, setUnusedCredit] = useState(0);

  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const [previousDue, setPreviousDue] = useState(0);

  const [previousDueAction, setPreviousDueAction] =
    useState<PreviousDueAction>('collect');

  const [collectAmount, setCollectAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [writeOffReason, setWriteOffReason] = useState('');
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [currentMembership, allPlans] = await Promise.all([
        container.repositories.membership.getByMemberId(memberId),
        container.useCases.getPlans.execute(),
      ]);

      setCurrentMembership(currentMembership);

      // ADD THIS HERE
      if (currentMembership) {
        const due = await container.useCases.getMembershipDue.execute(
          currentMembership.id,
        );

        setPreviousDue(due.remainingAmount);

        setCollectAmount(
          due.remainingAmount > 0 ? String(due.remainingAmount) : '',
        );
      } else {
        setPreviousDue(0);
        setCollectAmount('');
      }

      const activePlans = allPlans.filter(plan => plan.active);
      setPlans(activePlans);

      // whatever else your existing load() does...
    } catch (error) {
      // existing error handling
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!currentMembership || !selectedPlan) {
      setUnusedDays(0);
      setUnusedCredit(0);
      return;
    }

    const result = calculateUnusedCredit(currentMembership);

    setUnusedDays(result.unusedDays);
    setUnusedCredit(result.unusedCredit);
  }, [currentMembership, selectedPlanId, selectedPlan]);

  const calculateUnusedCredit = (membership: Membership) => {
    const today = startOfDay(new Date());
    const endDate = startOfDay(new Date(membership.endDate));
    const startDate = startOfDay(new Date(membership.startDate));

    if (endDate <= today) {
      return {
        unusedDays: 0,
        unusedCredit: 0,
      };
    }

    const totalDays = differenceInDays(startDate, endDate) + 1;

    const unusedDays = differenceInDays(today, endDate);

    const dailyRate = membership.amount / Math.max(totalDays, 1);

    const unusedCredit = Math.min(
      membership.amount,
      Math.round(dailyRate * unusedDays),
    );

    return {
      unusedDays,
      unusedCredit,
    };
  };

  const baseAmount = selectedPlan
    ? Math.max(selectedPlan.amount - unusedCredit, 0)
    : 0;

  const finalAmount =
    previousDueAction === 'carry_forward'
      ? baseAmount + previousDue
      : baseAmount;

  const changePlan = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a plan', 'Please select a membership plan.');
      return;
    }

    if (!currentMembership) {
      Alert.alert(
        'No membership',
        'This member does not have an active membership.',
      );
      return;
    }

    Alert.alert(
      'Confirm Plan Change',
      `Change ${memberName}'s membership to ${selectedPlan.name}?\n\n` +
        `New plan: ₹${selectedPlan.amount.toLocaleString('en-IN')}\n` +
        `Unused credit: ₹${unusedCredit.toLocaleString('en-IN')}\n` +
        `Amount to pay: ₹${finalAmount.toLocaleString('en-IN')}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setChanging(true);

              const result =
                await container.useCases.changeMembershipPlan.execute({
                  memberId,
                  newPlanId: selectedPlan.id,
                  applyUnusedCredit: true,
                });

              Alert.alert(
                'Plan Changed',
                `Membership changed to ${selectedPlan.name}.\n\n` +
                  `Unused credit: ₹${result.unusedCredit.toLocaleString(
                    'en-IN',
                  )}\n` +
                  `Amount to pay: ₹${result.finalAmount.toLocaleString(
                    'en-IN',
                  )}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (error) {
              Alert.alert(
                'Unable to change plan',
                error instanceof Error
                  ? error.message
                  : 'Something went wrong.',
              );
            } finally {
              setChanging(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading membership...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentMembership) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No membership found</Text>
          <Text style={styles.emptyText}>
            This member does not have a membership that can be changed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Change Membership Plan</Text>
        <Text style={styles.memberName}>{memberName}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Membership</Text>

          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            ₹{currentMembership.amount.toLocaleString('en-IN')}
          </Text>

          <Text style={styles.label}>Valid until</Text>
          <Text style={styles.value}>
            {formatDate(currentMembership.endDate)}
          </Text>

          {unusedDays > 0 ? (
            <View style={styles.creditBox}>
              <Text style={styles.creditTitle}>Unused membership</Text>

              <Text style={styles.creditText}>
                {unusedDays} day{unusedDays > 1 ? 's' : ''} remaining
              </Text>

              <Text style={styles.creditAmount}>
                Credit: ₹{unusedCredit.toLocaleString('en-IN')}
              </Text>
            </View>
          ) : (
            <Text style={styles.noCredit}>No unused membership credit.</Text>
          )}
        </View>

        <PreviousDueSection
          amount={previousDue}
          action={previousDueAction}
          onActionChange={setPreviousDueAction}
          collectAmount={collectAmount}
          onCollectAmountChange={setCollectAmount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          writeOffReason={writeOffReason}
          onWriteOffReasonChange={setWriteOffReason}
        />

        <Text style={styles.sectionHeading}>Select New Plan</Text>

        {plans.map(plan => {
          const selected = plan.id === selectedPlanId;

          return (
            <Pressable
              key={plan.id}
              style={[styles.planCard, selected && styles.selectedPlan]}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>

                <Text style={styles.planDuration}>
                  {plan.durationMonths} month
                  {plan.durationMonths > 1 ? 's' : ''}
                </Text>

                {plan.description ? (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                ) : null}
              </View>

              <View style={styles.planRight}>
                <Text style={styles.planAmount}>
                  ₹{plan.amount.toLocaleString('en-IN')}
                </Text>

                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}

        {selectedPlan ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>New plan</Text>
              <Text style={styles.summaryValue}>
                ₹{selectedPlan.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Unused credit</Text>
              <Text style={styles.creditValue}>
                - ₹{unusedCredit.toLocaleString('en-IN')}
              </Text>
            </View>

            {previousDue > 0 && previousDueAction === 'carry_forward' ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Previous due carried forward
                </Text>
                <Text style={styles.dueValue}>
                  + ₹{previousDue.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}

            {previousDue > 0 && previousDueAction === 'write_off' ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Previous due written off
                </Text>
                <Text style={styles.writeOffValue}>
                  ₹{previousDue.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}

            {previousDue > 0 && previousDueAction === 'collect' ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Previous due to collect</Text>
                <Text style={styles.collectValue}>
                  ₹{previousDue.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Amount to pay</Text>
              <Text style={styles.totalValue}>
                ₹{finalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable
          style={[styles.confirmButton, changing && styles.disabledButton]}
          onPress={changePlan}
          disabled={changing}
        >
          <Text style={styles.confirmText}>
            {changing ? 'Changing...' : 'Confirm Plan Change'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(start: Date, end: Date): number {
  return Math.max(
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    padding: 16,
    paddingBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  memberName: {
    marginTop: 4,
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 15,
  },

  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 7,
  },

  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },

  creditBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 13,
    marginTop: 15,
  },

  creditTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  creditText: {
    marginTop: 4,
    color: '#374151',
  },

  creditAmount: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  noCredit: {
    marginTop: 15,
    color: '#6B7280',
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedPlan: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  planDuration: {
    marginTop: 3,
    color: '#6B7280',
  },

  planDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  planRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  planAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: '#2563EB',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginTop: 12,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 13,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },

  summaryLabel: {
    color: '#6B7280',
  },

  summaryValue: {
    fontWeight: '700',
    color: '#111827',
  },

  creditValue: {
    fontWeight: '700',
    color: '#16A34A',
  },

  dueValue: {
    fontWeight: '700',
    color: '#B00020',
  },

  writeOffValue: {
    fontWeight: '700',
    color: '#6B7280',
  },

  collectValue: {
    fontWeight: '700',
    color: '#111827',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  confirmButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.5,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
  },
});
