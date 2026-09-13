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
