import React, {useCallback, useState} from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';

import {Member} from '../../../domain/entities/Member';
import {Membership} from '../../../domain/entities/Membership';
import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';
import {MemberFeeStatus} from '../../../application/payments/GetMemberFeeStatus';

export function MemberDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const memberId = route.params?.memberId as string;

  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [feeStatus, setFeeStatus] = useState<MemberFeeStatus | null>(null);

  const load = useCallback(async () => {
  const memberData =
    await container.useCases.getMemberDetails.execute(memberId);

  const membershipData =
    await container.repositories.membership.getByMemberId(memberId);

  const feeStatusData =
    await container.useCases.getMemberFeeStatus.execute(memberId);

  setMember(memberData);
  setMembership(membershipData);
  setFeeStatus(feeStatusData);

  if (membershipData) {
    setPlan(
      await container.repositories.plan.getById(
        membershipData.planId,
      ),
    );
  }
}, [memberId]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const disable = () => {
    Alert.alert(
      'Disable member',
      'The member will remain in the database but will no longer be active.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await container.useCases.disableMember.execute(memberId);
            await load();
          },
        },
      ],
    );
  };

  const enable = async () => {
    await container.useCases.enableMember.execute(memberId);
    await load();
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Member not found.</Text>
      </SafeAreaView>
    );
  }

  const callMember = async () => {
  const phoneNumber = member.phone.replace(/[^\d+]/g, '');

  const url = `tel:${phoneNumber}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      'Unable to call',
      'The phone dialer is not available on this device.',
    );
  }
};

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.firstName.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>
            {member.firstName} {member.lastName ?? ''}
          </Text>
<Pressable
  style={styles.phoneRow}
  onPress={callMember}>
  <Text style={styles.phone}>{member.phone}</Text>
  <Text style={styles.callIcon}>☎</Text>
</Pressable>          <Text style={styles.memberNumber}>{member.memberNumber}</Text>

          <View
            style={[
              styles.badge,
              member.status === 'active' ? styles.activeBadge : styles.disabledBadge,
            ]}>
            <Text style={styles.badgeText}>
              {member.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Section title="Membership">
          <Row label="Plan" value={plan?.name ?? 'No plan'} />
          <Row
            label="Start date"
            value={membership ? formatDate(membership.startDate) : '-'}
          />
          <Row
            label="Expiry date"
            value={membership ? formatDate(membership.endDate) : '-'}
          />
          <Row
            label="Amount"
            value={membership ? `₹${membership.amount.toLocaleString('en-IN')}` : '-'}
          />
        </Section>

        <Section title="Fee Status">
  <Row
    label="Membership amount"
    value={
      feeStatus
        ? `₹${feeStatus.membershipAmount.toLocaleString('en-IN')}`
        : '-'
    }
  />

  <Row
    label="Total paid"
    value={
      feeStatus
        ? `₹${feeStatus.totalPaid.toLocaleString('en-IN')}`
        : '-'
    }
  />

  <Row
    label="Remaining"
    value={
      feeStatus
        ? `₹${feeStatus.remainingAmount.toLocaleString('en-IN')}`
        : '-'
    }
  />

  <Row
    label="Status"
    value={feeStatus?.status ?? '-'}
  />
</Section>

        <Section title="Contact">
          <Row label="Phone" value={member.phone} />
          <Row label="Email" value={member.email ?? '-'} />
          <Row label="Date of birth" value={member.dateOfBirth ?? '-'} />
        </Section>

        <View style={styles.actions}>
          {member.status === 'active' ? (
            <Pressable style={styles.secondaryDanger} onPress={disable}>
              <Text style={styles.dangerText}>Disable Member</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primary} onPress={enable}>
              <Text style={styles.primaryText}>Enable Member</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.secondary}
            onPress={() => navigation.navigate('Payments', {
  memberId: member.id,
  memberName: `${member.firstName} ${member.lastName ?? ''}`.trim(),
})}>
            <Text style={styles.secondaryText}>Payments</Text>
          </Pressable>
          <Pressable
  style={styles.secondary}
  onPress={() =>
    navigation.navigate('RenewMembership', {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName ?? ''}`.trim(),
    })
  }>
  <Text style={styles.secondaryText}>Renew Membership</Text>
</Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
  memberNumber: {marginTop: 4, color: '#9CA3AF', fontSize: 12},
  badge: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadge: {backgroundColor: '#DCFCE7'},
  disabledBadge: {backgroundColor: '#F3F4F6'},
  badgeText: {fontSize: 11, fontWeight: '800', color: '#374151'},
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
  secondaryText: {color: '#111827', fontWeight: '800'},
  secondaryDanger: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {color: '#B91C1C', fontWeight: '800'},
  empty: {padding: 20},
  phoneRow: {
  marginTop: 6,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},

callIcon: {
  fontSize: 20,
  color: '#111827',
},
});
