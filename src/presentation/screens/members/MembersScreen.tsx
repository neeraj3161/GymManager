import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const demoMembers = [
  {id: '1', name: 'Rahul Sharma', phone: '9876543210', plan: '3 Months', status: 'Active'},
  {id: '2', name: 'Amit Patil', phone: '9822334455', plan: '1 Month', status: 'Due'},
  {id: '3', name: 'Sneha Kulkarni', phone: '9765432109', plan: '1 Year', status: 'Active'},
  {id: '4', name: 'Rohan Deshmukh', phone: '9898989898', plan: '6 Months', status: 'Expired'},
];

export function MembersScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      demoMembers.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>{demoMembers.length} members</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search members"
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('MemberDetails', {memberId: item.id})
            }>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.plan}>{item.plan}</Text>
            </View>

            <View
              style={[
                styles.status,
                item.status === 'Active'
                  ? styles.active
                  : item.status === 'Due'
                    ? styles.due
                    : styles.expired,
              ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No members found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7F9'},
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {fontSize: 16, fontWeight: '700', color: '#374151'},
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {color: '#FFFFFF', fontWeight: '800'},
  search: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  list: {padding: 16, paddingTop: 4},
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
  avatarText: {fontSize: 18, fontWeight: '800', color: '#374151'},
  info: {flex: 1, marginLeft: 12},
  name: {fontWeight: '800', fontSize: 16, color: '#111827'},
  phone: {marginTop: 3, color: '#6B7280', fontSize: 12},
  plan: {marginTop: 3, color: '#4B5563', fontSize: 12},
  status: {paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10},
  active: {backgroundColor: '#DCFCE7'},
  due: {backgroundColor: '#FEF3C7'},
  expired: {backgroundColor: '#FEE2E2'},
  statusText: {fontSize: 11, fontWeight: '800', color: '#374151'},
  empty: {textAlign: 'center', color: '#6B7280', marginTop: 40},
});
