import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>('cash');

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setPaymentAmount(String(activePlans[0].amount));
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

  const handlePlanChange = (plan: MembershipPlan) => {
    setSelectedPlanId(plan.id);

    if (!paymentAmount || paymentAmount === '0') {
      setPaymentAmount(String(plan.amount));
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
        firstName,
        lastName,
        phone,
        email,
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
        'Member Added',
        `${member.firstName} has been added successfully.`,
        [
          {
            text: 'View Member',
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading membership plans...</Text>
      </View>
    );
  }

  if (error && plans.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load plans</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadPlans}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No membership plans</Text>

        <Text style={styles.errorText}>
          Create an active membership plan before adding a member.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => navigation.navigate('Plans')}
        >
          <Text style={styles.retryText}>Manage Plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle title="Member Information" />

        <Field
          label="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
        />

        <Field
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
        />

        <Field
          label="Phone *"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Field
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />

        <SectionTitle title="Membership" />

        <Text style={styles.label}>Membership Plan *</Text>

        <View style={styles.planList}>
          {plans.map(plan => {
            const selected = plan.id === selectedPlanId;

            return (
              <Pressable
                key={plan.id}
                style={[styles.planCard, selected && styles.planCardSelected]}
                onPress={() => handlePlanChange(plan)}
              >
                <View style={styles.planInfo}>
                  <Text
                    style={[
                      styles.planName,
                      selected && styles.planNameSelected,
                    ]}
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
          label="Start Date *"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />

        {calculatedEndDate && (
          <View style={styles.expiryBox}>
            <Text style={styles.expiryLabel}>Membership Ends</Text>

            <Text style={styles.expiryDate}>{calculatedEndDate}</Text>
          </View>
        )}

        {selectedPlan && (
          <View style={styles.amountBox}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Membership Amount</Text>

              <Text style={styles.amountValue}>
                ₹{selectedPlan.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        <SectionTitle title="Initial Payment" />

        <Field
          label="Payment Amount"
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Text style={styles.helper}>
          Enter 0 if the member has not paid anything yet.
        </Text>

        <Text style={styles.label}>Payment Method</Text>

        <View style={styles.paymentMethods}>
          {PAYMENT_METHODS.map(method => {
            const selected = paymentMethod === method.value;

            return (
              <Pressable
                key={method.value}
                style={[
                  styles.paymentButton,
                  selected && styles.paymentButtonSelected,
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    selected && styles.paymentButtonTextSelected,
                  ]}
                >
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Add Member</Text>
          )}
        </Pressable>

        <Text style={styles.requiredText}>* Required fields</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
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
    padding: 24,
    backgroundColor: '#F6F7F9',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 14,
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  field: {
    marginBottom: 14,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 15,
  },

  planList: {
    gap: 10,
    marginBottom: 14,
  },

  planCard: {
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  planCardSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  planNameSelected: {
    color: '#FFFFFF',
  },

  planDuration: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  planDurationSelected: {
    color: '#D1D5DB',
  },

  planAmount: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  planAmountSelected: {
    color: '#FFFFFF',
  },

  expiryBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  expiryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  expiryDate: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  amountBox: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  amountLabel: {
    color: '#6B7280',
    fontSize: 14,
  },

  amountValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  helper: {
    marginTop: -6,
    marginBottom: 16,
    fontSize: 12,
    color: '#6B7280',
  },

  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  paymentButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },

  paymentButtonSelected: {
    backgroundColor: '#111827',
  },

  paymentButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },

  paymentButtonTextSelected: {
    color: '#FFFFFF',
  },

  saveButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  requiredText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
  },
});
