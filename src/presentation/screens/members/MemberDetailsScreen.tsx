import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function MemberDetailsScreen() {
  const disable = () =>
    Alert.alert('Disable member', 'Are you sure you want to disable Rahul Sharma?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Disable', style: 'destructive'},
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>R</Text>
          </View>
          <Text style={styles.name}>Rahul Sharma</Text>
          <Text style={styles.phone}>+91 98765 43210</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <Section title="Membership">
          <Row label="Plan" value="3 Months" />
          <Row label="Start date" value="13 Sep 2026" />
          <Row label="Expiry date" value="13 Dec 2026" />
          <Row label="Plan amount" value="₹3,000" />
        </Section>

        <Section title="Contact">
          <Row label="Phone" value="+91 98765 43210" />
          <Row label="Email" value="rahul@example.com" />
          <Row label="Date of birth" value="24 March 1998" />
        </Section>

        <Section title="Payments">
          <Row label="Total" value="₹3,000" />
          <Row label="Paid" value="₹2,000" />
          <Row label="Balance" value="₹1,000" />
        </Section>

        <View style={styles.actions}>
          <Pressable
            style={styles.primary}
            onPress={() => Alert.alert('Coming next', 'Payment recording will be connected to SQLite next.')}>
            <Text style={styles.primaryText}>Record Payment</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={disable}>
            <Text style={styles.secondaryText}>Disable Member</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 40},
  profile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    padding: 22,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 30, fontWeight: '800', color: '#374151'},
  name: {fontSize: 22, fontWeight: '800', marginTop: 12, color: '#111827'},
  phone: {marginTop: 4, color: '#6B7280'},
  activeBadge: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeText: {fontSize: 11, fontWeight: '800', color: '#166534'},
  section: {marginTop: 20},
  sectionTitle: {fontSize: 17, fontWeight: '800', marginBottom: 10, color: '#111827'},
  sectionCard: {backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {color: '#6B7280'},
  rowValue: {fontWeight: '700', color: '#111827', maxWidth: '58%', textAlign: 'right'},
  actions: {marginTop: 24, gap: 10},
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {color: '#FFFFFF', fontWeight: '800'},
  secondary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {color: '#B91C1C', fontWeight: '800'},
});
