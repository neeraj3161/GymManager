#!/bin/bash

set -e

echo "Applying GymManager screens..."

mkdir -p src/navigation
mkdir -p src/presentation/screens/auth
mkdir -p src/presentation/screens/dashboard
mkdir -p src/presentation/screens/members
mkdir -p src/presentation/screens/payments
mkdir -p src/presentation/screens/plans
mkdir -p src/presentation/screens/birthdays
mkdir -p src/presentation/screens/staff
mkdir -p src/presentation/screens/settings

cat > src/navigation/AppNavigator.tsx <<'EOF'
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DashboardScreen} from '../presentation/screens/dashboard/DashboardScreen';
import {MembersScreen} from '../presentation/screens/members/MembersScreen';
import {AddMemberScreen} from '../presentation/screens/members/AddMemberScreen';
import {MemberDetailsScreen} from '../presentation/screens/members/MemberDetailsScreen';
import {PaymentsScreen} from '../presentation/screens/payments/PaymentsScreen';
import {PlansScreen} from '../presentation/screens/plans/PlansScreen';
import {BirthdaysScreen} from '../presentation/screens/birthdays/BirthdaysScreen';
import {StaffScreen} from '../presentation/screens/staff/StaffScreen';
import {SettingsScreen} from '../presentation/screens/settings/SettingsScreen';
import {BackupScreen} from '../presentation/screens/settings/BackupScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Members: undefined;
  AddMember: undefined;
  MemberDetails: {memberId: string};
  Payments: undefined;
  Plans: undefined;
  Birthdays: undefined;
  Staff: undefined;
  Settings: undefined;
  Backup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerTitleStyle: {fontWeight: '700'},
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{title: 'Gym Manager'}}
        />
        <Stack.Screen
          name="Members"
          component={MembersScreen}
          options={{title: 'Members'}}
        />
        <Stack.Screen
          name="AddMember"
          component={AddMemberScreen}
          options={{title: 'Add Member'}}
        />
        <Stack.Screen
          name="MemberDetails"
          component={MemberDetailsScreen}
          options={{title: 'Member Details'}}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{title: 'Payments'}}
        />
        <Stack.Screen
          name="Plans"
          component={PlansScreen}
          options={{title: 'Membership Plans'}}
        />
        <Stack.Screen
          name="Birthdays"
          component={BirthdaysScreen}
          options={{title: 'Birthdays'}}
        />
        <Stack.Screen
          name="Staff"
          component={StaffScreen}
          options={{title: 'Staff'}}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{title: 'Backup & Restore'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
EOF

cat > src/presentation/screens/dashboard/DashboardScreen.tsx <<'EOF'
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function DashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Gym Manager</Text>
            <Text style={styles.subtitle}>Good evening</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Members" value="128" />
          <StatCard label="Active" value="116" />
          <StatCard label="Fees Due" value="₹24,500" />
          <StatCard label="Birthdays" value="3" />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <ActionCard
            title="Add Member"
            icon="+"
            onPress={() => navigation.navigate('AddMember')}
          />
          <ActionCard
            title="Members"
            icon="👥"
            onPress={() => navigation.navigate('Members')}
          />
          <ActionCard
            title="Payments"
            icon="₹"
            onPress={() => navigation.navigate('Payments')}
          />
          <ActionCard
            title="Plans"
            icon="▤"
            onPress={() => navigation.navigate('Plans')}
          />
          <ActionCard
            title="Birthdays"
            icon="★"
            onPress={() => navigation.navigate('Birthdays')}
          />
          <ActionCard
            title="Staff"
            icon="♙"
            onPress={() => navigation.navigate('Staff')}
          />
        </View>

        <Text style={styles.sectionTitle}>Needs Attention</Text>

        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <Text>₹</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Fees overdue</Text>
            <Text style={styles.alertText}>12 members have pending fees</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Payments')}>
            <Text style={styles.viewText}>View</Text>
          </Pressable>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <Text>★</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Birthdays today</Text>
            <Text style={styles.alertText}>3 members have birthdays</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Birthdays')}>
            <Text style={styles.viewText}>View</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 32},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {fontSize: 26, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280', fontSize: 14},
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {fontSize: 21},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statValue: {fontSize: 23, fontWeight: '800', color: '#111827'},
  statLabel: {marginTop: 5, color: '#6B7280'},
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '31%',
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionIcon: {fontSize: 24, marginBottom: 8},
  actionTitle: {fontSize: 12, fontWeight: '700', color: '#374151'},
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {flex: 1, marginLeft: 12},
  alertTitle: {fontWeight: '800', color: '#111827'},
  alertText: {marginTop: 3, color: '#6B7280', fontSize: 13},
  viewText: {fontWeight: '800', color: '#2563EB'},
});
EOF

cat > src/presentation/screens/members/MembersScreen.tsx <<'EOF'
import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const demoMembers = [
  {id: '1', name: 'Rahul Sharma', phone: '9876543210', plan: '3 Months', status: 'Active'},
  {id: '2', name: 'Amit Patil', phone: '9822334455', plan: '1 Month', status: 'Due'},
  {id: '3', name: 'Sneha Kulkarni', phone: '9765432109', plan: '1 Year', status: 'Active'},
  {id: '4', name: 'Rohan Deshmukh', phone: '9898989898', plan: '6 Months', status: 'Expired'},
];

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      demoMembers.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>{demoMembers.length} members</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search members"
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('MemberDetails', {memberId: item.id})
            }>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.plan}>{item.plan}</Text>
            </View>

            <View
              style={[
                styles.status,
                item.status === 'Active'
                  ? styles.active
                  : item.status === 'Due'
                    ? styles.due
                    : styles.expired,
              ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No members found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {fontSize: 16, fontWeight: '700', color: '#374151'},
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {color: '#FFFFFF', fontWeight: '800'},
  search: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  list: {padding: 16, paddingTop: 4},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 18, fontWeight: '800', color: '#374151'},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', fontSize: 16, color: '#111827'},
  phone: {marginTop: 3, color: '#6B7280', fontSize: 12},
  plan: {marginTop: 3, color: '#4B5563', fontSize: 12},
  status: {paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10},
  active: {backgroundColor: '#DCFCE7'},
  due: {backgroundColor: '#FEF3C7'},
  expired: {backgroundColor: '#FEE2E2'},
  statusText: {fontSize: 11, fontWeight: '800', color: '#374151'},
  empty: {textAlign: 'center', color: '#6B7280', marginTop: 40},
});
EOF

cat > src/presentation/screens/members/AddMemberScreen.tsx <<'EOF'
import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [plan, setPlan] = useState('3 Months');

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Name and phone number are required.');
      return;
    }

    Alert.alert('Member added', `${name} has been added.`, [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>New Member</Text>
        <Text style={styles.subtitle}>Enter the member's basic information.</Text>

        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Rahul Sharma" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Optional" keyboardType="email-address" />
        <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" />

        <Text style={styles.label}>Membership plan</Text>
        <View style={styles.planRow}>
          {['1 Month', '3 Months', '6 Months', '1 Year'].map(item => (
            <Pressable
              key={item}
              style={[styles.plan, plan === item && styles.planSelected]}
              onPress={() => setPlan(item)}>
              <Text
                style={[
                  styles.planText,
                  plan === item && styles.planTextSelected,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Selected plan</Text>
          <Text style={styles.summaryValue}>{plan}</Text>
        </View>

        <Pressable style={styles.save} onPress={save}>
          <Text style={styles.saveText}>Add Member</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16, paddingBottom: 40},
  title: {fontSize: 24, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 5, marginBottom: 24, color: '#6B7280'},
  field: {marginBottom: 16},
  label: {fontWeight: '700', color: '#374151', marginBottom: 7},
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  planRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  plan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  planSelected: {backgroundColor: '#111827'},
  planText: {fontWeight: '700', color: '#374151'},
  planTextSelected: {color: '#FFFFFF'},
  summary: {
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {color: '#6B7280'},
  summaryValue: {fontWeight: '800', color: '#111827'},
  save: {
    marginTop: 18,
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {color: '#FFFFFF', fontWeight: '800', fontSize: 16},
});
EOF

cat > src/presentation/screens/members/MemberDetailsScreen.tsx <<'EOF'
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
EOF

cat > src/presentation/screens/payments/PaymentsScreen.tsx <<'EOF'
import React from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const payments = [
  {id: '1', member: 'Rahul Sharma', amount: '₹2,000', date: '13 Sep 2026', type: 'Membership'},
  {id: '2', member: 'Sneha Kulkarni', amount: '₹9,500', date: '12 Sep 2026', type: 'Membership'},
  {id: '3', member: 'Amit Patil', amount: '₹1,000', date: '11 Sep 2026', type: 'Partial payment'},
];

export function PaymentsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Collected this month</Text>
        <Text style={styles.total}>₹1,24,500</Text>
        <Text style={styles.pending}>₹24,500 pending</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Recent payments</Text>
        <Pressable
          style={styles.button}
          onPress={() => undefined}>
          <Text style={styles.buttonText}>+ Payment</Text>
        </Pressable>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Text>₹</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.member}>{item.member}</Text>
              <Text style={styles.meta}>{item.type} • {item.date}</Text>
            </View>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  summary: {backgroundColor: '#FFFFFF', margin: 16, padding: 18, borderRadius: 18},
  summaryLabel: {color: '#6B7280'},
  total: {fontSize: 30, fontWeight: '800', marginTop: 4, color: '#111827'},
  pending: {marginTop: 4, color: '#B45309'},
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: '800', color: '#111827'},
  button: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  buttonText: {color: '#FFFFFF', fontWeight: '800'},
  list: {padding: 16},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1, marginLeft: 12},
  member: {fontWeight: '800', color: '#111827'},
  meta: {marginTop: 4, color: '#6B7280', fontSize: 12},
  amount: {fontWeight: '800', color: '#111827'},
});
EOF

cat > src/presentation/screens/plans/PlansScreen.tsx <<'EOF'
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

const plans = [
  {name: '1 Month', months: 1, amount: '₹1,200'},
  {name: '3 Months', months: 3, amount: '₹3,000'},
  {name: '6 Months', months: 6, amount: '₹5,500'},
  {name: '1 Year', months: 12, amount: '₹9,500'},
];

export function PlansScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Create and manage gym plans.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() => Alert.alert('Create plan', 'Plan creation will be connected to SQLite next.')}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {plans.map(plan => (
          <View style={styles.card} key={plan.name}>
            <View>
              <Text style={styles.name}>{plan.name}</Text>
              <Text style={styles.duration}>{plan.months} month{plan.months > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{plan.amount}</Text>
              <Pressable onPress={() => Alert.alert('Edit plan', `Edit ${plan.name}`)}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280'},
  add: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  addText: {color: '#FFFFFF', fontWeight: '800'},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {fontSize: 17, fontWeight: '800', color: '#111827'},
  duration: {marginTop: 4, color: '#6B7280'},
  right: {alignItems: 'flex-end'},
  amount: {fontSize: 18, fontWeight: '800', color: '#111827'},
  edit: {marginTop: 5, fontWeight: '700', color: '#2563EB'},
});
EOF

cat > src/presentation/screens/birthdays/BirthdaysScreen.tsx <<'EOF'
import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const birthdays = [
  {name: 'Sneha Kulkarni', date: 'Today', age: 28, phone: '9765432109'},
  {name: 'Rahul Sharma', date: 'Tomorrow', age: 29, phone: '9876543210'},
  {name: 'Priya Joshi', date: '18 Sep', age: 26, phone: '9812345678'},
];

export function BirthdaysScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Birthday reminders</Text>
        <Text style={styles.bannerText}>
          Send birthday wishes by SMS when the reminder is due.
        </Text>
      </View>

      {birthdays.map(item => (
        <View style={styles.card} key={item.name}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.date} • Turning {item.age}</Text>
          </View>
          <Pressable
            style={styles.sms}
            onPress={() =>
              Alert.alert('Birthday SMS', `Send birthday wish to ${item.name}?`)
            }>
            <Text style={styles.smsText}>SMS</Text>
          </Pressable>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9', padding: 16},
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
  },
  bannerTitle: {fontSize: 19, fontWeight: '800', color: '#111827'},
  bannerText: {marginTop: 5, color: '#6B7280', lineHeight: 19},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontWeight: '800', fontSize: 18},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', color: '#111827'},
  date: {marginTop: 4, color: '#6B7280', fontSize: 12},
  sms: {backgroundColor: '#111827', borderRadius: 10, padding: 9},
  smsText: {color: '#FFFFFF', fontWeight: '800', fontSize: 12},
});
EOF

cat > src/presentation/screens/staff/StaffScreen.tsx <<'EOF'
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

const staff = [
  {name: 'Gym Owner', role: 'Owner', status: 'Active'},
  {name: 'Manager', role: 'Manager', status: 'Active'},
  {name: 'Reception', role: 'Receptionist', status: 'Active'},
];

export function StaffScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Staff & Users</Text>
            <Text style={styles.subtitle}>Manage access and permissions.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() => Alert.alert('Add user', 'User creation will be connected to authentication next.')}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {staff.map(person => (
          <View style={styles.card} key={person.name}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{person.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.role}>{person.role}</Text>
            </View>
            <View style={styles.active}>
              <Text style={styles.activeText}>{person.status}</Text>
            </View>
          </View>
        ))}

        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Roles</Text>
          <Text style={styles.permissionText}>
            Owner, Manager, Receptionist and Trainer roles will control
            permissions such as members, payments, plans, staff and backups.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280'},
  add: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  addText: {color: '#FFFFFF', fontWeight: '800'},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontWeight: '800', fontSize: 18},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', color: '#111827'},
  role: {marginTop: 4, color: '#6B7280'},
  active: {backgroundColor: '#DCFCE7', borderRadius: 9, padding: 7},
  activeText: {color: '#166534', fontSize: 11, fontWeight: '800'},
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginTop: 10,
  },
  permissionTitle: {fontWeight: '800', fontSize: 17, color: '#111827'},
  permissionText: {marginTop: 8, color: '#6B7280', lineHeight: 20},
});
EOF

cat > src/presentation/screens/settings/SettingsScreen.tsx <<'EOF'
import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.group}>Gym</Text>
        <SettingRow title="Gym Profile" subtitle="Name, phone, address" onPress={() => Alert.alert('Gym Profile', 'Gym profile editor comes next.')} />
        <SettingRow title="Membership Plans" subtitle="Manage durations and prices" onPress={() => navigation.navigate('Plans')} />

        <Text style={styles.group}>Reminders</Text>
        <ToggleRow title="Birthday reminders" subtitle="Show upcoming birthdays" />
        <ToggleRow title="Fee reminders" subtitle="Remind about overdue fees" />

        <Text style={styles.group}>Data</Text>
        <SettingRow title="Backup & Restore" subtitle="Export or restore your database" onPress={() => navigation.navigate('Backup')} />

        <Text style={styles.group}>Application</Text>
        <SettingRow title="About Gym Manager" subtitle="Offline-first gym management" onPress={() => Alert.alert('Gym Manager', 'Local-first Android gym management app.')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function ToggleRow({title, subtitle}: {title: string; subtitle: string}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch value onValueChange={() => undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  title: {fontSize: 25, fontWeight: '800', color: '#111827'},
  group: {
    marginTop: 24,
    marginBottom: 9,
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowInfo: {flex: 1},
  rowTitle: {fontWeight: '800', color: '#111827'},
  rowSubtitle: {marginTop: 4, color: '#6B7280', fontSize: 12},
  chevron: {fontSize: 28, color: '#9CA3AF'},
});
EOF

cat > src/presentation/screens/settings/BackupScreen.tsx <<'EOF'
import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function BackupScreen() {
  const backup = () =>
    Alert.alert('Backup database', 'The encrypted .gymbackup export will be implemented next.');

  const restore = () =>
    Alert.alert(
      'Restore database',
      'Restoring a backup replaces the current local database. This will require confirmation and authentication.',
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.info}>
          <Text style={styles.title}>Backup & Restore</Text>
          <Text style={styles.text}>
            Keep a copy of your gym data so it can be restored if the device
            is replaced or the app is reinstalled.
          </Text>
        </View>

        <Pressable style={styles.primary} onPress={backup}>
          <Text style={styles.primaryText}>Export Database</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={restore}>
          <Text style={styles.secondaryText}>Restore Backup</Text>
        </Pressable>

        <Text style={styles.note}>
          Recommended format: encrypted .gymbackup with schema and app
          version metadata.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  info: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16},
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  text: {marginTop: 8, color: '#6B7280', lineHeight: 20},
  primary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: {color: '#FFFFFF', fontWeight: '800'},
  secondary: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {fontWeight: '800', color: '#111827'},
  note: {marginTop: 18, color: '#6B7280', fontSize: 12, lineHeight: 18},
});
EOF

cat > src/presentation/screens/auth/LoginScreen.tsx <<'EOF'
import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.logo}>Gym Manager</Text>
        <Text style={styles.subtitle}>Sign in to your gym</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          style={styles.button}
          onPress={() => Alert.alert('Login', 'Authentication will be connected to the local user database next.')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 24, justifyContent: 'center', flex: 1},
  logo: {fontSize: 30, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 6, marginBottom: 30, color: '#6B7280'},
  label: {fontWeight: '700', marginBottom: 7, color: '#374151'},
  input: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 17,
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {color: '#FFFFFF', fontWeight: '800'},
});
EOF

echo ""
echo "Screens applied successfully."
echo ""
echo "Next:"
echo "npm install @react-navigation/native @react-navigation/native-stack"
echo "npm install react-native-screens react-native-safe-area-context"
echo "npx tsc --noEmit"
echo "npm run android"
