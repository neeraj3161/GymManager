import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DashboardScreen} from '../presentation/screens/dashboard/DashboardScreen';
import {MembersScreen} from '../presentation/screens/members/MembersScreen';
import {AddMemberScreen} from '../presentation/screens/members/AddMemberScreen';
import {MemberDetailsScreen} from '../presentation/screens/members/MemberDetailsScreen';
import PaymentsScreen from '../presentation/screens/payments/PaymentsScreen';
import {PlansScreen} from '../presentation/screens/plans/PlansScreen';
import {BirthdaysScreen} from '../presentation/screens/birthdays/BirthdaysScreen';
import {StaffScreen} from '../presentation/screens/staff/StaffScreen';
import {SettingsScreen} from '../presentation/screens/settings/SettingsScreen';
import {BackupScreen} from '../presentation/screens/settings/BackupScreen';
import {RenewMembershipScreen} from '../presentation/screens/memberships/RenewMembershipScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Members: undefined;
  AddMember: undefined;
  MemberDetails: {memberId: string};
  Payments: {
    memberId: string;
    memberName: string;
  };
  Plans: undefined;
  Birthdays: undefined;
  Staff: undefined;
  Settings: undefined;
  Backup: undefined;
  RenewMembership: {
  memberId: string;
  memberName: string;
};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerTitleStyle: {fontWeight: '700'},
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{title: 'Gym Manager'}}
        />
        <Stack.Screen
  name="RenewMembership"
  component={RenewMembershipScreen}
  options={{title: 'Renew Membership'}}
/>
        <Stack.Screen
          name="Members"
          component={MembersScreen}
          options={{title: 'Members'}}
        />
        <Stack.Screen
          name="AddMember"
          component={AddMemberScreen}
          options={{title: 'Add Member'}}
        />
        <Stack.Screen
          name="MemberDetails"
          component={MemberDetailsScreen}
          options={{title: 'Member Details'}}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{title: 'Payments'}}
        />
        <Stack.Screen
          name="Plans"
          component={PlansScreen}
          options={{title: 'Membership Plans'}}
        />
        <Stack.Screen
          name="Birthdays"
          component={BirthdaysScreen}
          options={{title: 'Birthdays'}}
        />
        <Stack.Screen
          name="Staff"
          component={StaffScreen}
          options={{title: 'Staff'}}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{title: 'Backup & Restore'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
