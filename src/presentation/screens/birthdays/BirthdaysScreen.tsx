import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const birthdays = [
  {name: 'Sneha Kulkarni', date: 'Today', age: 28, phone: '9765432109'},
  {name: 'Rahul Sharma', date: 'Tomorrow', age: 29, phone: '9876543210'},
  {name: 'Priya Joshi', date: '18 Sep', age: 26, phone: '9812345678'},
];

export function BirthdaysScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Birthday reminders</Text>
        <Text style={styles.bannerText}>
          Send birthday wishes by SMS when the reminder is due.
        </Text>
      </View>

      {birthdays.map(item => (
        <View style={styles.card} key={item.name}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.date} • Turning {item.age}</Text>
          </View>
          <Pressable
            style={styles.sms}
            onPress={() =>
              Alert.alert('Birthday SMS', `Send birthday wish to ${item.name}?`)
            }>
            <Text style={styles.smsText}>SMS</Text>
          </Pressable>
        </View>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9', padding: 16},
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
  },
  bannerTitle: {fontSize: 19, fontWeight: '800', color: '#111827'},
  bannerText: {marginTop: 5, color: '#6B7280', lineHeight: 19},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontWeight: '800', fontSize: 18},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', color: '#111827'},
  date: {marginTop: 4, color: '#6B7280', fontSize: 12},
  sms: {backgroundColor: '#111827', borderRadius: 10, padding: 9},
  smsText: {color: '#FFFFFF', fontWeight: '800', fontSize: 12},
});
