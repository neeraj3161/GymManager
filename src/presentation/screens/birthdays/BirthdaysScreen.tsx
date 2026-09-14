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
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { BirthdayMember } from '../../../application/birthdays/GetUpcomingBirthdays';
import { container } from '../../../di/container';

export function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
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

  const sendBirthdayWhatsApp = async (birthday: BirthdayMember) => {
    const name = getFullName(birthday);

    const gymName = 'Your Gym Name';

    const message =
      `🎂 Happy Birthday ${name}! 🎉\n\n` +
      `${gymName} wishes you a very Happy Birthday! ` +
      `May your day be filled with happiness, good health ` +
      `and success. 💪\n\n` +
      `Thank you for being a valued member of ${gymName}. ` +
      `We look forward to seeing you stronger and fitter every day! 🏋️\n\n` +
      `Have a fantastic year ahead! 🎉`;

    const phone = birthday.member.phone.replace(/\D/g, '');

    // India numbers: convert 10-digit number to +91 format.
    const internationalPhone = phone.length === 10 ? `91${phone}` : phone;

    const url =
      `whatsapp://send?phone=${internationalPhone}` +
      `&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'WhatsApp unavailable',
          'WhatsApp is not installed or cannot be opened on this device.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open WhatsApp',
        'Could not open WhatsApp for this member.',
      );
    }
  };

  const getFullName = (birthday: BirthdayMember) => {
    return [birthday.member.firstName, birthday.member.lastName]
      .filter(Boolean)
      .join(' ');
  };

  const getInitial = (birthday: BirthdayMember) => {
    return birthday.member.firstName.charAt(0).toUpperCase();
  };

  const callMember = async (phone: string) => {
    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to call',
          'Calling is not available on this device.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to call', 'Could not open the phone application.');
    }
  };

  const sendBirthdaySms = async (birthday: BirthdayMember) => {
    const gym = await container.useCases.getGymProfile.execute();
    const gymName = gym?.name ?? 'Our Gym';
    const name = getFullName(birthday);

    const message =
      `🎂 Happy Birthday ${name}! 🎉\n\n` +
      `${gymName} wishes you a very Happy Birthday! ` +
      `May your day be filled with happiness, good health ` +
      `and success. 💪\n\n` +
      `Thank you for being a valued member of ${gymName}. ` +
      `We look forward to seeing you stronger and fitter every day! 🏋️\n\n` +
      `Have a fantastic year ahead! 🎉`;

    const url =
      `sms:${birthday.member.phone}` + `?body=${encodeURIComponent(message)}`;

    try {

    const url =
      `sms:${birthday.member.phone}` + `?body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to send SMS',
          'SMS is not available on this device.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to send SMS', 'Could not open the SMS application.');
    }
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

                <View style={styles.actions}>
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.callButton}
                      onPress={() => callMember(item.member.phone)}
                    >
                      <Text style={styles.callText}>Call</Text>
                    </Pressable>

                    <Pressable
                      style={styles.sms}
                      onPress={() => sendBirthdaySms(item)}
                    >
                      <Text style={styles.smsText}>SMS</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.whatsapp}
                    onPress={() => sendBirthdayWhatsApp(item)}
                  >
                    <Text style={styles.whatsappIcon}>WA</Text>

                    <Text style={styles.whatsappText}>WhatsApp Wish</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
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

  actions: {
    alignItems: 'flex-end',
    gap: 7,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  whatsappIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#25D366',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: 5,
  },

  whatsappText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  callButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  callText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },

  sms: {
    backgroundColor: '#111827',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  smsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
