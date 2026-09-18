import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
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
import DateTimePicker from '@react-native-community/datetimepicker';

import { Member } from '../../../domain/entities/Member';
import { Membership } from '../../../domain/entities/Membership';
import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { Payment } from '../../../domain/entities/Payment';
import { MemberFeeStatus } from '../../../application/payments/GetMemberFeeStatus';
import { UpdateMemberUseCase } from '../../../application/members/UpdateMember';
import { container } from '../../../di/container';

export function MemberDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const memberId = route.params?.memberId as string;

  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [feeStatus, setFeeStatus] = useState<MemberFeeStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGender, setEditGender] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);

      const [memberData, membershipData, feeStatusData, paymentData] =
        await Promise.all([
          container.useCases.getMemberDetails.execute(memberId),
          container.repositories.membership.getByMemberId(memberId),
          container.useCases.getMemberFeeStatus.execute(memberId),
          container.useCases.getPaymentHistory.execute(memberId),
        ]);

      setMember(memberData);
      setMembership(membershipData);
      setFeeStatus(feeStatusData);
      setPayments(paymentData);

      if (membershipData) {
        const planData = await container.repositories.plan.getById(
          membershipData.planId,
        );

        setPlan(planData);
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error('Failed to load member details:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to load member details.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const startEditing = () => {
    if (!member) {
      return;
    }

    setEditFirstName(member.firstName);
    setEditLastName(member.lastName ?? '');
    setEditPhone(member.phone);
    setEditEmail(member.email ?? '');
    setEditDateOfBirth(member.dateOfBirth ?? '');
    setEditAddress(member.address ?? '');
    setEditGender(member.gender ?? '');
    setEditing(true);
  };

  const cancelEditing = () => {
    if (saving) {
      return;
    }

    setShowDobPicker(false);
    setEditing(false);
  };

  const parseDateInput = (value: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      return null;
    }

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );

    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) {
      return null;
    }

    return date;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const saveMember = async () => {
    if (!member) {
      return;
    }

    const firstName = editFirstName.trim();
    const lastName = editLastName.trim();
    const phone = editPhone.trim();
    const email = editEmail.trim();
    const address = editAddress.trim();
    const gender = editGender.trim();

    if (!firstName) {
      Alert.alert('Validation', 'First name is required.');
      return;
    }

    if (!phone) {
      Alert.alert('Validation', 'Phone number is required.');
      return;
    }

    let dateOfBirth: string | undefined;

    if (editDateOfBirth.trim()) {
      const dob = parseDateInput(editDateOfBirth.trim());

      if (!dob) {
        Alert.alert(
          'Invalid date',
          'Date of birth must be a valid date in YYYY-MM-DD format.',
        );
        return;
      }

      if (dob > new Date()) {
        Alert.alert('Invalid date', 'Date of birth cannot be in the future.');
        return;
      }

      dateOfBirth = editDateOfBirth.trim();
    }

    try {
      setSaving(true);

      const useCase = new UpdateMemberUseCase(container.repositories.member);

      await useCase.execute({
        id: member.id,
        memberNumber: member.memberNumber,
        firstName,
        lastName: lastName || undefined,
        phone,
        email: email || undefined,
        dateOfBirth,
        address: address || undefined,
        gender: gender || undefined,
        photoUri: member.photoUri,
        status: member.status,
        createdAt: member.createdAt,
        updatedAt: new Date().toISOString(),
      });

      setEditing(false);
      setShowDobPicker(false);
      await load();

      Alert.alert('Saved', 'Member details have been updated.');
    } catch (err) {
      Alert.alert(
        'Unable to update member',
        err instanceof Error
          ? err.message
          : 'Something went wrong while updating the member.',
      );
    } finally {
      setSaving(false);
    }
  };

  const disable = () => {
    Alert.alert(
      'Disable member',
      'The member will remain in the database but will no longer be active.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await container.useCases.disableMember.execute(memberId);
              await load();
            } catch (err) {
              Alert.alert(
                'Unable to disable',
                err instanceof Error ? err.message : 'Something went wrong.',
              );
            }
          },
        },
      ],
    );
  };

  const enable = async () => {
    try {
      await container.useCases.enableMember.execute(memberId);
      await load();
    } catch (err) {
      Alert.alert(
        'Unable to enable',
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    }
  };

  const callMember = async () => {
    if (!member) {
      return;
    }

    const phoneNumber = member.phone.replace(/[^\d+]/g, '');
    const url = `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Unable to call',
          'The phone dialer is not available on this device.',
        );
      }
    } catch {
      Alert.alert('Unable to call', 'Could not open the phone dialer.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading member...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to load member</Text>

          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Member not found</Text>

          <Text style={styles.emptyText}>
            This member may have been removed or is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberName = `${member.firstName} ${member.lastName ?? ''}`.trim();

  const totalPaid = feeStatus?.totalPaid ?? 0;
  const remainingAmount = feeStatus?.remainingAmount ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {/* PROFILE */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(member)}</Text>
          </View>

          {editing ? (
            <>
              <TextInputField
                label="First name *"
                value={editFirstName}
                onChangeText={setEditFirstName}
              />

              <TextInputField
                label="Last name"
                value={editLastName}
                onChangeText={setEditLastName}
              />

              <TextInputField
                label="Phone *"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <TextInputField
                label="Email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                style={styles.dateField}
                onPress={() => setShowDobPicker(true)}
              >
                <Text style={styles.fieldLabel}>Date of birth</Text>
                <Text
                  style={[
                    styles.dateFieldText,
                    !editDateOfBirth && styles.placeholderText,
                  ]}
                >
                  {editDateOfBirth || 'Select date of birth'}
                </Text>
              </Pressable>

              {showDobPicker ? (
                <DateTimePicker
                  value={
                    parseDateInput(editDateOfBirth) ?? new Date(1995, 0, 1)
                  }
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (event.type === 'dismissed') {
                      setShowDobPicker(false);
                      return;
                    }

                    if (selectedDate) {
                      setEditDateOfBirth(formatDateForInput(selectedDate));
                    }

                    setShowDobPicker(false);
                  }}
                />
              ) : null}

              <TextInputField
                label="Gender"
                value={editGender}
                onChangeText={setEditGender}
              />

              <TextInputField
                label="Address"
                value={editAddress}
                onChangeText={setEditAddress}
                multiline
              />
            </>
          ) : (
            <>
              <Text style={styles.name}>{memberName}</Text>

              <Pressable style={styles.phoneRow} onPress={callMember}>
                <Text style={styles.phone}>{member.phone}</Text>
                <Text style={styles.callIcon}>☎</Text>
              </Pressable>

              <Text style={styles.memberNumber}>{member.memberNumber}</Text>

              <View
                style={[
                  styles.memberStatus,
                  member.status === 'active'
                    ? styles.activeStatus
                    : styles.disabledStatus,
                ]}
              >
                <Text style={styles.memberStatusText}>
                  {member.status === 'active' ? 'ACTIVE' : 'DISABLED'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* MEMBERSHIP */}

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
            label="Plan amount"
            value={membership ? formatCurrency(membership.amount) : '-'}
          />

          <Row
            label="Membership status"
            value={membership?.status ? membership.status.toUpperCase() : '-'}
            last
          />
        </Section>

        {/* FEE STATUS */}

        <Section title="Fee Status">
          <View style={styles.feeHeader}>
            <Text style={styles.feeTitle}>
              {remainingAmount === 0
                ? 'Fully Paid'
                : formatCurrency(remainingAmount)}
            </Text>

            <View
              style={[styles.feeBadge, getFeeStatusStyle(feeStatus?.status)]}
            >
              <Text style={styles.feeBadgeText}>
                {feeStatus?.status ?? '-'}
              </Text>
            </View>
          </View>

          <Row
            label="Membership amount"
            value={feeStatus ? formatCurrency(feeStatus.membershipAmount) : '-'}
          />

          <Row
            label="Adjustments"
            value={feeStatus ? formatCurrency(feeStatus.adjustmentAmount) : '-'}
          />

          <Row label="Total paid" value={formatCurrency(totalPaid)} />

          <Row label="Remaining" value={formatCurrency(remainingAmount)} last />
        </Section>

        {/* PAYMENTS */}

        <Section title={`Payment History (${payments.length})`}>
          {payments.length === 0 ? (
            <View style={styles.noPayments}>
              <Text style={styles.noPaymentsText}>
                No payments recorded yet.
              </Text>
            </View>
          ) : (
            payments.map((payment, index) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                last={index === payments.length - 1}
              />
            ))
          )}
        </Section>

        {/* CONTACT */}

        {!editing ? (
          <Section title="Contact">
            <Row label="Phone" value={member.phone} />

            <Row label="Email" value={member.email ?? '-'} />

            <Row
              label="Date of birth"
              value={member.dateOfBirth ? formatDate(member.dateOfBirth) : '-'}
              last
            />
          </Section>
        ) : null}

        {/* ACTIONS */}

        <View style={styles.actions}>
          {editing ? (
            <>
              <Pressable
                style={styles.primaryButton}
                onPress={saveMember}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={cancelEditing}
                disabled={saving}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.primaryButton} onPress={startEditing}>
              <Text style={styles.primaryButtonText}>Edit Member</Text>
            </Pressable>
          )}

          {!editing &&
            (member.status === 'active' ? (
              <Pressable style={styles.dangerButton} onPress={disable}>
                <Text style={styles.dangerButtonText}>Disable Member</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={enable}>
                <Text style={styles.primaryButtonText}>Enable Member</Text>
              </Pressable>
            ))}

          <Pressable
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('Payments', {
                memberId: member.id,
                memberName,
              })
            }
          >
            <Text style={styles.actionButtonText}>Payments</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('RenewMembership', {
                memberId: member.id,
                memberName,
              })
            }
          >
            <Text style={styles.actionButtonText}>Renew Membership</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('ChangeMembershipPlan', {
                memberId: member.id,
                memberName,
              })
            }
          >
            <Text style={styles.actionButtonText}>Change Plan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TextInputField({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function PaymentRow({ payment, last }: { payment: Payment; last: boolean }) {
  return (
    <View style={[styles.paymentRow, last && styles.lastRow]}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentAmount}>
          {formatCurrency(payment.amount)}
        </Text>

        <Text style={styles.paymentDate}>
          {formatDate(payment.paymentDate)}
        </Text>
      </View>

      <View style={styles.paymentRight}>
        <Text style={styles.paymentMethod}>
          {payment.paymentMethod.toUpperCase()}
        </Text>

        {payment.notes ? (
          <Text style={styles.paymentNotes} numberOfLines={1}>
            {payment.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>

      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function getInitials(member: Member) {
  const first = member.firstName?.charAt(0) ?? '';
  const last = member.lastName?.charAt(0) ?? '';

  return `${first}${last}`.toUpperCase();
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getFeeStatusStyle(status?: MemberFeeStatus['status']) {
  switch (status) {
    case 'PAID':
      return styles.paidBadge;

    case 'PARTIAL':
      return styles.partialBadge;

    case 'DUE':
      return styles.dueBadge;

    case 'OVERDUE':
      return styles.overdueBadge;

    default:
      return styles.neutralBadge;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    padding: 16,
    paddingBottom: 40,
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
  },

  errorText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    padding: 22,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#374151',
  },

  name: {
    marginTop: 12,
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },

  phoneRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  phone: {
    color: '#4B5563',
  },

  callIcon: {
    fontSize: 19,
    color: '#111827',
  },

  memberNumber: {
    marginTop: 5,
    fontSize: 12,
    color: '#9CA3AF',
  },

  memberStatus: {
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  activeStatus: {
    backgroundColor: '#DCFCE7',
  },

  disabledStatus: {
    backgroundColor: '#F3F4F6',
  },

  memberStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rowLabel: {
    color: '#6B7280',
  },

  rowValue: {
    maxWidth: '58%',
    textAlign: 'right',
    fontWeight: '700',
    color: '#111827',
  },

  feeHeader: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  feeTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#111827',
  },

  feeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  feeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  paidBadge: {
    backgroundColor: '#DCFCE7',
  },

  partialBadge: {
    backgroundColor: '#FEF3C7',
  },

  dueBadge: {
    backgroundColor: '#FDE68A',
  },

  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },

  neutralBadge: {
    backgroundColor: '#F3F4F6',
  },

  inputGroup: {
    width: '100%',
    marginTop: 12,
  },

  fieldLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 15,
  },

  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },

  dateField: {
    width: '100%',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },

  dateFieldText: {
    color: '#111827',
    fontSize: 15,
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  paymentRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  paymentInfo: {
    flex: 1,
  },

  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  paymentDate: {
    marginTop: 3,
    fontSize: 12,
    color: '#9CA3AF',
  },

  paymentRight: {
    alignItems: 'flex-end',
    maxWidth: '45%',
  },

  paymentMethod: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  paymentNotes: {
    marginTop: 3,
    fontSize: 11,
    color: '#9CA3AF',
  },

  noPayments: {
    paddingVertical: 22,
  },

  noPaymentsText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },

  actions: {
    marginTop: 24,
    gap: 10,
  },

  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  dangerButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerButtonText: {
    color: '#B91C1C',
    fontWeight: '800',
  },

  actionButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonText: {
    color: '#111827',
    fontWeight: '800',
  },
});
