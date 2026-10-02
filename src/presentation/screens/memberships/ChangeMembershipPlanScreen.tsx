import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { Membership } from '../../../domain/entities/Membership';
import { container } from '../../../di/container';
import { PreviousDueSection } from '../../components/PreviousDueSection';
import { UnusedCreditToggle } from '../../components/UnusedCreditToggle';
import {
  MembershipStartDateOption,
  MembershipStartDateSection,
} from '../../components/MembershipStartDateSection';
import type { PreviousDueAction } from '../../components/PreviousDueSection';
import { PaymentMethod } from '../../../domain/entities/Payment';
import { useAuthStore } from '../../../store/authStore';
import {
  calculateMembershipPaymentSummary,
  getMaxCollectableAmount,
  validateCollectionAmount,
} from '../../../application/memberships/collectionValidation';
import { formatDateOnly, parseDateOnly } from '../../../shared/utils/date';

type RouteParams = {
  memberId: string;
  memberName: string;
};

export function ChangeMembershipPlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { memberId, memberName } = route.params as RouteParams;
  const currentUser = useAuthStore(state => state.user);

  const [currentMembership, setCurrentMembership] = useState<Membership | null>(
    null,
  );
  const [startDateOption, setStartDateOption] =
    useState<MembershipStartDateOption>('today');
  const [customStartDate, setCustomStartDate] = useState(
    formatDateForInput(new Date()),
  );

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planAmount, setPlanAmount] = useState('');

  const [unusedDays, setUnusedDays] = useState(0);
  const [unusedCredit, setUnusedCredit] = useState(0);
  const [applyUnusedCredit, setApplyUnusedCredit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const planAmountValue = Number(planAmount);
  const [previousDue, setPreviousDue] = useState(0);

  const [previousDueAction, setPreviousDueAction] =
    useState<PreviousDueAction>('carry_forward');

  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTaken, setAmountTaken] = useState('0');
  const [amountTakenMethod, setAmountTakenMethod] =
    useState<PaymentMethod>('cash');
  const [writeOffReason, setWriteOffReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [membership, allPlans] = await Promise.all([
        container.repositories.membership.getByMemberId(memberId),
        container.useCases.getPlans.execute(),
      ]);

      setCurrentMembership(membership);

      if (membership) {
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
      } else {
        setStartDateOption('today');
        setPreviousDue(0);
        setCollectAmount('');
      }

      const activePlans = allPlans.filter(plan => plan.active);
      setPlans(activePlans);
    } catch (error) {
      Alert.alert(
        'Unable to load',
        error instanceof Error
          ? error.message
          : 'Unable to load membership information.',
      );
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

    const dueWillBeSettled =
      previousDue <= 0 ||
      previousDueAction === 'write_off' ||
      (previousDueAction === 'collect' && Number(collectAmount) >= previousDue);
    const result = dueWillBeSettled
      ? calculateUnusedCredit(currentMembership)
      : { unusedDays: 0, unusedCredit: 0 };

    setUnusedDays(result.unusedDays);
    setUnusedCredit(result.unusedCredit);
  }, [
    collectAmount,
    currentMembership,
    previousDue,
    previousDueAction,
    selectedPlan,
  ]);

  const calculateUnusedCredit = (membership: Membership) => {
    const today = startOfDay(new Date());
    const endDate = startOfDay(
      parseDateOnly(membership.endDate) ?? new Date(membership.endDate),
    );
    const startDate = startOfDay(
      parseDateOnly(membership.startDate) ?? new Date(membership.startDate),
    );

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

  const appliedUnusedCredit = applyUnusedCredit ? unusedCredit : 0;

  const baseAmount = selectedPlan
    ? Math.max(
        (Number.isFinite(planAmountValue) ? planAmountValue : 0) -
          appliedUnusedCredit,
        0,
      )
    : 0;

  const paymentSummary = calculateMembershipPaymentSummary({
    planAmount: planAmountValue,
    previousDue,
    previousDueAction: previousDue > 0 ? previousDueAction : 'write_off',
    collectAmount: Number(collectAmount) || 0,
    unusedCredit: appliedUnusedCredit,
  });

  const collectedAmount = paymentSummary.collectedAmount;
  const remainingPreviousDue = paymentSummary.remainingPreviousDue;
  const finalAmount = paymentSummary.finalAmount;
  const maxCollectableAmount = paymentSummary.maxCollectableAmount;
  const amountTakenValue = amountTaken.trim() ? Number(amountTaken) : 0;
  const amountDueAfterPayment = Math.max(
    finalAmount - (Number.isFinite(amountTakenValue) ? amountTakenValue : 0),
    0,
  );

  const resolveSelectedStartDate = (): string | null => {
    if (startDateOption === 'previous_end') {
      if (!currentMembership) {
        return null;
      }

      return currentMembership.endDate;
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

  const changePlan = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a plan', 'Please select a membership plan.');
      return;
    }

    const selectedStartDate = resolveSelectedStartDate();

    if (!selectedStartDate) {
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

    if (
      currentMembership &&
      (!Number.isFinite(amountTakenValue) ||
        amountTakenValue < 0 ||
        amountTakenValue > finalAmount)
    ) {
      Alert.alert(
        'Invalid payment',
        `Amount received must be between ₹0 and ₹${finalAmount.toLocaleString(
          'en-IN',
        )}.`,
      );
      return;
    }

    if (!currentMembership) {
      Alert.alert(
        'Create membership',
        `Assign the ${selectedPlan.name} plan to ${memberName}?\n\n` +
          `Plan amount: ₹${planAmountValue.toLocaleString('en-IN')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: async () => {
              try {
                setChanging(true);
                await container.useCases.createMembership.execute({
                  memberId,
                  planId: selectedPlan.id,
                  amount: planAmountValue,
                  startDate: selectedStartDate,
                });
                Alert.alert(
                  'Membership created',
                  `${selectedPlan.name} has been assigned to ${memberName}.`,
                  [{ text: 'Done', onPress: () => navigation.goBack() }],
                );
              } catch (error) {
                Alert.alert(
                  'Unable to create membership',
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
      return;
    }

    Alert.alert(
      'Confirm plan change',
      `Change ${memberName}'s membership to ${selectedPlan.name}?\n\n` +
        `New plan: ₹${planAmountValue.toLocaleString('en-IN')}\n` +
        `Unused credit: ₹${(applyUnusedCredit
          ? unusedCredit
          : 0
        ).toLocaleString('en-IN')}\n` +
        `Amount received: ₹${amountTakenValue.toLocaleString('en-IN')}\n` +
        `Amount due after payment: ₹${amountDueAfterPayment.toLocaleString(
          'en-IN',
        )}`,
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

              if (!currentUser) {
                throw new Error('Unable to identify the staff user.');
              }

              if (previousDue > 0 && previousDueAction === 'collect') {
                const validation = validateCollectionAmount({
                  collectAmount: Number(collectAmount),
                  previousDue,
                  newPlanAmount: baseAmount,
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

              const result =
                await container.useCases.processMembershipTransition.execute({
                  memberId,
                  planId: selectedPlan.id,
                  planAmount: planAmountValue,
                  previousDue,
                  previousDueAction:
                    previousDue > 0 ? previousDueAction : 'none',
                  previousMembershipId: currentMembership.id,
                  collectAmount:
                    previousDueAction === 'collect'
                      ? Number(collectAmount)
                      : undefined,
                  paymentMethod:
                    previousDueAction === 'collect' ? paymentMethod : undefined,
                  writeOffReason:
                    previousDueAction === 'write_off'
                      ? writeOffReason
                      : undefined,
                  startDate: selectedStartDate,
                  recordedBy: currentUser.id,
                  transitionType: 'change_plan',
                  applyUnusedCredit,
                  newMembershipPaymentAmount: amountTakenValue,
                  newMembershipPaymentMethod:
                    amountTakenValue > 0 ? amountTakenMethod : undefined,
                });

              const resultUnusedCredit =
                'unusedCredit' in result ? result.unusedCredit : 0;
              const resultFinalAmount =
                'finalAmount' in result
                  ? result.finalAmount
                  : amountDueAfterPayment;

              Alert.alert(
                'Membership updated',
                `Plan changed to ${selectedPlan.name}.\n\n` +
                  `Unused credit: ₹${(applyUnusedCredit
                    ? resultUnusedCredit
                    : 0
                  ).toLocaleString('en-IN')}\n` +
                  `Amount due after payment: ₹${resultFinalAmount.toLocaleString(
                    'en-IN',
                  )}`,
                [
                  {
                    text: 'Done',
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
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Loading membership...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlanLabel = currentMembership
    ? currentMembership.amount > 0
      ? `₹${currentMembership.amount.toLocaleString('en-IN')}`
      : 'No amount'
    : 'No plan assigned';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <View style={styles.topBarCopy}>
              <Text style={styles.eyebrow}>MEMBERSHIP</Text>
              <Text style={styles.screenTitle}>
                {currentMembership ? 'Change plan' : 'Assign plan'}
              </Text>
            </View>
          </View>

          <View style={styles.memberHero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {memberName.trim().charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.memberCopy}>
              <Text style={styles.memberName} numberOfLines={1}>
                {memberName}
              </Text>
              <Text style={styles.memberMeta}>
                {currentMembership
                  ? `Current membership · ${currentPlanLabel}`
                  : currentPlanLabel}
              </Text>
            </View>

            {currentMembership ? (
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {isExpired(currentMembership.endDate) ? 'Expired' : 'Active'}
                </Text>
              </View>
            ) : null}
          </View>

          {currentMembership ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>01</Text>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Current membership</Text>
                  <Text style={styles.sectionSubtitle}>
                    Review what will carry over before selecting a new plan.
                  </Text>
                </View>
              </View>

              <View style={styles.currentCard}>
                <View style={styles.currentTopRow}>
                  <View>
                    <Text style={styles.mutedLabel}>CURRENT VALUE</Text>
                    <Text style={styles.currentAmount}>
                      ₹{currentMembership.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.validUntil}>
                    <Text style={styles.mutedLabel}>VALID UNTIL</Text>
                    <Text style={styles.validDate}>
                      {formatDate(currentMembership.endDate)}
                    </Text>
                  </View>
                </View>

                {unusedDays > 0 ? (
                  <View style={styles.creditBanner}>
                    <View style={styles.creditIcon}>
                      <Text style={styles.creditIconText}>↗</Text>
                    </View>
                    <View style={styles.creditCopy}>
                      <Text style={styles.creditTitle}>
                        Unused membership credit
                      </Text>
                      <Text style={styles.creditSubtitle}>
                        {unusedDays} day{unusedDays > 1 ? 's' : ''} remaining
                      </Text>
                    </View>
                    <Text style={styles.creditAmount}>
                      ₹{unusedCredit.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noCreditRow}>
                    <Text style={styles.noCreditDot}>•</Text>
                    <Text style={styles.noCreditText}>
                      No unused membership credit available
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noPlans}>
              <Text style={styles.noPlansTitle}>No membership assigned</Text>
              <Text style={styles.noPlansText}>
                Choose an active plan below to create this member's first
                membership.
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>02</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Choose a new plan</Text>
              <Text style={styles.sectionSubtitle}>
                {currentMembership
                  ? 'Select the membership you want to move this member to.'
                  : 'Select a plan for this member’s first membership.'}
              </Text>
            </View>
          </View>

          <View style={styles.plans}>
            {plans.length === 0 ? (
              <View style={styles.noPlans}>
                <Text style={styles.noPlansTitle}>No active plans</Text>
                <Text style={styles.noPlansText}>
                  Create an active membership plan before assigning a membership
                  to this member.
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Plans')}
                >
                  <Text style={styles.secondaryButtonText}>Create a plan</Text>
                </Pressable>
              </View>
            ) : null}

            {plans.map((plan, index) => {
              const selected = plan.id === selectedPlanId;

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    setSelectedPlanId(plan.id);
                    setPlanAmount(String(plan.amount));
                  }}
                  style={({ pressed }) => [
                    styles.planCard,
                    selected && styles.planCardSelected,
                    pressed && !selected && styles.planCardPressed,
                  ]}
                >
                  <View style={styles.planLeading}>
                    <View
                      style={[
                        styles.planRadio,
                        selected && styles.planRadioSelected,
                      ]}
                    >
                      {selected ? <View style={styles.planRadioDot} /> : null}
                    </View>
                  </View>

                  <View style={styles.planBody}>
                    <View style={styles.planNameRow}>
                      <Text
                        style={[
                          styles.planName,
                          selected && styles.planNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {plan.name}
                      </Text>
                      {index === 0 ? (
                        <View style={styles.planTag}>
                          <Text style={styles.planTagText}>POPULAR</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.planDuration}>
                      {plan.durationMonths} month
                      {plan.durationMonths > 1 ? 's' : ''}
                    </Text>

                    {plan.description ? (
                      <Text style={styles.planDescription} numberOfLines={2}>
                        {plan.description}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.planTrailing}>
                    <Text
                      style={[
                        styles.planAmount,
                        selected && styles.planAmountSelected,
                      ]}
                    >
                      ₹{plan.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.planPerMonth}>
                      {plan.durationMonths > 0
                        ? `₹${Math.round(
                            plan.amount / plan.durationMonths,
                          ).toLocaleString('en-IN')}/mo`
                        : ''}
                    </Text>
                  </View>
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
              <View style={styles.amountEditor}>
                <Text style={styles.amountLabel}>Amount received now</Text>
                <Text style={styles.amountHint}>
                  Leave at ₹0 when no payment is received during this plan
                  change.
                </Text>
                <View style={styles.amountInputWrap}>
                  <Text style={styles.currency}>₹</Text>
                  <TextInput
                    value={amountTaken}
                    onChangeText={setAmountTaken}
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                    selectTextOnFocus
                    placeholder="0"
                  />
                </View>
                <Text style={styles.amountLabel}>Payment method</Text>
                <View style={styles.receivedMethods}>
                  {(
                    ['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]
                  ).map(method => {
                    const selected = amountTakenMethod === method;

                    return (
                      <Pressable
                        key={method}
                        onPress={() => setAmountTakenMethod(method)}
                        style={[
                          styles.receivedMethodButton,
                          selected && styles.receivedMethodSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.receivedMethodText,
                            selected && styles.receivedMethodSelectedText,
                          ]}
                        >
                          {method === 'upi'
                            ? 'UPI'
                            : method.charAt(0).toUpperCase() + method.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
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

            {plans.length > 0 ? (
              <Pressable
                style={[styles.secondaryButton, styles.addPlanButton]}
                onPress={() => navigation.navigate('Plans')}
              >
                <Text style={styles.secondaryButtonText}>Add another plan</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>03</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Start date</Text>
              <Text style={styles.sectionSubtitle}>
                {currentMembership
                  ? 'Choose when the new membership should begin.'
                  : 'The new membership will begin today.'}
              </Text>
            </View>
          </View>

          <View style={styles.componentCard}>
            {currentMembership ? (
              <MembershipStartDateSection
                previousEndDate={currentMembership.endDate}
                selected={startDateOption}
                customDate={customStartDate}
                onChange={setStartDateOption}
                onCustomDateChange={setCustomStartDate}
              />
            ) : (
              <MembershipStartDateSection
                previousEndDate={new Date().toISOString()}
                selected={startDateOption}
                customDate={customStartDate}
                onChange={setStartDateOption}
                onCustomDateChange={setCustomStartDate}
              />
            )}
          </View>

          {previousDue > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>04</Text>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Previous due</Text>
                  <Text style={styles.sectionSubtitle}>
                    Decide what should happen to the outstanding amount.
                  </Text>
                </View>
                <View style={styles.duePill}>
                  <Text style={styles.duePillText}>
                    ₹{previousDue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.componentCard}>
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
              </View>
            </>
          ) : null}

          {selectedPlan ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryEyebrow}>PAYMENT SUMMARY</Text>
                  <Text style={styles.summaryTitle}>{selectedPlan.name}</Text>
                </View>

                <Text style={styles.summaryAmount}>
                  ₹
                  {(currentMembership
                    ? amountDueAfterPayment
                    : finalAmount
                  ).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.summaryRows}>
                <SummaryRow
                  label="New plan"
                  value={`₹${(Number.isFinite(planAmountValue)
                    ? planAmountValue
                    : 0
                  ).toLocaleString('en-IN')}`}
                />

                {appliedUnusedCredit > 0 ? (
                  <SummaryRow
                    label="Unused credit"
                    value={`− ₹${appliedUnusedCredit.toLocaleString('en-IN')}`}
                    valueStyle={styles.positive}
                  />
                ) : null}

                {previousDue > 0 && previousDueAction === 'carry_forward' ? (
                  <SummaryRow
                    label="Previous due carried forward"
                    value={`+ ₹${previousDue.toLocaleString('en-IN')}`}
                    valueStyle={styles.attention}
                  />
                ) : null}

                {previousDue > 0 && previousDueAction === 'write_off' ? (
                  <SummaryRow
                    label="Previous due written off"
                    value={`₹${previousDue.toLocaleString('en-IN')}`}
                    valueStyle={styles.mutedValue}
                  />
                ) : null}

                {previousDue > 0 && previousDueAction === 'collect' ? (
                  <SummaryRow
                    label="Previous due to collect"
                    value={`₹${previousDue.toLocaleString('en-IN')}`}
                    valueStyle={styles.attention}
                  />
                ) : null}

                {currentMembership ? (
                  <SummaryRow
                    label="Amount received"
                    value={`− ₹${amountTakenValue.toLocaleString('en-IN')}`}
                    valueStyle={styles.positive}
                  />
                ) : null}
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {currentMembership
                    ? 'Remaining after payment'
                    : 'Amount to pay'}
                </Text>
                <Text style={styles.totalValue}>
                  ₹
                  {(currentMembership
                    ? amountDueAfterPayment
                    : finalAmount
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.selectionHint}>
              <View style={styles.selectionHintDot} />
              <Text style={styles.selectionHintText}>
                Select a plan to see the exact amount before confirming.
              </Text>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>

        <View style={styles.ctaBar}>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaLabel}>
              {selectedPlan
                ? currentMembership
                  ? 'REMAINING DUE'
                  : 'PLAN AMOUNT'
                : 'SELECT A PLAN'}
            </Text>
            <Text style={styles.ctaAmount}>
              {selectedPlan
                ? `₹${(currentMembership
                    ? amountDueAfterPayment
                    : finalAmount
                  ).toLocaleString('en-IN')}`
                : '—'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              (!selectedPlan || changing) && styles.confirmButtonDisabled,
              pressed &&
                selectedPlan &&
                !changing &&
                styles.confirmButtonPressed,
            ]}
            onPress={changePlan}
            disabled={changing || !selectedPlan}
          >
            {changing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.confirmText}>
                  {currentMembership ? 'Confirm change' : 'Create membership'}
                </Text>
                <Text style={styles.confirmArrow}>→</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
    </View>
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
    backgroundColor: '#F5F7FA',
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 124,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backText: {
    fontSize: 30,
    lineHeight: 30,
    color: '#111827',
    marginTop: -2,
  },

  topBarCopy: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: '#7C3AED',
  },

  screenTitle: {
    marginTop: 2,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    color: '#101828',
    letterSpacing: -0.5,
  },

  memberHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151A24',
    borderRadius: 24,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  memberCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  memberName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  memberMeta: {
    marginTop: 4,
    color: '#AEB6C4',
    fontSize: 12,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },

  statusText: {
    color: '#E8EDF4',
    fontSize: 11,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  sectionKicker: {
    width: 30,
    paddingTop: 3,
    fontSize: 11,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },

  sectionCopy: {
    flex: 1,
    paddingRight: 8,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8492',
  },

  duePill: {
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  duePillText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '900',
  },

  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    marginBottom: 27,
  },

  currentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  mutedLabel: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: '800',
    color: '#98A2B3',
  },

  currentAmount: {
    marginTop: 5,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: '#101828',
    letterSpacing: -0.8,
  },

  validUntil: {
    alignItems: 'flex-end',
  },

  validDate: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#344054',
  },

  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 12,
    backgroundColor: '#F3F0FF',
    borderRadius: 15,
  },

  creditIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#E7DFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  creditIconText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#6D28D9',
  },

  creditCopy: {
    flex: 1,
    marginLeft: 10,
  },

  creditTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4C1D95',
  },

  creditSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B6290',
  },

  creditAmount: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '900',
    color: '#6D28D9',
  },

  noCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  noCreditDot: {
    fontSize: 14,
    color: '#98A2B3',
    marginRight: 7,
  },

  noCreditText: {
    color: '#98A2B3',
    fontSize: 12,
  },

  componentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF3',
    padding: 14,
    marginBottom: 27,
  },

  plans: {
    marginBottom: 8,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 20,
    padding: 15,
    marginBottom: 11,
  },

  planCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF8FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  planCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  amountEditor: {
    marginBottom: 18,
  },

  amountLabel: {
    marginBottom: 7,
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
  },

  amountHint: {
    marginTop: -2,
    marginBottom: 8,
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
  },

  receivedMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },

  receivedMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
  },

  receivedMethodSelected: {
    borderColor: '#15803D',
    backgroundColor: '#15803D',
  },

  receivedMethodText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '700',
  },

  receivedMethodSelectedText: {
    color: '#FFFFFF',
  },

  amountInputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E5EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },

  currency: {
    marginRight: 8,
    color: '#667085',
    fontSize: 16,
    fontWeight: '700',
  },

  amountInput: {
    flex: 1,
    height: '100%',
    color: '#182230',
    fontSize: 16,
    fontWeight: '800',
  },

  planLeading: {
    width: 28,
    alignItems: 'flex-start',
  },

  planRadio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD2DC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  planRadioSelected: {
    borderColor: '#7C3AED',
  },

  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },

  planBody: {
    flex: 1,
    paddingRight: 10,
  },

  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  planName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#182230',
  },

  planNameSelected: {
    color: '#5B21B6',
  },

  planTag: {
    marginLeft: 7,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#EEE9FF',
  },

  planTagText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#6D28D9',
  },

  planDuration: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
  },

  planDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#8A94A3',
  },

  planTrailing: {
    alignItems: 'flex-end',
    minWidth: 74,
  },

  planAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#182230',
  },

  planAmountSelected: {
    color: '#5B21B6',
  },

  planPerMonth: {
    marginTop: 3,
    fontSize: 10,
    color: '#98A2B3',
    fontWeight: '700',
  },

  noPlans: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDF3',
    borderRadius: 20,
    padding: 18,
    marginBottom: 11,
  },

  noPlansTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#101828',
  },

  noPlansText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: '#7A8492',
  },

  summaryCard: {
    backgroundColor: '#151A24',
    borderRadius: 24,
    padding: 18,
    marginTop: 10,
    shadowColor: '#101828',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  summaryEyebrow: {
    color: '#8E96A4',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },

  summaryTitle: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  summaryRows: {
    marginTop: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },

  summaryLabel: {
    flex: 1,
    fontSize: 12,
    color: '#AEB6C4',
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F4F6F8',
  },

  positive: {
    color: '#86EFAC',
  },

  attention: {
    color: '#FDBA74',
  },

  mutedValue: {
    color: '#B8BEC8',
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#303744',
    marginVertical: 14,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  selectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 13,
  },

  selectionHintDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginRight: 8,
  },

  selectionHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#8A94A3',
  },

  bottomSpace: {
    height: 20,
  },

  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7EBF0',
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: Platform.OS === 'ios' ? 15 : 11,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -5 },
    elevation: 12,
  },

  ctaCopy: {
    flex: 1,
    marginRight: 12,
  },

  ctaLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '900',
    color: '#98A2B3',
  },

  ctaAmount: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '900',
    color: '#101828',
  },

  confirmButton: {
    minWidth: 150,
    height: 51,
    paddingHorizontal: 17,
    borderRadius: 17,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  confirmButtonDisabled: {
    backgroundColor: '#C7CBD3',
    shadowOpacity: 0,
    elevation: 0,
  },

  confirmButtonPressed: {
    transform: [{ scale: 0.98 }],
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  confirmArrow: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  secondaryButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E7EE',
  },

  addPlanButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  secondaryButtonText: {
    color: '#344054',
    fontWeight: '800',
    fontSize: 13,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },

  loadingText: {
    marginTop: 12,
    color: '#7A8492',
    fontSize: 12,
    fontWeight: '600',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyIconText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#101828',
  },

  emptyText: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#7A8492',
  },

  pressed: {
    opacity: 0.7,
  },
});
