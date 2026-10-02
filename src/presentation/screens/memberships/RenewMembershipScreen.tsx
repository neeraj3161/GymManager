import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  calculateMembershipPaymentSummary,
  getMaxCollectableAmount,
  validateCollectionAmount,
} from '../../../application/memberships/collectionValidation';
import { formatDateOnly, parseDateOnly } from '../../../shared/utils/date';
import { UnusedCreditToggle } from '../../components/UnusedCreditToggle';
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
  const [planAmount, setPlanAmount] = useState('');

  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [startDateOption, setStartDateOption] =
    useState<MembershipStartDateOption>('today');
  const [customStartDate, setCustomStartDate] = useState(
    formatDateForInput(new Date()),
  );

  const [saving, setSaving] = useState(false);
  const [applyUnusedCredit, setApplyUnusedCredit] = useState(false);

  const [previousDue, setPreviousDue] = useState(0);

  const [previousDueAction, setPreviousDueAction] =
    useState<PreviousDueAction>('carry_forward');

  const [collectAmount, setCollectAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [writeOffReason, setWriteOffReason] = useState('');

  const load = useCallback(async () => {
    try {
      const plansData = await container.useCases.getPlans.execute();

      setPlans(plansData);

      if (plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
        setPlanAmount(String(plansData[0].amount));
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
  const planAmountValue = Number(planAmount);
  const dueWillBeSettled =
    previousDue <= 0 ||
    previousDueAction === 'write_off' ||
    (previousDueAction === 'collect' && Number(collectAmount) >= previousDue);
  const unusedCredit =
    currentMembership && dueWillBeSettled
      ? calculateUnusedCredit(currentMembership)
      : 0;
  const appliedUnusedCredit = applyUnusedCredit ? unusedCredit : 0;
  const maxCollectableAmount = getMaxCollectableAmount({
    previousDue,
    newPlanAmount: selectedPlan?.amount ?? 0,
  });
  const paymentSummary = calculateMembershipPaymentSummary({
    planAmount: Number.isFinite(planAmountValue) ? planAmountValue : 0,
    previousDue,
    previousDueAction: previousDue > 0 ? previousDueAction : 'write_off',
    collectAmount: Number(collectAmount) || 0,
    unusedCredit: appliedUnusedCredit,
  });

  const collectedAmount = paymentSummary.collectedAmount;
  const remainingPreviousDue = paymentSummary.remainingPreviousDue;
  const totalDueAfterRenewal = paymentSummary.finalAmount;

  const resolveSelectedStartDate = (): string | null => {
    if (startDateOption === 'previous_end') {
      return currentMembership?.endDate ?? null;
    }

    if (startDateOption === 'custom') {
      const parsed = parseDateInput(customStartDate);

      if (!parsed) {
        Alert.alert(
          'Invalid date',
          'Please enter the start date in YYYY-MM-DD format.',
        );
        return null;
      }

      return formatDateOnly(parsed);
    }

    return formatDateOnly(new Date());
  };

  const renew = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select a plan', 'Please select a membership plan.');
      return;
    }

    const selectedStartDate = resolveSelectedStartDate();

    if (!selectedStartDate) {
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

    if (
      !planAmount.trim() ||
      !Number.isFinite(planAmountValue) ||
      planAmountValue < 0
    ) {
      Alert.alert(
        'Invalid amount',
        'Membership amount must be zero or greater.',
      );
      return;
    }

    const currentUserId = currentUser.id;

    /*
     * Validate collection amount.
     */
    if (previousDue > 0 && previousDueAction === 'collect') {
      const amount = Number(collectAmount);
      const validation = validateCollectionAmount({
        collectAmount: amount,
        previousDue,
        newPlanAmount: planAmountValue,
      });

      if (!validation.isValid) {
        Alert.alert(
          'Invalid collection',
          validation.message ??
            `Collection amount cannot exceed ₹${maxCollectableAmount.toLocaleString(
              'en-IN',
            )}.`,
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

      const transitionResult =
        await container.useCases.processMembershipTransition.execute({
          memberId,

          planId: selectedPlanId,
          planAmount: planAmountValue,

          previousDue,
          previousDueAction: previousDue > 0 ? previousDueAction : 'none',

          previousMembershipId: currentMembership.id,
          startDate: selectedStartDate,

          collectAmount:
            previousDueAction === 'collect' ? Number(collectAmount) : undefined,

          paymentMethod:
            previousDueAction === 'collect' ? paymentMethod : undefined,

          writeOffReason:
            previousDueAction === 'write_off' ? writeOffReason : undefined,

          transitionType: 'renew',
          applyUnusedCredit,

          recordedBy: currentUserId,
        });

      const resultUnusedCredit =
        'unusedCredit' in transitionResult ? transitionResult.unusedCredit : 0;
      const resultFinalAmount =
        'finalAmount' in transitionResult
          ? transitionResult.finalAmount
          : totalDueAfterRenewal;

      Alert.alert(
        'Membership renewed',
        `${selectedPlan?.name ?? 'Membership'} has been added.\n\n` +
          `Unused credit: ₹${(applyUnusedCredit
            ? resultUnusedCredit
            : 0
          ).toLocaleString('en-IN')}\n` +
          `Amount due: ₹${resultFinalAmount.toLocaleString('en-IN')}`,
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={24}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Renew Membership</Text>

          <Text style={styles.memberName}>{memberName}</Text>

          <Text style={styles.sectionTitle}>Choose a plan</Text>

          {plans.map(plan => {
            const selected = plan.id === selectedPlanId;

            return (
              <Pressable
                key={plan.id}
                onPress={() => {
                  setSelectedPlanId(plan.id);
                  setPlanAmount(String(plan.amount));
                }}
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

          {selectedPlan ? (
            <View style={styles.amountEditor}>
              <Text style={styles.amountLabel}>Membership amount</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={planAmount}
                  onChangeText={setPlanAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  selectTextOnFocus
                />
              </View>
            </View>
          ) : null}

          {currentMembership && selectedPlan ? (
            <UnusedCreditToggle
              enabled={applyUnusedCredit}
              onChange={setApplyUnusedCredit}
              creditAmount={unusedCredit}
            />
          ) : null}

          {currentMembership && (
            <MembershipStartDateSection
              previousEndDate={currentMembership.endDate}
              selected={startDateOption}
              customDate={customStartDate}
              onChange={setStartDateOption}
              onCustomDateChange={setCustomStartDate}
            />
          )}

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
            maxCollectableAmount={maxCollectableAmount}
          />

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
                  ₹
                  {(Number.isFinite(planAmountValue)
                    ? planAmountValue
                    : 0
                  ).toLocaleString('en-IN')}
                </Text>
              </View>

              {appliedUnusedCredit > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.label}>Unused credit</Text>
                  <Text style={styles.value}>
                    − ₹{appliedUnusedCredit.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}

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

              <View style={styles.summaryRow}>
                <Text style={styles.label}>Total due after renewal</Text>

                <Text style={styles.value}>
                  ₹{totalDueAfterRenewal.toLocaleString('en-IN')}
                </Text>
              </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map(part => Number(part));
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function calculateUnusedCredit(membership: {
  amount: number;
  startDate: string;
  endDate: string;
}): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate =
    parseDateOnly(membership.startDate) ?? new Date(membership.startDate);
  const endDate =
    parseDateOnly(membership.endDate) ?? new Date(membership.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (endDate <= today) {
    return 0;
  }

  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(
    Math.ceil((endDate.getTime() - startDate.getTime()) / dayInMilliseconds) +
      1,
    1,
  );
  const unusedDays = Math.max(
    Math.ceil((endDate.getTime() - today.getTime()) / dayInMilliseconds),
    0,
  );

  return Math.min(
    membership.amount,
    Math.round((membership.amount / totalDays) * unusedDays),
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

  flex: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 120,
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

  amountEditor: {
    marginTop: 4,
    marginBottom: 8,
  },

  amountLabel: {
    marginBottom: 7,
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },

  amountInputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },

  currency: {
    marginRight: 8,
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },

  amountInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
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
