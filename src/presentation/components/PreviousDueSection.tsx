import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import { PaymentMethod } from '../../domain/entities/Payment';

export type PreviousDueAction = 'collect' | 'write_off' | 'carry_forward';

interface PreviousDueSectionProps {
  amount: number;

  action: PreviousDueAction;

  onActionChange: (action: PreviousDueAction) => void;

  collectAmount: string;

  onCollectAmountChange: (value: string) => void;

  paymentMethod: PaymentMethod;

  onPaymentMethodChange: (method: PaymentMethod) => void;

  writeOffReason: string;

  onWriteOffReasonChange: (value: string) => void;
}

const paymentMethods: PaymentMethod[] = [
  'cash',
  'upi',
  'card',
  'bank',
  'other',
];

export function PreviousDueSection({
  amount,
  action,
  onActionChange,
  collectAmount,
  onCollectAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  writeOffReason,
  onWriteOffReasonChange,
}: PreviousDueSectionProps) {
  if (amount <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Previous Due</Text>

        <Text style={styles.noDue}>No outstanding amount</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Previous Due</Text>

      <Text style={styles.amount}>₹{amount.toLocaleString('en-IN')}</Text>

      <Text style={styles.subtitle}>
        What would you like to do with the previous outstanding amount?
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionButton,
            action === 'collect' && styles.selectedAction,
          ]}
          onPress={() => onActionChange('collect')}
        >
          <Text
            style={[
              styles.actionText,
              action === 'collect' && styles.selectedActionText,
            ]}
          >
            Collect
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            action === 'write_off' && styles.selectedAction,
          ]}
          onPress={() => onActionChange('write_off')}
        >
          <Text
            style={[
              styles.actionText,
              action === 'write_off' && styles.selectedActionText,
            ]}
          >
            Write Off
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            action === 'carry_forward' && styles.selectedAction,
          ]}
          onPress={() => onActionChange('carry_forward')}
        >
          <Text
            style={[
              styles.actionText,
              action === 'carry_forward' && styles.selectedActionText,
            ]}
          >
            Carry Forward
          </Text>
        </Pressable>
      </View>

      {action === 'collect' && (
        <View style={styles.details}>
          <Text style={styles.label}>Collection Amount</Text>

          <TextInput
            value={collectAmount}
            onChangeText={onCollectAmountChange}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            style={styles.input}
          />

          <Text style={styles.label}>Payment Method</Text>

          <View style={styles.methods}>
            {paymentMethods.map(method => {
              const selected = paymentMethod === method;

              return (
                <Pressable
                  key={method}
                  style={[
                    styles.methodButton,
                    selected && styles.selectedMethod,
                  ]}
                  onPress={() => onPaymentMethodChange(method)}
                >
                  <Text
                    style={[
                      styles.methodText,
                      selected && styles.selectedMethodText,
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
      )}

      {action === 'write_off' && (
        <View style={styles.details}>
          <Text style={styles.label}>Write-off Reason</Text>

          <TextInput
            value={writeOffReason}
            onChangeText={onWriteOffReasonChange}
            placeholder="Enter reason"
            multiline
            style={[styles.input, styles.reasonInput]}
          />
        </View>
      )}

      {action === 'carry_forward' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            The outstanding ₹{amount.toLocaleString('en-IN')} will be
            transferred to the new membership.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  amount: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    color: '#6B7280',
    lineHeight: 20,
  },

  noDue: {
    marginTop: 8,
    color: '#6B7280',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },

  selectedAction: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  selectedActionText: {
    color: '#FFFFFF',
  },

  details: {
    marginTop: 18,
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },

  reasonInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  selectedMethod: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  selectedMethodText: {
    color: '#FFFFFF',
  },

  infoBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  infoText: {
    color: '#374151',
    lineHeight: 20,
  },
});
