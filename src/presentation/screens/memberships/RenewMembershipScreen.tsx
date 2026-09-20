import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { PaymentMethod } from '../../../domain/entities/Payment';

import { container } from '../../../di/container';
import { useAuthStore } from '../../../store/authStore';

import {
  PreviousDueSection,
  PreviousDueAction,
} from '../../components/PreviousDueSection';
import {
  MembershipStartDateOption,
  MembershipStartDateSection,
} from '../../components/MembershipStartDateSection';

export function RenewMembershipScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentUser = useAuthStore(state => state.user);

  const memberId = route.params?.memberId as string;
  const memberName = route.params?.memberName as string;

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [startDateOption, setStartDateOption] =
    useState<MembershipStartDateOption>('today');

  const [saving, setSaving] = useState(false);

  const [previousDue, setPreviousDue] = useState(0);

  const [previousDueAction, setPreviousDueAction] =
    useState<PreviousDueAction>('collect');

  const [collectAmount, setCollectAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [writeOffReason, setWriteOffReason] = useState('');

  const load = useCallback(async () => {
    try {
      const plansData = await container.useCases.getPlans.execute();

      setPlans(plansData);

      if (plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }

      const membership = await container.repositories.membership.getByMemberId(
        memberId,
      );

      if (!membership) {
        Alert.alert('Error', 'Current membership not found.');
        return;
      }

      setCurrentMembership(membership);
      setStartDateOption(
        isExpired(membership.endDate) ? 'previous_end' : 'today',
      );

      const due = await container.useCases.getMembershipDue.execute(
        membership.id,
      );

      setPreviousDue(due.remainingAmount);

      setCollectAmount(
        due.remainingAmount > 0 ? String(due.remainingAmount) : '',
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to load renewal information.',
      );
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  const renew = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select a plan', 'Please select a membership plan.');
      return;
    }

    if (!currentMembership) {
      Alert.alert('Error', 'Current membership not found.');
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'User not found',
        'Unable to identify the staff user recording this transaction.',
      );
      return;
    }

    const currentUserId = currentUser.id;

    /*
     * Validate collection amount.
     */
    if (previousDueAction === 'collect' && previousDue > 0) {
      const amount = Number(collectAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        Alert.alert(
          'Invalid amount',
          'Please enter a valid collection amount.',
        );
        return;
      }

      if (amount !== previousDue) {
        Alert.alert(
          'Invalid collection',
          `The previous outstanding due is ₹${previousDue.toLocaleString(
            'en-IN',
          )}. Please collect the full amount.`,
        );
        return;
      }
    }

    /*
     * Validate write-off reason.
     */
    if (
      previousDueAction === 'write_off' &&
      previousDue > 0 &&
      !writeOffReason.trim()
    ) {
      Alert.alert(
        'Reason required',
        'Please enter a reason for writing off the previous due.',
      );
      return;
    }

    try {
      setSaving(true);

      await container.useCases.processMembershipTransition.execute({
        memberId,

        planId: selectedPlanId,

        previousDueAction: previousDue > 0 ? previousDueAction : 'none',

        previousMembershipId: currentMembership.id,
        startDate:
          startDateOption === 'previous_end'
            ? currentMembership.endDate
            : new Date().toISOString(),

        collectAmount:
          previousDueAction === 'collect' ? Number(collectAmount) : undefined,

        paymentMethod:
          previousDueAction === 'collect' ? paymentMethod : undefined,

        writeOffReason:
          previousDueAction === 'write_off' ? writeOffReason : undefined,

        applyUnusedCredit: false,

        recordedBy: currentUserId,
      });

      Alert.alert(
        'Membership renewed',
        `${selectedPlan?.name ?? 'Membership'} has been added.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Renewal failed',
        error instanceof Error ? error.message : 'Unable to renew membership.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Renew Membership</Text>

        <Text style={styles.memberName}>{memberName}</Text>

        <Text style={styles.sectionTitle}>Choose a plan</Text>

        {plans.map(plan => {
          const selected = plan.id === selectedPlanId;

          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlanId(plan.id)}
              style={[styles.planCard, selected && styles.selectedPlan]}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>

                <Text style={styles.duration}>
                  {plan.durationMonths} month
                  {plan.durationMonths === 1 ? '' : 's'}
                </Text>
              </View>

              <Text style={styles.amount}>
                ₹{plan.amount.toLocaleString('en-IN')}
              </Text>
            </Pressable>
          );
        })}

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

        {currentMembership && (
          <MembershipStartDateSection
            previousEndDate={currentMembership.endDate}
            selected={startDateOption}
            onChange={setStartDateOption}
          />
        )}

        {selectedPlan && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Renewal Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Plan</Text>

              <Text style={styles.value}>{selectedPlan.name}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Duration</Text>

              <Text style={styles.value}>
                {selectedPlan.durationMonths} month
                {selectedPlan.durationMonths === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Amount</Text>

              <Text style={styles.value}>
                ₹{selectedPlan.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            {previousDue > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Previous due</Text>

                <Text style={styles.value}>
                  ₹{previousDue.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            {previousDue > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Due action</Text>

                <Text style={styles.value}>
                  {previousDueAction === 'collect'
                    ? 'Collect'
                    : previousDueAction === 'write_off'
                    ? 'Write Off'
                    : 'Carry Forward'}
                </Text>
              </View>
            )}
          </View>
        )}

        <Pressable
          style={[styles.renewButton, saving && styles.disabledButton]}
          onPress={renew}
          disabled={saving}
        >
          <Text style={styles.renewButtonText}>
            {saving ? 'Renewing...' : 'Confirm Renewal'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function isExpired(endDate: string): boolean {
  const end = new Date(endDate);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return end < today;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  memberName: {
    marginTop: 5,
    fontSize: 15,
    color: '#6B7280',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedPlan: {
    borderColor: '#111827',
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  duration: {
    marginTop: 4,
    color: '#6B7280',
  },

  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    color: '#6B7280',
  },

  value: {
    fontWeight: '700',
    color: '#111827',
  },

  renewButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.6,
  },

  renewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
