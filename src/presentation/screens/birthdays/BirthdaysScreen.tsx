import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { BirthdayMember } from '../../../application/birthdays/GetUpcomingBirthdays';
import { container } from '../../../di/container';

export function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBirthday, setSelectedBirthday] =
    useState<BirthdayMember | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const data = await container.useCases.getUpcomingBirthdays.execute(30);

      setBirthdays(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load birthdays.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const formatBirthday = (birthday: Date, daysUntil: number): string => {
    if (daysUntil === 0) {
      return 'Today';
    }

    if (daysUntil === 1) {
      return 'Tomorrow';
    }

    return birthday.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getFullName = (birthday: BirthdayMember): string => {
    return [birthday.member.firstName, birthday.member.lastName]
      .filter(Boolean)
      .join(' ');
  };

  const getInitial = (birthday: BirthdayMember): string => {
    return birthday.member.firstName.charAt(0).toUpperCase() || '?';
  };

  const getGymName = async (): Promise<string> => {
    try {
      const gym = await container.useCases.getGymProfile.execute();

      return gym?.name?.trim() || 'Our Gym';
    } catch {
      return 'Our Gym';
    }
  };

  const buildBirthdayMessage = (name: string, gymName: string): string => {
    return (
      `🎂 Happy Birthday ${name}! 🎉\n\n` +
      `${gymName} wishes you a very Happy Birthday! ` +
      `May your day be filled with happiness, good health ` +
      `and success. 💪\n\n` +
      `Thank you for being a valued member of ${gymName}. ` +
      `We look forward to seeing you stronger and fitter every day! 🏋️\n\n` +
      `Have a fantastic year ahead! 🎉`
    );
  };

  const normalizeIndianPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }

    if (digits.startsWith('0') && digits.length === 11) {
      return `91${digits.substring(1)}`;
    }

    return digits;
  };

  const sendBirthdayWhatsApp = async (birthday: BirthdayMember) => {
    try {
      const gymName = await getGymName();
      const name = getFullName(birthday);
      const phone = normalizeIndianPhone(birthday.member.phone);

      if (!phone) {
        Alert.alert(
          'Invalid phone number',
          'This member does not have a valid phone number.',
        );
        return;
      }

      const message = buildBirthdayMessage(name, gymName);

      const url =
        `whatsapp://send?phone=${phone}` +
        `&text=${encodeURIComponent(message)}`;

      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }

      const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        message,
      )}`;

      if (await Linking.canOpenURL(webUrl)) {
        await Linking.openURL(webUrl);
        return;
      }

      throw new Error(
        'WhatsApp is not installed and a browser is unavailable.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to open WhatsApp',
        error instanceof Error
          ? error.message
          : 'Could not open WhatsApp for this member.',
      );
    }
  };

  const callMember = async (phone: string) => {
    try {
      const cleanedPhone = phone.replace(/[^\d+]/g, '');

      if (!cleanedPhone) {
        Alert.alert(
          'Invalid phone number',
          'This member does not have a valid phone number.',
        );
        return;
      }

      const url = `tel:${cleanedPhone}`;

      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }

      await Linking.openURL(`tel:${cleanedPhone}`);
    } catch {
      Alert.alert('Unable to call', 'Could not open the phone application.');
    }
  };

  const sendBirthdaySms = async (birthday: BirthdayMember) => {
    try {
      const gymName = await getGymName();
      const name = getFullName(birthday);

      const phone = birthday.member.phone.replace(/[^+\d]/g, '');

      if (!phone) {
        Alert.alert(
          'Invalid phone number',
          'This member does not have a valid phone number.',
        );
        return;
      }

      const message = buildBirthdayMessage(name, gymName);

      const url = `sms:${phone}?body=${encodeURIComponent(message)}`;

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Unable to send SMS',
        error instanceof Error
          ? error.message
          : 'Could not open the SMS application.',
      );
    }
  };

  const openBirthdayActions = (birthday: BirthdayMember) => {
    setSelectedBirthday(birthday);
    setActionsVisible(true);
  };

  const closeBirthdayActions = () => {
    setActionsVisible(false);
    setSelectedBirthday(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>Loading birthdays...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Birthday reminders</Text>

          <Text style={styles.bannerText}>
            Upcoming birthdays for active members.
          </Text>
        </View>

        {birthdays.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No upcoming birthdays</Text>

            <Text style={styles.emptyText}>
              No active members have a birthday in the next 30 days.
            </Text>
          </View>
        ) : (
          birthdays.map(item => {
            const name = getFullName(item);

            const dateText = formatBirthday(item.birthday, item.daysUntil);

            const isToday = item.daysUntil === 0;

            return (
              <View
                style={[styles.card, isToday && styles.todayCard]}
                key={item.member.id}
              >
                <View style={[styles.avatar, isToday && styles.todayAvatar]}>
                  <Text style={styles.avatarText}>{getInitial(item)}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{name}</Text>

                  <Text style={styles.date}>
                    {dateText}
                    {' • '}
                    Turning {item.age}
                  </Text>

                  <Text style={styles.phone}>{item.member.phone}</Text>
                </View>

                <Pressable
                  style={styles.contactButton}
                  onPress={() => openBirthdayActions(item)}
                >
                  <Text style={styles.contactButtonText}>Contact</Text>
                </Pressable>
              </View>
            );
          })
        )}
        <Modal
          visible={actionsVisible}
          transparent
          animationType="fade"
          onRequestClose={closeBirthdayActions}
        >
          <Pressable style={styles.modalOverlay} onPress={closeBirthdayActions}>
            <Pressable
              style={styles.modalCard}
              onPress={event => event.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Birthday Wishes</Text>

              <Text style={styles.modalSubtitle}>
                {selectedBirthday
                  ? `Contact ${getFullName(selectedBirthday)}`
                  : ''}
              </Text>

              <Pressable
                style={styles.modalAction}
                onPress={async () => {
                  if (!selectedBirthday) {
                    return;
                  }

                  await callMember(selectedBirthday.member.phone);
                  closeBirthdayActions();
                }}
              >
                <Text style={styles.modalActionTitle}>Call</Text>
                <Text style={styles.modalActionDescription}>
                  Open phone dialer
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalAction}
                onPress={async () => {
                  if (!selectedBirthday) {
                    return;
                  }

                  await sendBirthdaySms(selectedBirthday);
                  closeBirthdayActions();
                }}
              >
                <Text style={styles.modalActionTitle}>SMS</Text>
                <Text style={styles.modalActionDescription}>
                  Open SMS with birthday wish
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalAction}
                onPress={async () => {
                  if (!selectedBirthday) {
                    return;
                  }

                  await sendBirthdayWhatsApp(selectedBirthday);
                  closeBirthdayActions();
                }}
              >
                <Text style={styles.modalActionTitle}>WhatsApp</Text>
                <Text style={styles.modalActionDescription}>
                  Open WhatsApp with birthday wish
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={closeBirthdayActions}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
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
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
  },

  bannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  bannerText: {
    marginTop: 5,
    color: '#6B7280',
    lineHeight: 19,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  todayCard: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayAvatar: {
    backgroundColor: '#FEF3C7',
  },

  avatarText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#111827',
  },

  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  name: {
    fontWeight: '800',
    color: '#111827',
  },

  date: {
    marginTop: 4,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },

  phone: {
    marginTop: 3,
    color: '#9CA3AF',
    fontSize: 12,
  },

  contactButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  contactButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    marginTop: 5,
    marginBottom: 14,
    fontSize: 14,
    color: '#6B7280',
  },

  modalAction: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  modalActionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  modalActionDescription: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  cancelButton: {
    marginTop: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 7,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
});
