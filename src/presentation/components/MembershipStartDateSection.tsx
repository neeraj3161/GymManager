import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDateOnly, parseDateOnly } from '../../shared/utils/date';

export type MembershipStartDateOption = 'previous_end' | 'today' | 'custom';

interface MembershipStartDateSectionProps {
  previousEndDate: string;
  selected: MembershipStartDateOption;
  customDate?: string;
  onChange: (option: MembershipStartDateOption) => void;
  onCustomDateChange?: (value: string) => void;
}

function formatDate(dateValue: string): string {
  const parsed = parseDateOnly(dateValue) ?? new Date(dateValue);

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MembershipStartDateSection({
  previousEndDate,
  selected,
  customDate,
  onChange,
  onCustomDateChange,
}: MembershipStartDateSectionProps) {
  const currentCustomDate = customDate || formatDateOnly(new Date());

  const options: Array<{
    value: MembershipStartDateOption;
    label: string;
    date: string;
  }> = [
    {
      value: 'previous_end',
      label: 'Previous plan end date',
      date: formatDate(previousEndDate),
    },
    {
      value: 'today',
      label: 'Today',
      date: formatDate(formatDateOnly(new Date())),
    },
    {
      value: 'custom',
      label: 'Custom date',
      date: formatDate(currentCustomDate),
    },
  ];

  const handleCustomDateChange = (value: string) => {
    const sanitized = value.replace(/[^\d-]/g, '').slice(0, 10);
    onCustomDateChange?.(sanitized);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New membership start date</Text>

      {options.map(option => {
        const isSelected = selected === option.value;

        return (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => onChange(option.value)}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.labelWrap}>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.date}>{option.date}</Text>
            </View>
          </Pressable>
        );
      })}

      {selected === 'custom' ? (
        <View style={styles.customInputWrap}>
          <Text style={styles.customInputLabel}>Start date (YYYY-MM-DD)</Text>
          <TextInput
            value={currentCustomDate}
            onChangeText={handleCustomDateChange}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
            maxLength={10}
            style={styles.dateInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Enter a valid date in YYYY-MM-DD format.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginTop: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  labelWrap: {
    flex: 1,
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
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    marginTop: 2,
    color: '#6B7280',
  },
  customInputWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  customInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
});
