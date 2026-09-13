import React, {useCallback, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {DashboardStats} from '../../../application/dashboard/GetDashboardStats';
import {container} from '../../../di/container';

const emptyStats: DashboardStats = {
  totalMembers: 0,
  activeMembers: 0,
  disabledMembers: 0,
  feesDue: 0,
  birthdaysToday: 0,
  expiringSoon: 0,
};

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState(emptyStats);

  const load = useCallback(async () => {
    setStats(await container.useCases.getDashboardStats.execute());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Gym Manager</Text>
            <Text style={styles.subtitle}>Your gym at a glance</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Members" value={String(stats.totalMembers)} />
          <StatCard label="Active" value={String(stats.activeMembers)} />
          <StatCard
            label="Fees Due"
            value={`₹${stats.feesDue.toLocaleString('en-IN')}`}
          />
          <StatCard label="Birthdays Today" value={String(stats.birthdaysToday)} />
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
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Memberships expiring soon</Text>
            <Text style={styles.alertText}>
              {stats.expiringSoon} membership{stats.expiringSoon === 1 ? '' : 's'} expire within 7 days.
            </Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Disabled members</Text>
            <Text style={styles.alertText}>
              {stats.disabledMembers} member{stats.disabledMembers === 1 ? '' : 's'} currently disabled.
            </Text>
          </View>
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
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
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
  actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  alertBody: {flex: 1},
  alertTitle: {fontWeight: '800', color: '#111827'},
  alertText: {marginTop: 3, color: '#6B7280', fontSize: 13},
});
