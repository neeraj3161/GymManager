import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

interface UnusedCreditToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  creditAmount: number;
}

export function UnusedCreditToggle({
  enabled,
  onChange,
  creditAmount,
}: UnusedCreditToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>Apply unused membership credit</Text>
        <Text style={styles.description}>
          {creditAmount > 0
            ? enabled
              ? `Apply ₹${creditAmount.toLocaleString('en-IN')} to this plan.`
              : `₹${creditAmount.toLocaleString(
                  'en-IN',
                )} available, not applied.`
            : 'Use eligible unused time from the current membership.'}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onChange}
        accessibilityLabel="Apply unused membership credit"
        trackColor={{ false: '#D1D5DB', true: '#15803D' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    backgroundColor: '#F4F8F4',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#17251B',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    marginTop: 4,
    color: '#607064',
    fontSize: 12,
    lineHeight: 17,
  },
});
