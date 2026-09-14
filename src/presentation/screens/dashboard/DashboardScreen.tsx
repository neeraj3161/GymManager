import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { container } from '../../../di/container';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  disabledMembers: number;
  feesDue: number;
  birthdaysToday: number;
  expiringSoon: number;
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();

  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);

      const result = await container.useCases.getDashboardStats.execute();

      setStats(result);
    } catch (err) {
      console.error('Failed to load dashboard:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to load dashboard.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load dashboard</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const dashboard = stats ?? {
    totalMembers: 0,
    activeMembers: 0,
    disabledMembers: 0,
    feesDue: 0,
    birthdaysToday: 0,
    expiringSoon: 0,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>

          <Text style={styles.subtitle}>Gym overview</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}
        >
          <Text style={styles.addButtonText}>+ Member</Text>
        </Pressable>
      </View>

      <View style={styles.primaryGrid}>
        <StatCard
          title="Total Members"
          value={dashboard.totalMembers}
          onPress={() => navigation.navigate('Members')}
        />

        <StatCard
          title="Active Members"
          value={dashboard.activeMembers}
          onPress={() =>
            navigation.navigate('Members', {
              filter: 'active',
            })
          }
        />

        <StatCard
          title="Expiring Soon"
          value={dashboard.expiringSoon}
          onPress={() => navigation.navigate('Members')}
        />

        {/* IMPORTANT:
            Fees Due opens ONLY members with
            outstanding fees. */}
        <StatCard
          title="Fees Due"
          value={formatCurrency(dashboard.feesDue)}
          onPress={() =>
            navigation.navigate('Members', {
              filter: 'feesDue',
            })
          }
        />
      </View>

      <Text style={styles.sectionTitle}>Membership Overview</Text>

      <View style={styles.listCard}>
        <DashboardRow title="Total members" value={dashboard.totalMembers} />

        <DashboardRow title="Active members" value={dashboard.activeMembers} />

        <DashboardRow
          title="Disabled members"
          value={dashboard.disabledMembers}
        />

        <DashboardRow
          title="Expiring within 7 days"
          value={dashboard.expiringSoon}
          danger={dashboard.expiringSoon > 0}
        />
      </View>

      <Text style={styles.sectionTitle}>Today</Text>

      <Pressable
        style={styles.actionCard}
        onPress={() => navigation.navigate('Birthdays')}
      >
        <View style={styles.actionLeft}>
          <Text style={styles.actionTitle}>Birthdays Today</Text>

          <Text style={styles.actionSubtitle}>
            Members celebrating their birthday today
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{dashboard.birthdaysToday}</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickActions}>
        <QuickAction
          title="Members"
          subtitle="View all members"
          onPress={() => navigation.navigate('Members')}
        />

        <QuickAction
          title="Add Member"
          subtitle="Register a new member"
          onPress={() => navigation.navigate('AddMember')}
        />

        <QuickAction
          title="Payments"
          subtitle="Record or view payments"
          onPress={() => navigation.navigate('Payments')}
        />

        <QuickAction
          title="Plans"
          subtitle="Manage membership plans"
          onPress={() => navigation.navigate('Plans')}
        />
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  onPress: () => void;
}

function StatCard({ title, value, onPress }: StatCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statTitle}>{title}</Text>
    </Pressable>
  );
}

interface DashboardRowProps {
  title: string;
  value: number | string;
  danger?: boolean;
}

function DashboardRow({ title, value, danger = false }: DashboardRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>

      <Text style={[styles.rowValue, danger && styles.dangerText]}>
        {value}
      </Text>
    </View>
  );
}

interface QuickActionProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

function QuickAction({ title, subtitle, onPress }: QuickActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.quickActionTitle}>{title}</Text>

      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  content: {
    padding: 16,
    paddingBottom: 32,
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
    fontWeight: '700',
    color: '#111827',
  },

  errorText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  statCard: {
    width: '48%',
    minHeight: 110,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    elevation: 2,
  },

  pressed: {
    opacity: 0.7,
  },

  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  statTitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  listCard: {
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },

  rowTitle: {
    fontSize: 15,
    color: '#374151',
  },

  rowValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  dangerText: {
    color: '#DC2626',
  },

  actionCard: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  actionLeft: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  actionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  countText: {
    fontWeight: '800',
    color: '#111827',
  },

  quickActions: {
    gap: 10,
  },

  quickAction: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  quickActionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
});
