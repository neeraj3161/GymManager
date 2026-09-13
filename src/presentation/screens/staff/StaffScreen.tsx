import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const staff = [
  {name: 'Gym Owner', role: 'Owner', status: 'Active'},
  {name: 'Manager', role: 'Manager', status: 'Active'},
  {name: 'Reception', role: 'Receptionist', status: 'Active'},
];

export function StaffScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Staff & Users</Text>
            <Text style={styles.subtitle}>Manage access and permissions.</Text>
          </View>
          <Pressable
            style={styles.add}
            onPress={() => Alert.alert('Add user', 'User creation will be connected to authentication next.')}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {staff.map(person => (
          <View style={styles.card} key={person.name}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{person.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.role}>{person.role}</Text>
            </View>
            <View style={styles.active}>
              <Text style={styles.activeText}>{person.status}</Text>
            </View>
          </View>
        ))}

        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Roles</Text>
          <Text style={styles.permissionText}>
            Owner, Manager, Receptionist and Trainer roles will control
            permissions such as members, payments, plans, staff and backups.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  container: {padding: 16},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 23, fontWeight: '800', color: '#111827'},
  subtitle: {marginTop: 4, color: '#6B7280'},
  add: {backgroundColor: '#111827', borderRadius: 11, padding: 10},
  addText: {color: '#FFFFFF', fontWeight: '800'},
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
  role: {marginTop: 4, color: '#6B7280'},
  active: {backgroundColor: '#DCFCE7', borderRadius: 9, padding: 7},
  activeText: {color: '#166534', fontSize: 11, fontWeight: '800'},
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginTop: 10,
  },
  permissionTitle: {fontWeight: '800', fontSize: 17, color: '#111827'},
  permissionText: {marginTop: 8, color: '#6B7280', lineHeight: 20},
});
