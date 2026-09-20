import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { Member } from '../../../domain/entities/Member';
import { container } from '../../../di/container';

type MemberFilter = 'all' | 'active' | 'disabled' | 'feesDue' | 'expiringSoon';

type MemberWithMembership = Member & {
  membershipEndDate?: string | null;
};
interface RouteParams {
  filter?: MemberFilter;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getMembershipDaysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;

  const dateString = endDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  if (
    expiry.getFullYear() !== year ||
    expiry.getMonth() !== month - 1 ||
    expiry.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((expiry.getTime() - today.getTime()) / DAY_IN_MS);
}

function toLocalDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const routeParams = route.params as RouteParams | undefined;

  const requestedFilter = routeParams?.filter ?? 'all';

  const [members, setMembers] = useState<MemberWithMembership[]>([]);

  const [query, setQuery] = useState('');

  const [filter, setFilter] = useState<MemberFilter>(requestedFilter);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [remindMember, setRemindMember] = useState<MemberWithMembership | null>(
    null,
  );

  /*
   * Keep the local filter synchronized with
   * navigation params.
   *
   * This is important when the user is already
   * on Members and taps Fees Due again.
   */
  React.useEffect(() => {
    setFilter(requestedFilter);
  }, [requestedFilter]);

  const loadMembers = useCallback(async () => {
    try {
      setError(null);

      if (filter === 'expiringSoon') {
        const allMembers = await container.repositories.member.getAll();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiryLimit = new Date(today);
        expiryLimit.setDate(expiryLimit.getDate() + 7);

        const expiryLimitKey = toLocalDateKey(expiryLimit);

        const expiringMembers: MemberWithMembership[] = [];

        for (const member of allMembers) {
          if (member.status !== 'active') continue;

          const membership =
            await container.repositories.membership.getByMemberId(member.id);

          if (!membership) continue;

          const endDate = String(membership.endDate ?? '').slice(0, 10);

          if (
            /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
            endDate <= expiryLimitKey
          ) {
            expiringMembers.push({
              ...member,
              membershipEndDate: membership.endDate ?? null,
            });
          }
        }

        setMembers(expiringMembers);
        return;
      }

      if (filter === 'feesDue') {
        const allMembers = await container.repositories.member.getAll();

        console.log('========== FEES DEBUG ==========');
        console.log('TOTAL MEMBERS:', allMembers.length);

        const feeDueMembers: MemberWithMembership[] = [];

        for (const member of allMembers) {
          console.log(
            'MEMBER:',
            member.firstName,
            member.id,
            'STATUS:',
            member.status,
          );

          if (member.status !== 'active') {
            console.log('SKIPPED: member disabled');
            continue;
          }

          const membership =
            await container.repositories.membership.getByMemberId(member.id);

          console.log('MEMBERSHIP:', membership);

          if (!membership) {
            console.log('SKIPPED: no membership');
            continue;
          }

          const feeStatus = await container.useCases.getMemberFeeStatus.execute(
            member.id,
          );

          console.log('FEE STATUS:', feeStatus);

          if (!feeStatus) {
            console.log('SKIPPED: fee status null');
            continue;
          }

          if (feeStatus.remainingAmount <= 0) {
            console.log('SKIPPED: fully paid', feeStatus.remainingAmount);
            continue;
          }

          console.log(
            'ADDING MEMBER - OUTSTANDING:',
            feeStatus.remainingAmount,
          );

          feeDueMembers.push({
            ...member,
            membershipEndDate: membership.endDate ?? null,
          });
        }

        console.log('FINAL FEES DUE MEMBERS:', feeDueMembers.length);
        console.log('================================');

        setMembers(feeDueMembers);
        return;
      }

      // All/active/disabled lists also retain membership expiry metadata
      // so expired memberships can display a red badge.
      const data = await container.repositories.member.getAll();

      const membersWithMembership: MemberWithMembership[] = await Promise.all(
        data.map(async member => {
          const membership =
            await container.repositories.membership.getByMemberId(member.id);

          return {
            ...member,
            membershipEndDate: membership?.endDate ?? null,
          };
        }),
      );

      setMembers(membersWithMembership);
    } catch (err) {
      console.error('Failed to load members:', err);

      setError(err instanceof Error ? err.message : 'Unable to load members.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);
  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
  };

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter(member => {
      // These filters are already applied inside loadMembers().
      // Do not filter them again by member.status.
      const matchesFilter =
        filter === 'all' ||
        filter === 'feesDue' ||
        filter === 'expiringSoon' ||
        member.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        member.firstName,
        member.lastName ?? '',
        member.phone,
        member.memberNumber,
        member.email ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [members, query, filter]);

  const activeCount = members.filter(
    member => member.status === 'active',
  ).length;

  const disabledCount = members.filter(
    member => member.status === 'disabled',
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to load members</Text>

          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.retryButton} onPress={loadMembers}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  const screenTitle =
    filter === 'feesDue'
      ? 'Fees Due'
      : filter === 'expiringSoon'
      ? 'Expiring Soon'
      : 'Members';

  const screenSubtitle =
    filter === 'feesDue'
      ? `${members.length} members with outstanding fees`
      : filter === 'expiringSoon'
      ? `${members.length} memberships expiring within 7 days`
      : `${members.length} total · ${activeCount} active`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{screenTitle}</Text>

          <Text style={styles.subtitle}>{screenSubtitle}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={
          filter === 'feesDue'
            ? 'Search fee-due members'
            : filter === 'expiringSoon'
            ? 'Search expiring members'
            : 'Search name, phone or member number'
        }
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      <View style={styles.filterRow}>
        <FilterButton
          label={`All ${filter === 'all' ? members.length : ''}`}
          selected={filter === 'all'}
          onPress={() => {
            setFilter('all');
            navigation.setParams({
              filter: 'all',
            });
          }}
        />

        <FilterButton
          label={`Active ${activeCount}`}
          selected={filter === 'active'}
          onPress={() => {
            setFilter('active');
            navigation.setParams({
              filter: 'active',
            });
          }}
        />

        <FilterButton
          label={`Disabled ${disabledCount}`}
          selected={filter === 'disabled'}
          onPress={() => {
            setFilter('disabled');
            navigation.setParams({
              filter: 'disabled',
            });
          }}
        />

        <FilterButton
          label="Fees Due"
          selected={filter === 'feesDue'}
          onPress={() => {
            setFilter('feesDue');
            navigation.setParams({
              filter: 'feesDue',
            });
          }}
        />
      </View>

      <Modal
        visible={!!remindMember}
        transparent
        animationType="fade"
        onRequestClose={() => setRemindMember(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRemindMember(null)}
        >
          <Pressable style={styles.remindModal} onPress={() => {}}>
            <Text style={styles.remindTitle}>Remind</Text>
            <Text style={styles.remindSubtitle}>
              {remindMember
                ? `${remindMember.firstName} ${
                    remindMember.lastName ?? ''
                  }`.trim()
                : ''}
            </Text>
            <Pressable
              style={styles.remindOption}
              onPress={() => {
                if (!remindMember?.phone?.trim()) {
                  Alert.alert('Phone number unavailable');
                  return;
                }
                const phone = remindMember.phone.replace(/[^+\d]/g, '');
                setRemindMember(null);
                Linking.openURL(`tel:${phone}`).catch(() =>
                  Alert.alert('Unable to open phone app'),
                );
              }}
            >
              <Text style={styles.remindOptionText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.remindOption}
              onPress={() =>
                remindMember &&
                sendMembershipReminder(remindMember, 'sms', () =>
                  setRemindMember(null),
                )
              }
            >
              <Text style={styles.remindOptionText}>SMS</Text>
            </Pressable>
            <Pressable
              style={styles.remindOption}
              onPress={() =>
                remindMember &&
                sendMembershipReminder(remindMember, 'whatsapp', () =>
                  setRemindMember(null),
                )
              }
            >
              <Text style={styles.remindOptionText}>WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.remindOption, styles.cancelOption]}
              onPress={() => setRemindMember(null)}
            >
              <Text style={[styles.remindOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={filteredMembers}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          filteredMembers.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            showFeeDue={filter === 'feesDue'}
            allowLongPress={filter === 'feesDue' || filter === 'expiringSoon'}
            onPress={() =>
              navigation.navigate('MemberDetails', {
                memberId: item.id,
              })
            }
            onLongPress={
              filter === 'feesDue' || filter === 'expiringSoon'
                ? () => setRemindMember(item)
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            hasSearch={query.trim().length > 0}
            filter={filter}
            onAddMember={() => navigation.navigate('AddMember')}
          />
        }
      />
    </SafeAreaView>
  );
}

interface FilterButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterButton({ label, selected, onPress }: FilterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterButton, selected && styles.filterButtonSelected]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface MemberCardProps {
  member: MemberWithMembership;
  showFeeDue: boolean;
  allowLongPress: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

function MemberCard({
  member,
  showFeeDue,
  allowLongPress,
  onPress,
  onLongPress,
}: MemberCardProps) {
  const fullName = `${member.firstName} ${member.lastName ?? ''}`.trim();

  const initials = getInitials(member);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={allowLongPress ? 450 : undefined}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {fullName}
        </Text>

        <Text style={styles.memberNumber}>#{member.memberNumber}</Text>

        <Text style={styles.phone}>{member.phone}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.badgeColumn}>
          {showFeeDue ? (
            <View style={[styles.statusBadge, styles.feeDueBadge]}>
              <Text style={[styles.statusText, styles.feeDueText]}>
                Fee Due
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                member.status === 'active'
                  ? styles.activeBadge
                  : styles.disabledBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {member.status === 'active' ? 'Active' : 'Disabled'}
              </Text>
            </View>
          )}

          <MembershipExpiryBadge endDate={member.membershipEndDate} />
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function MembershipExpiryBadge({ endDate }: { endDate?: string | null }) {
  const daysRemaining = getMembershipDaysRemaining(endDate);

  if (daysRemaining === null || daysRemaining > 7) return null;

  if (daysRemaining < 0) {
    return (
      <View style={[styles.statusBadge, styles.expiredBadge]}>
        <Text style={[styles.statusText, styles.expiredText]}>
          {`Expired ${Math.abs(daysRemaining)}d`}
        </Text>
      </View>
    );
  }

  if (daysRemaining === 0) {
    return (
      <View style={[styles.statusBadge, styles.expiringBadge]}>
        <Text style={[styles.statusText, styles.expiringText]}>
          Expires today
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusBadge, styles.expiringBadge]}>
      <Text style={[styles.statusText, styles.expiringText]}>
        {`${daysRemaining}d left`}
      </Text>
    </View>
  );
}

function buildMembershipReminder(
  member: MemberWithMembership,
  gymName: string,
  gymPhone: string,
  remainingAmount: number,
): string {
  const name = member.firstName?.trim() || 'Member';
  const days = getMembershipDaysRemaining(member.membershipEndDate);
  const expiryDate = member.membershipEndDate?.slice(0, 10);

  let status = 'your membership is due for renewal';
  if (days !== null && days < 0) {
    status = `your membership expired ${Math.abs(days)} day(s) ago`;
  } else if (days === 0) {
    status = 'your membership expires today';
  } else if (days !== null) {
    status = `your membership expires in ${days} day(s)`;
  }

  const gym = gymName.trim() || 'the gym';
  const contact = gymPhone.trim()
    ? `\nFor assistance or payment confirmation, contact ${gym} at ${gymPhone.trim()}.`
    : '';

  const expiry = expiryDate ? ` (expiry date: ${expiryDate})` : '';

  if (days !== null && days < 0 && remainingAmount <= 0) {
    return `Hi ${name}, this is a reminder from ${gym}. Your membership ${status}${expiry}. Please renew your membership to continue. Thank you.${contact}`;
  }

  const dueMessage =
    remainingAmount > 0
      ? ` and pay the outstanding amount of ₹${remainingAmount.toLocaleString(
          'en-IN',
        )}`
      : '';

  return `Hi ${name}, this is a reminder from ${gym}. Your membership ${status}${expiry}. Please renew your plan${dueMessage} as soon as possible. Thank you.${contact}`;
}

async function sendMembershipReminder(
  member: MemberWithMembership,
  channel: 'sms' | 'whatsapp',
  onOpened: () => void,
) {
  if (!member.phone?.trim()) {
    Alert.alert(
      'Phone number unavailable',
      'This member has no phone number saved.',
    );
    return;
  }

  let gymName = '';
  let gymPhone = '';
  let remainingAmount = 0;
  try {
    const [gym, feeStatus] = await Promise.all([
      container.useCases.getGymProfile.execute(),
      container.useCases.getMemberFeeStatus.execute(member.id),
    ]);
    gymName = gym?.name ?? '';
    gymPhone = gym?.phone ?? '';
    remainingAmount = feeStatus?.remainingAmount ?? 0;
  } catch (error) {
    console.warn('Could not load gym profile for reminder:', error);
  }

  const message = buildMembershipReminder(
    member,
    gymName,
    gymPhone,
    remainingAmount,
  );
  const phone = member.phone.replace(/[^\d]/g, '');
  const whatsappPhone = phone.length === 10 ? `91${phone}` : phone;
  const url =
    channel === 'sms'
      ? `sms:${member.phone.replace(/[^+\d]/g, '')}?body=${encodeURIComponent(
          message,
        )}`
      : `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
    onOpened();
  } catch {
    Alert.alert(
      channel === 'sms' ? 'Unable to open SMS' : 'Unable to open WhatsApp',
      'Check that a compatible app is installed and the phone number is correct.',
    );
  }
}

interface EmptyStateProps {
  hasSearch: boolean;
  filter: MemberFilter;
  onAddMember: () => void;
}

function EmptyState({ hasSearch, filter, onAddMember }: EmptyStateProps) {
  let message = 'No members yet.';

  if (hasSearch) {
    message = 'No members match your search.';
  } else if (filter === 'active') {
    message = 'No active members.';
  } else if (filter === 'disabled') {
    message = 'No disabled members.';
  } else if (filter === 'feesDue') {
    message = 'No members have fees due.';
  } else if (filter === 'expiringSoon') {
    message = 'No memberships expiring soon.';
  }

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{message}</Text>

      {filter === 'feesDue' && !hasSearch && (
        <Text style={styles.emptyText}>
          All active member fees are currently paid.
        </Text>
      )}

      {!hasSearch && filter === 'all' && (
        <>
          <Text style={styles.emptyText}>
            Add your first member to get started.
          </Text>

          <Pressable style={styles.emptyButton} onPress={onAddMember}>
            <Text style={styles.emptyButtonText}>Add Member</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function getInitials(member: Member): string {
  const first = member.firstName?.charAt(0).toUpperCase() ?? '';

  const last = member.lastName?.charAt(0).toUpperCase() ?? '';

  return `${first}${last}` || '?';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerInfo: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  search: {
    height: 48,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 14,
  },

  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 4,
    flexDirection: 'row',
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },

  filterButtonSelected: {
    backgroundColor: '#111827',
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },

  filterTextSelected: {
    color: '#FFFFFF',
  },

  list: {
    padding: 16,
    paddingTop: 10,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    minHeight: 78,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.7,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },

  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  memberNumber: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  phone: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 48,
  },

  badgeColumn: {
    alignItems: 'flex-end',
    gap: 5,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  activeBadge: {
    backgroundColor: '#DCFCE7',
  },

  disabledBadge: {
    backgroundColor: '#F3F4F6',
  },

  feeDueBadge: {
    backgroundColor: '#FEF3C7',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  feeDueText: {
    color: '#92400E',
  },

  expiringBadge: {
    backgroundColor: '#FEF3C7',
  },

  expiringText: {
    color: '#92400E',
  },

  expiredBadge: {
    backgroundColor: '#FEE2E2',
  },

  expiredText: {
    color: '#B91C1C',
  },

  chevron: {
    marginTop: 5,
    fontSize: 22,
    lineHeight: 22,
    color: '#9CA3AF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  remindModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  remindTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  remindSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  remindOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 7,
    backgroundColor: '#F3F4F6',
  },
  remindOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  cancelOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: { color: '#6B7280' },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
