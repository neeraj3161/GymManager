import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.group}>Gym</Text>
        <SettingRow title="Gym Profile" subtitle="Name, phone, address" onPress={() => Alert.alert('Gym Profile', 'Gym profile editor comes next.')} />
        <SettingRow title="Membership Plans" subtitle="Manage durations and prices" onPress={() => navigation.navigate('Plans')} />

        <Text style={styles.group}>Reminders</Text>
        <ToggleRow title="Birthday reminders" subtitle="Show upcoming birthdays" />
        <ToggleRow title="Fee reminders" subtitle="Remind about overdue fees" />

        <Text style={styles.group}>Data</Text>
        <SettingRow title="Backup & Restore" subtitle="Export or restore your database" onPress={() => navigation.navigate('Backup')} />

        <Text style={styles.group}>Application</Text>
        <SettingRow title="About Gym Manager" subtitle="Offline-first gym management" onPress={() => Alert.alert('Gym Manager', 'Local-first Android gym management app.')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function ToggleRow({title, subtitle}: {title: string; subtitle: string}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch value onValueChange={() => undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  title: {fontSize: 25, fontWeight: '800', color: '#111827'},
  group: {
    marginTop: 24,
    marginBottom: 9,
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowInfo: {flex: 1},
  rowTitle: {fontWeight: '800', color: '#111827'},
  rowSubtitle: {marginTop: 4, color: '#6B7280', fontSize: 12},
  chevron: {fontSize: 28, color: '#9CA3AF'},
});
