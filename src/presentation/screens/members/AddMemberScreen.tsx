import React, { useEffect, useMemo, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

import { container } from '../../../di/container';
import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { PaymentMethod } from '../../../domain/entities/Payment';
import { useAuthStore } from '../../../store/authStore';

type PaymentOption = PaymentMethod;

const PAYMENT_METHODS: {
  value: PaymentOption;
  label: string;
}[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

export function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const currentUser = useAuthStore(state => state.user);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));

  const [paymentAmount, setPaymentAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>('cash');

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setError(null);

      const result = await container.useCases.getPlans.execute();
      const activePlans = result.filter(plan => plan.active);

      setPlans(activePlans);

      if (activePlans.length > 0) {
        setSelectedPlanId(activePlans[0].id);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to load membership plans.',
      );
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedPlan = useMemo(
    () => plans.find(plan => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const calculatedEndDate = useMemo(() => {
    if (!selectedPlan) {
      return null;
    }

    const start = parseDateInput(startDate);

    if (!start) {
      return null;
    }

    const end = new Date(start);
    const originalDay = end.getDate();

    end.setDate(1);
    end.setMonth(end.getMonth() + selectedPlan.durationMonths);

    const lastDay = new Date(
      end.getFullYear(),
      end.getMonth() + 1,
      0,
    ).getDate();

    end.setDate(Math.min(originalDay, lastDay));
    end.setDate(end.getDate() - 1);

    return formatDisplayDate(end);
  }, [selectedPlan, startDate]);

  const paymentNumber = Number(paymentAmount || 0);

  const remainingAmount = selectedPlan
    ? Math.max(
        selectedPlan.amount -
          (Number.isFinite(paymentNumber) ? paymentNumber : 0),
        0,
      )
    : 0;

  const handlePlanChange = (plan: MembershipPlan) => {
    setSelectedPlanId(plan.id);
  };

  const setFullPayment = () => {
    if (selectedPlan) {
      setPaymentAmount(String(selectedPlan.amount));
    }
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Missing information', 'Please enter the member first name.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter the member phone number.',
      );
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');

    if (
      phoneDigits.length !== 10 &&
      phoneDigits.length !== 11 &&
      phoneDigits.length !== 12
    ) {
      Alert.alert(
        'Invalid phone number',
        'Please enter a valid 10-digit Indian phone number.',
      );
      return;
    }

    if (!dateOfBirth.trim()) {
      Alert.alert(
        'Date of birth required',
        "Please select the member's date of birth.",
      );
      return;
    }

    const dob = parseDateInput(dateOfBirth.trim());

    if (!dob) {
      Alert.alert('Invalid date', 'Please select a valid date of birth.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dob > today) {
      Alert.alert('Invalid date', 'Date of birth cannot be in the future.');
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Membership required', 'Please select a membership plan.');
      return;
    }

    const parsedStartDate = parseDateInput(startDate);

    if (!parsedStartDate) {
      Alert.alert('Invalid date', 'Please enter the start date as YYYY-MM-DD.');
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'User not found',
        'Unable to identify the staff user recording this transaction.',
      );
      return;
    }

    const amount = Number(paymentAmount);

    if (paymentAmount.trim() && (!Number.isFinite(amount) || amount < 0)) {
      Alert.alert('Invalid payment', 'Payment amount must be zero or greater.');
      return;
    }

    if (amount > selectedPlan.amount) {
      Alert.alert(
        'Invalid payment',
        'Initial payment cannot be greater than the membership amount.',
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const member = await container.useCases.addMember.execute({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        dateOfBirth,
      });

      const membership = await container.useCases.createMembership.execute({
        memberId: member.id,
        planId: selectedPlan.id,
        startDate: parsedStartDate.toISOString(),
      });

      if (amount > 0) {
        await container.useCases.recordPayment.execute({
          memberId: member.id,
          membershipId: membership.id,
          amount,
          paymentMethod,
          recordedBy: currentUser.id,
        });
      }

      Alert.alert(
        'Member added',
        `${member.firstName} has been added successfully.`,
        [
          {
            text: 'View member',
            onPress: () =>
              navigation.replace('MemberDetails', {
                memberId: member.id,
              }),
          },
        ],
      );
    } catch (err) {
      console.error('Failed to add member:', err);

      Alert.alert(
        'Unable to add member',
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingPlans) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && plans.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.stateIconDanger}>
            <Text style={styles.stateIconText}>!</Text>
          </View>
          <Text style={styles.stateTitle}>Unable to load plans</Text>
          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.stateButton,
              pressed && styles.pressed,
            ]}
            onPress={loadPlans}
          >
            <Text style={styles.stateButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.stateIcon}>
            <Text style={styles.stateIconText}>+</Text>
          </View>
          <Text style={styles.stateTitle}>No active plans</Text>
          <Text style={styles.stateText}>
            Create an active membership plan before adding a member.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.stateButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('Plans')}
          >
            <Text style={styles.stateButtonText}>Manage plans</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <Text style={styles.eyebrow}>MEMBERS</Text>
            <Text style={styles.title}>Add member</Text>
            <Text style={styles.subtitle}>
              Enter the member details and membership information.
            </Text>
          </View>

          <Section
            title="Personal details"
            subtitle="Basic information for the member profile."
          >
            <View style={styles.row}>
              <View style={styles.half}>
                <Field
                  label="First name"
                  required
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.half}>
                <Field
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Field
              label="Phone"
              required
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.lastField}>
              <FieldLabel label="Date of birth" required />

              <Pressable
                onPress={() => setShowDobPicker(true)}
                style={({ pressed }) => [
                  styles.dateInput,
                  pressed && styles.pressedSoft,
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    !dateOfBirth && styles.placeholderText,
                  ]}
                >
                  {dateOfBirth
                    ? formatReadableDate(dateOfBirth)
                    : 'Select date of birth'}
                </Text>
                <Text style={styles.dateChevron}>⌄</Text>
              </Pressable>

              {showDobPicker ? (
                <DateTimePicker
                  value={parseDateInput(dateOfBirth) ?? new Date(1995, 0, 1)}
                  mode="date"
                  display="calendar"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDobPicker(false);

                    if (event.type === 'dismissed' || !selectedDate) {
                      return;
                    }

                    setDateOfBirth(formatDateForInput(selectedDate));
                  }}
                />
              ) : null}
            </View>
          </Section>

          <Section
            title="Membership"
            subtitle="Choose the plan and start date."
          >
            <FieldLabel label="Membership plan" required />

            <View style={styles.planList}>
              {plans.map(plan => {
                const selected = plan.id === selectedPlanId;

                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => handlePlanChange(plan)}
                    style={({ pressed }) => [
                      styles.planCard,
                      selected && styles.planCardSelected,
                      pressed && styles.planCardPressed,
                    ]}
                  >
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>

                    <View style={styles.planInfo}>
                      <Text
                        style={[
                          styles.planName,
                          selected && styles.planNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {plan.name}
                      </Text>

                      <Text
                        style={[
                          styles.planDuration,
                          selected && styles.planDurationSelected,
                        ]}
                      >
                        {plan.durationMonths}{' '}
                        {plan.durationMonths === 1 ? 'month' : 'months'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.planAmount,
                        selected && styles.planAmountSelected,
                      ]}
                    >
                      ₹{plan.amount.toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Start date"
              required
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            {calculatedEndDate ? (
              <View style={styles.endDateRow}>
                <Text style={styles.endDateLabel}>Membership ends</Text>
                <Text style={styles.endDateValue}>{calculatedEndDate}</Text>
              </View>
            ) : null}
          </Section>

          <Section
            title="Initial payment"
            subtitle="Record the amount collected today."
          >
            <View style={styles.paymentRow}>
              <View style={styles.paymentField}>
                <FieldLabel label="Payment amount" />

                <View style={styles.amountInputWrap}>
                  <Text style={styles.currency}>₹</Text>
                  <TextInput
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0"
                    placeholderTextColor="#A0A8B5"
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                    selectTextOnFocus
                  />
                </View>
              </View>

              <Pressable
                onPress={setFullPayment}
                style={({ pressed }) => [
                  styles.fullPaymentButton,
                  pressed && styles.pressedSoft,
                ]}
              >
                <Text style={styles.fullPaymentText}>Full amount</Text>
              </Pressable>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>
                {remainingAmount > 0 ? 'Remaining due' : 'Fully paid'}
              </Text>
              <Text
                style={[
                  styles.balanceValue,
                  remainingAmount > 0 ? styles.balanceDue : styles.balancePaid,
                ]}
              >
                ₹{remainingAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <FieldLabel label="Payment method" />

            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map(method => {
                const selected = paymentMethod === method.value;

                return (
                  <Pressable
                    key={method.value}
                    onPress={() => setPaymentMethod(method.value)}
                    style={({ pressed }) => [
                      styles.paymentMethod,
                      selected && styles.paymentMethodSelected,
                      pressed && styles.pressedSoft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        selected && styles.paymentMethodTextSelected,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.paymentNote}>
              Leave the amount at ₹0 when no payment is collected today.
            </Text>
          </Section>

          <Text style={styles.requiredNote}>* Required</Text>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerLabel}>INITIAL PAYMENT</Text>
            <Text style={styles.footerAmount}>
              ₹
              {Number.isFinite(paymentNumber)
                ? paymentNumber.toLocaleString('en-IN')
                : '0'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              pressed && !saving && styles.saveButtonPressed,
            ]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Add member</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.card}>{children}</View>
    </View>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function Field({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A8B5"
        style={styles.input}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function formatReadableDate(value: string): string {
  const date = parseDateInput(value);

  if (!date) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#7C3AED',
    fontWeight: '900',
  },

  title: {
    marginTop: 3,
    fontSize: 29,
    lineHeight: 34,
    color: '#101828',
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8492',
  },

  section: {
    marginBottom: 23,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: '#111827',
    fontWeight: '900',
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#858F9D',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF0',
    borderRadius: 20,
    padding: 15,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  half: {
    flex: 1,
  },

  field: {
    marginBottom: 15,
  },

  lastField: {
    marginBottom: 0,
  },

  label: {
    marginBottom: 7,
    fontSize: 11,
    color: '#344054',
    fontWeight: '800',
  },

  required: {
    color: '#7C3AED',
  },

  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    backgroundColor: '#FBFCFD',
    color: '#17212F',
    fontSize: 13,
    fontWeight: '600',
  },

  dateInput: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    backgroundColor: '#FBFCFD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateText: {
    color: '#17212F',
    fontSize: 13,
    fontWeight: '600',
  },

  placeholderText: {
    color: '#A0A8B5',
  },

  dateChevron: {
    color: '#7B8694',
    fontSize: 16,
    fontWeight: '900',
    marginTop: -4,
  },

  planList: {
    gap: 9,
    marginBottom: 15,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 69,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4E8ED',
    backgroundColor: '#FBFCFD',
  },

  planCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F5FF',
  },

  planCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.992 }],
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD2DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  radioSelected: {
    borderColor: '#7C3AED',
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },

  planInfo: {
    flex: 1,
    minWidth: 0,
  },

  planName: {
    fontSize: 14,
    color: '#182230',
    fontWeight: '900',
  },

  planNameSelected: {
    color: '#5B21B6',
  },

  planDuration: {
    marginTop: 3,
    fontSize: 10,
    color: '#7C8796',
    fontWeight: '700',
  },

  planDurationSelected: {
    color: '#786C98',
  },

  planAmount: {
    marginLeft: 8,
    fontSize: 16,
    color: '#182230',
    fontWeight: '900',
  },

  planAmountSelected: {
    color: '#5B21B6',
  },

  endDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: '#F4F0FF',
  },

  endDateLabel: {
    fontSize: 10,
    color: '#7D719A',
    fontWeight: '800',
  },

  endDateValue: {
    fontSize: 12,
    color: '#4C1D95',
    fontWeight: '900',
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 11,
  },

  paymentField: {
    flex: 1,
    marginRight: 10,
  },

  amountInputWrap: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    backgroundColor: '#FBFCFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  currency: {
    fontSize: 16,
    fontWeight: '900',
    color: '#667085',
    marginRight: 4,
  },

  amountInput: {
    flex: 1,
    height: 46,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 18,
    color: '#17212F',
    fontWeight: '900',
  },

  fullPaymentButton: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: '#151A24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullPaymentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 1,
  },

  balanceLabel: {
    fontSize: 11,
    color: '#7A8492',
    fontWeight: '700',
  },

  balanceValue: {
    fontSize: 13,
    fontWeight: '900',
  },

  balanceDue: {
    color: '#C62828',
  },

  balancePaid: {
    color: '#15803D',
  },

  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  paymentMethod: {
    minWidth: 60,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    backgroundColor: '#FBFCFD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentMethodSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },

  paymentMethodText: {
    fontSize: 10,
    color: '#667085',
    fontWeight: '900',
  },

  paymentMethodTextSelected: {
    color: '#FFFFFF',
  },

  paymentNote: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 15,
    color: '#98A2B3',
  },

  requiredNote: {
    marginTop: -3,
    fontSize: 10,
    textAlign: 'center',
    color: '#98A2B3',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 15 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E8ED',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -5 },
    elevation: 12,
  },

  footerCopy: {
    flex: 1,
    marginRight: 10,
  },

  footerLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#98A2B3',
    fontWeight: '900',
  },

  footerAmount: {
    marginTop: 2,
    fontSize: 19,
    color: '#101828',
    fontWeight: '900',
  },

  saveButton: {
    minWidth: 142,
    height: 49,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  saveButtonDisabled: {
    opacity: 0.58,
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonPressed: {
    transform: [{ scale: 0.985 }],
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F5F6F8',
  },

  loadingText: {
    marginTop: 11,
    fontSize: 12,
    color: '#7C8796',
    fontWeight: '600',
  },

  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  stateIconDanger: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  stateIconText: {
    color: '#6D28D9',
    fontSize: 22,
    fontWeight: '900',
  },

  stateTitle: {
    fontSize: 19,
    color: '#101828',
    fontWeight: '900',
    textAlign: 'center',
  },

  stateText: {
    maxWidth: 300,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: '#7C8796',
    textAlign: 'center',
  },

  stateButton: {
    height: 45,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.72,
  },

  pressedSoft: {
    opacity: 0.76,
  },
});
