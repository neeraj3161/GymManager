import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
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

type MemberFilter = 'all' | 'active' | 'disabled' | 'feesDue';

interface RouteParams {
  filter?: MemberFilter;
}

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const routeParams = route.params as RouteParams | undefined;

  const requestedFilter = routeParams?.filter ?? 'all';

  const [members, setMembers] = useState<Member[]>([]);

  const [query, setQuery] = useState('');

  const [filter, setFilter] = useState<MemberFilter>(requestedFilter);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

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

      if (filter === 'feesDue') {
        const allMembers = await container.repositories.member.getAll();

        console.log('========== FEES DEBUG ==========');
        console.log('TOTAL MEMBERS:', allMembers.length);

        const feeDueMembers: Member[] = [];

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

          feeDueMembers.push(member);
        }

        console.log('FINAL FEES DUE MEMBERS:', feeDueMembers.length);

        console.log('================================');

        setMembers(feeDueMembers);

        return;
      } else {
        const data = await container.repositories.member.getAll();

        setMembers(data);
      }
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
      /*
       * feesDue has already been filtered by
       * GetMembersWithFeesDueUseCase.
       */
      const matchesFilter =
        filter === 'all' || filter === 'feesDue' || member.status === filter;

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

  const screenTitle = filter === 'feesDue' ? 'Fees Due' : 'Members';

  const screenSubtitle =
    filter === 'feesDue'
      ? `${members.length} members with outstanding fees`
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
            onPress={() =>
              navigation.navigate('MemberDetails', {
                memberId: item.id,
              })
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
  member: Member;
  showFeeDue: boolean;
  onPress: () => void;
}

function MemberCard({ member, showFeeDue, onPress }: MemberCardProps) {
  const fullName = `${member.firstName} ${member.lastName ?? ''}`.trim();

  const initials = getInitials(member);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
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
        {showFeeDue ? (
          <View style={[styles.statusBadge, styles.feeDueBadge]}>
            <Text style={[styles.statusText, styles.feeDueText]}>Fee Due</Text>
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

        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
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

  chevron: {
    marginTop: 5,
    fontSize: 22,
    lineHeight: 22,
    color: '#9CA3AF',
  },

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
