import React, { useCallback, useEffect, useState } from 'react';
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
import { appUpdater } from '../../../appUpdater';
import { APP_VERSION } from '../../../shared/constants/app';

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
  const [showCollections, setShowCollections] = useState(false);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [yearlyCollection, setYearlyCollection] = useState(0);
  const [gymName, setGymName] = useState('');
  const [appVersion, setAppVersion] = useState(APP_VERSION);

  useEffect(() => {
    navigation.setOptions({
      title: gymName ? `${gymName} Manager` : 'Manager',
    });
  }, [gymName, navigation]);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);

      const [result, collectionsEnabled] = await Promise.all([
        container.useCases.getDashboardStats.execute(),
        container.useCases.getShowCollectionsSetting.execute(),
      ]);

      const gym = await container.useCases.getGymProfile.execute();
      setGymName(gym?.name?.trim() ?? '');

      try {
        const version = await appUpdater.getVersion();
        setAppVersion(version.versionName || APP_VERSION);
      } catch {
        setAppVersion(APP_VERSION);
      }

      setStats(result);
      setShowCollections(Boolean(collectionsEnabled));

      if (collectionsEnabled) {
        const now = new Date();
        const fmt = (date: Date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            '0',
          )}-${String(date.getDate()).padStart(2, '0')}`;

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

        const [monthly, yearly] = await Promise.all([
          container.useCases.getCollectionReport.execute(
            fmt(monthStart),
            fmt(monthEnd),
          ),
          container.useCases.getCollectionReport.execute(
            fmt(yearStart),
            fmt(yearEnd),
          ),
        ]);

        setMonthlyCollection(monthly.totalAmount);
        setYearlyCollection(yearly.totalAmount);
      } else {
        setMonthlyCollection(0);
        setYearlyCollection(0);
      }
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
        <View style={styles.loaderShell}>
          <ActivityIndicator size="small" color={colors.ink} />
        </View>
        <Text style={styles.loadingText}>Preparing your dashboard</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressedStrong,
          ]}
          onPress={loadDashboard}
        >
          <Text style={styles.retryText}>Try again</Text>
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

  const activePercentage =
    dashboard.totalMembers > 0
      ? Math.round((dashboard.activeMembers / dashboard.totalMembers) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.ink}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {gymName ? `${gymName.toUpperCase()}  MANAGER` : 'GYM MANAGER'}
          </Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Everything important, in one place.
          </Text>
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add member"
          style={({ pressed }) => [
            styles.addMemberButton,
            pressed && styles.pressedStrong,
          ]}
          onPress={() => navigation.navigate('AddMember')}
        >
          <Text style={styles.addMemberPlus}>+</Text>
        </Pressable>
      </View>

      <View style={styles.focusCard}>
        <View pointerEvents="none" style={styles.focusOrbOne} />
        <View pointerEvents="none" style={styles.focusOrbTwo} />

        <View style={styles.focusTopRow}>
          <View style={styles.focusHeadingWrap}>
            <Text style={styles.focusEyebrow}>TODAY'S FOCUS</Text>
            <Text style={styles.focusTitle}>{getFocusTitle(dashboard)}</Text>
            <Text style={styles.focusSubtitle}>
              {formatDashboardDate(new Date())}
            </Text>
          </View>

          <View style={styles.focusIconCircle}>
            <Text style={styles.focusIcon}>✦</Text>
          </View>
        </View>

        <View style={styles.focusStatsRow}>
          <FocusStat
            label="Fees due"
            value={formatCurrency(dashboard.feesDue)}
            tone="red"
          />
          <FocusStat
            label="Expired / soon"
            value={String(dashboard.expiringSoon)}
            suffix="members"
            tone="amber"
          />
          <FocusStat
            label="Birthdays"
            value={String(dashboard.birthdaysToday)}
            suffix="today"
            tone="violet"
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Needs attention</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any card to take action.
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.dueCard, pressed && styles.pressedCard]}
        onPress={() =>
          navigation.navigate('Members', {
            filter: 'feesDue',
          })
        }
      >
        <View style={styles.dueIconWrap}>
          <Text style={styles.dueIcon}>₹</Text>
        </View>
        <View style={styles.dueContent}>
          <Text style={styles.dueLabel}>FEES DUE</Text>
          <Text style={styles.dueAmount}>
            {formatCurrency(dashboard.feesDue)}
          </Text>
          <Text style={styles.dueMeta}>
            {dashboard.feesDue > 0
              ? 'Outstanding member balances'
              : 'All fees are up to date'}
          </Text>
        </View>
        <View style={styles.dueChevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </Pressable>

      <View style={styles.attentionGrid}>
        <AttentionCard
          icon="◷"
          label="EXPIRED / EXPIRING"
          value={String(dashboard.expiringSoon)}
          caption="Expired or next 7 days"
          tone="amber"
          onPress={() =>
            navigation.navigate('Members', {
              filter: 'expiringSoon',
            })
          }
        />
        <AttentionCard
          icon="B"
          label="BIRTHDAYS"
          value={String(dashboard.birthdaysToday)}
          caption="Today"
          tone="violet"
          onPress={() => navigation.navigate('Birthdays')}
        />
      </View>

      {showCollections && (
        <>
          <View style={styles.sectionHeaderCompact}>
            <View>
              <Text style={styles.sectionTitle}>Collections</Text>
              <Text style={styles.sectionSubtitle}>Payments received</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('PaymentsOverview')}
              hitSlop={12}
            >
              <Text style={styles.textLink}>View members</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.collectionCard,
              pressed && styles.pressedCard,
            ]}
            onPress={() => navigation.navigate('PaymentsOverview')}
          >
            <View style={styles.collectionMain}>
              <View style={styles.collectionIcon}>
                <Text style={styles.collectionIconText}>₹</Text>
              </View>
              <View style={styles.collectionCopy}>
                <Text style={styles.collectionLabel}>THIS MONTH</Text>
                <Text style={styles.collectionValue}>
                  {formatCurrency(monthlyCollection)}
                </Text>
              </View>
            </View>

            <View style={styles.collectionDivider} />

            <View style={styles.collectionYearBlock}>
              <Text style={styles.collectionYearLabel}>THIS YEAR</Text>
              <Text style={styles.collectionYearValue}>
                {formatCurrency(yearlyCollection)}
              </Text>
            </View>
          </Pressable>
        </>
      )}

      <View style={styles.sectionHeaderCompact}>
        <View>
          <Text style={styles.sectionTitle}>Shortcuts</Text>
          <Text style={styles.sectionSubtitle}>
            Common tasks, one tap away.
          </Text>
        </View>
      </View>

      <View style={styles.shortcutGrid}>
        <ShortcutCard
          icon="M"
          title="Members"
          subtitle="View all"
          tone="blue"
          onPress={() => navigation.navigate('Members')}
        />
        <ShortcutCard
          icon="+"
          title="Add member"
          subtitle="Create profile"
          tone="ink"
          onPress={() => navigation.navigate('AddMember')}
        />
        <ShortcutCard
          icon="₹"
          title="Payments"
          subtitle="Received payments"
          tone="green"
          onPress={() => navigation.navigate('PaymentsOverview')}
        />
        <ShortcutCard
          icon="P"
          title="Plans"
          subtitle="Manage plans"
          tone="violet"
          onPress={() => navigation.navigate('Plans')}
        />
      </View>

      <View style={styles.statusStrip}>
        <View style={styles.statusIcon}>
          <Text style={styles.statusIconText}>✓</Text>
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>Membership snapshot</Text>
          <Text style={styles.statusText}>
            {dashboard.activeMembers} active of {dashboard.totalMembers} total
            members
          </Text>
        </View>
        <Text style={styles.statusPercent}>{activePercentage}%</Text>
      </View>
    </ScrollView>
  );
}

interface AttentionCardProps {
  icon: string;
  label: string;
  value: string;
  caption: string;
  tone: 'amber' | 'violet';
  onPress: () => void;
}

function AttentionCard({
  icon,
  label,
  value,
  caption,
  tone,
  onPress,
}: AttentionCardProps) {
  const toneStyles =
    tone === 'amber'
      ? {
          iconWrap: styles.amberIconWrap,
          icon: styles.amberIconText,
          value: styles.amberValue,
        }
      : {
          iconWrap: styles.violetIconWrap,
          icon: styles.violetIconText,
          value: styles.violetValue,
        };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.attentionCard,
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}
    >
      <View style={[styles.attentionIconWrap, toneStyles.iconWrap]}>
        <Text style={[styles.attentionIconText, toneStyles.icon]}>{icon}</Text>
      </View>
      <View style={styles.attentionValueRow}>
        <Text style={[styles.attentionValue, toneStyles.value]}>{value}</Text>
        <Text style={styles.attentionArrow}>›</Text>
      </View>
      <Text style={styles.attentionLabel}>{label}</Text>
      <Text style={styles.attentionCaption}>{caption}</Text>
    </Pressable>
  );
}

interface ShortcutCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tone: 'blue' | 'ink' | 'green' | 'violet';
  onPress: () => void;
}

function ShortcutCard({
  icon,
  title,
  subtitle,
  tone,
  onPress,
}: ShortcutCardProps) {
  const toneStyles = {
    blue: {
      iconWrap: styles.blueShortcutIcon,
      iconText: styles.blueShortcutIconText,
    },
    ink: {
      iconWrap: styles.inkShortcutIcon,
      iconText: styles.inkShortcutIconText,
    },
    green: {
      iconWrap: styles.greenShortcutIcon,
      iconText: styles.greenShortcutIconText,
    },
    violet: {
      iconWrap: styles.violetShortcutIcon,
      iconText: styles.violetShortcutIconText,
    },
  }[tone];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.shortcutCard,
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}
    >
      <View style={[styles.shortcutIconWrap, toneStyles.iconWrap]}>
        <Text style={[styles.shortcutIconText, toneStyles.iconText]}>
          {icon}
        </Text>
      </View>
      <Text style={styles.shortcutTitle}>{title}</Text>
      <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

interface FocusStatProps {
  label: string;
  value: string;
  suffix?: string;
  tone: 'red' | 'amber' | 'violet';
}

function FocusStat({ label, value, suffix, tone }: FocusStatProps) {
  const toneStyles = {
    red: {
      dot: styles.focusDotRed,
      value: styles.focusValueRed,
    },
    amber: {
      dot: styles.focusDotAmber,
      value: styles.focusValueAmber,
    },
    violet: {
      dot: styles.focusDotViolet,
      value: styles.focusValueViolet,
    },
  }[tone];

  return (
    <View style={styles.focusStat}>
      <View style={styles.focusLabelRow}>
        <View style={[styles.focusDot, toneStyles.dot]} />
        <Text style={styles.focusLabel}>{label}</Text>
      </View>
      <Text style={[styles.focusValue, toneStyles.value]}>{value}</Text>
      {suffix ? <Text style={styles.focusSuffix}>{suffix}</Text> : null}
    </View>
  );
}

function getFocusTitle(dashboard: DashboardStats): string {
  const needsAttention =
    Number(dashboard.feesDue > 0) +
    Number(dashboard.expiringSoon > 0) +
    Number(dashboard.birthdaysToday > 0);

  if (needsAttention === 0) {
    return 'Everything looks clear.';
  }

  if (dashboard.feesDue > 0) {
    return 'A few things need your attention.';
  }

  if (dashboard.expiringSoon > 0) {
    return 'Keep an eye on upcoming renewals.';
  }

  return 'Make today a little more personal.';
}

function formatDashboardDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const colors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  ink: '#0D1220',
  inkSoft: '#303849',
  muted: '#7B8496',
  subtle: '#A6ADBA',
  border: '#E9ECF2',
  hero: '#101827',
  heroMuted: '#98A2B3',
  white: '#FFFFFF',
  blue: '#3B82F6',
  blueSoft: '#EEF5FF',
  green: '#149A67',
  greenSoft: '#EAF8F2',
  amber: '#C77B17',
  amberSoft: '#FFF5E6',
  violet: '#7657D8',
  violetSoft: '#F1EEFF',
  red: '#C73C3C',
  redSoft: '#FFF0F0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 42,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: colors.background,
  },

  loaderShell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingText: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.redSoft,
    marginBottom: 16,
  },

  errorIconText: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.red,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.4,
  },

  errorText: {
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
    color: colors.muted,
    lineHeight: 20,
    fontSize: 13,
  },

  retryButton: {
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },

  retryText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: colors.subtle,
    marginBottom: 5,
  },

  title: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },

  version: {
    marginTop: 4,
    fontSize: 10,
    color: colors.subtle,
    fontWeight: '700',
  },

  addMemberButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  addMemberPlus: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 27,
    fontWeight: '400',
    marginTop: -2,
  },

  focusCard: {
    minHeight: 214,
    padding: 20,
    borderRadius: 28,
    backgroundColor: '#151A24',
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#0A0F1A',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  focusOrbOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -55,
    top: -70,
    backgroundColor: '#6D4AFF',
    opacity: 0.1,
  },

  focusOrbTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -50,
    bottom: -80,
    backgroundColor: '#2EC49A',
    opacity: 0.08,
  },

  focusTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  focusHeadingWrap: {
    flex: 1,
    paddingRight: 14,
  },

  focusEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#8F98A7',
  },

  focusTitle: {
    marginTop: 8,
    maxWidth: 285,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  focusSubtitle: {
    marginTop: 5,
    fontSize: 11,
    color: '#9DA6B4',
    fontWeight: '600',
  },

  focusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#20293A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  focusIcon: {
    color: '#E8E1FF',
    fontSize: 18,
    fontWeight: '700',
  },

  focusStatsRow: {
    flexDirection: 'row',
    marginTop: 26,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2C3442',
  },

  focusStat: {
    flex: 1,
    paddingRight: 8,
  },

  focusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  focusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  focusDotRed: {
    backgroundColor: '#F87171',
  },

  focusDotAmber: {
    backgroundColor: '#F6C46A',
  },

  focusDotViolet: {
    backgroundColor: '#B6A0FF',
  },

  focusLabel: {
    fontSize: 9,
    color: '#99A3B2',
    fontWeight: '800',
  },

  focusValue: {
    marginTop: 7,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },

  focusValueRed: {
    color: '#FF9D9D',
  },

  focusValueAmber: {
    color: '#FFD28A',
  },

  focusValueViolet: {
    color: '#C7B8FF',
  },

  focusSuffix: {
    marginTop: 2,
    fontSize: 9,
    color: '#7F8999',
    fontWeight: '600',
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionHeaderCompact: {
    marginTop: 26,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.45,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },

  textLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.inkSoft,
    paddingBottom: 1,
  },

  dueCard: {
    minHeight: 126,
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  dueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.redSoft,
  },

  dueIcon: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.red,
  },

  dueContent: {
    flex: 1,
    marginHorizontal: 14,
  },

  dueLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: colors.subtle,
  },

  dueAmount: {
    marginTop: 3,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },

  dueMeta: {
    marginTop: 3,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },

  dueChevron: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F8',
  },

  chevronText: {
    fontSize: 23,
    lineHeight: 24,
    color: colors.inkSoft,
    marginTop: -2,
  },

  attentionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },

  attentionCard: {
    width: '48.4%',
    minHeight: 146,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  attentionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  attentionIconText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },

  amberIconWrap: {
    backgroundColor: colors.amberSoft,
  },

  amberIconText: {
    color: colors.amber,
  },

  violetIconWrap: {
    backgroundColor: colors.violetSoft,
  },

  violetIconText: {
    color: colors.violet,
  },

  attentionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  attentionValue: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },

  amberValue: {
    color: colors.amber,
  },

  violetValue: {
    color: colors.violet,
  },

  attentionArrow: {
    fontSize: 22,
    color: '#B5BCC8',
    marginRight: 1,
    marginTop: -2,
  },

  attentionLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.inkSoft,
  },

  attentionCaption: {
    marginTop: 3,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },

  collectionCard: {
    minHeight: 122,
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  collectionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  collectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },

  collectionIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.green,
  },

  collectionCopy: {
    marginLeft: 12,
  },

  collectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: colors.subtle,
  },

  collectionValue: {
    marginTop: 3,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },

  collectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  collectionYearBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  collectionYearLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.subtle,
  },

  collectionYearValue: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.inkSoft,
  },

  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
  },

  shortcutCard: {
    width: '48.4%',
    minHeight: 128,
    padding: 15,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
    shadowColor: '#0F172A',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  shortcutIconText: {
    fontSize: 15,
    fontWeight: '900',
  },

  blueShortcutIcon: {
    backgroundColor: colors.blueSoft,
  },

  blueShortcutIconText: {
    color: colors.blue,
  },

  inkShortcutIcon: {
    backgroundColor: '#EEF0F4',
  },

  inkShortcutIconText: {
    color: colors.ink,
  },

  greenShortcutIcon: {
    backgroundColor: colors.greenSoft,
  },

  greenShortcutIconText: {
    color: colors.green,
  },

  violetShortcutIcon: {
    backgroundColor: colors.violetSoft,
  },

  violetShortcutIconText: {
    color: colors.violet,
  },

  shortcutTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.2,
  },

  shortcutSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },

  statusStrip: {
    marginTop: 22,
    padding: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF7F3',
    borderWidth: 1,
    borderColor: '#DCEFE6',
  },

  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },

  statusIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
  },

  statusCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  statusTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#245744',
  },

  statusText: {
    marginTop: 2,
    fontSize: 11,
    color: '#5E7D71',
    fontWeight: '500',
  },

  statusPercent: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.green,
  },

  pressedCard: {
    opacity: 0.82,
    transform: [{ scale: 0.992 }],
  },

  pressedStrong: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
