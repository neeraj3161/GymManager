import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MembershipStartDateOption = 'previous_end' | 'today';

interface MembershipStartDateSectionProps {
  previousEndDate: string;
  selected: MembershipStartDateOption;
  onChange: (option: MembershipStartDateOption) => void;
}

function formatDate(dateValue: string): string {
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MembershipStartDateSection({
  previousEndDate,
  selected,
  onChange,
}: MembershipStartDateSectionProps) {
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
      date: formatDate(new Date().toISOString()),
    },
  ];

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
            <View>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.date}>{option.date}</Text>
            </View>
          </Pressable>
        );
      })}
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
});
