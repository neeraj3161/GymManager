import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { container } from '../di/container';
import { useAuthStore } from '../store/authStore';

import { LoginScreen } from '../presentation/screens/auth/LoginScreen';
import { OwnerSetupScreen } from '../presentation/screens/auth/OwnerSetupScreen';

import { DashboardScreen } from '../presentation/screens/dashboard/DashboardScreen';

import { MembersScreen } from '../presentation/screens/members/MembersScreen';
import { AddMemberScreen } from '../presentation/screens/members/AddMemberScreen';
import { MemberDetailsScreen } from '../presentation/screens/members/MemberDetailsScreen';

import PaymentsScreen from '../presentation/screens/payments/PaymentsScreen';
import { PlansScreen } from '../presentation/screens/plans/PlansScreen';

import { BirthdaysScreen } from '../presentation/screens/birthdays/BirthdaysScreen';

import { StaffScreen } from '../presentation/screens/staff/StaffScreen';

import { SettingsScreen } from '../presentation/screens/settings/SettingsScreen';

import { RenewMembershipScreen } from '../presentation/screens/memberships/RenewMembershipScreen';

import { ChangeMembershipPlanScreen } from '../presentation/screens/memberships/ChangeMembershipPlanScreen';

export type RootStackParamList = {
  Login: undefined;
  OwnerSetup: undefined;

  Dashboard: undefined;
  Members: undefined;
  AddMember: undefined;

  MemberDetails: {
    memberId: string;
  };

  Payments: undefined;
  Plans: undefined;
  Birthdays: undefined;
  Staff: undefined;
  Settings: undefined;

  RenewMembership: {
    memberId: string;
    memberName: string;
  };

  ChangeMembershipPlan: {
    memberId: string;
    memberName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AuthMode = 'loading' | 'ownerSetup' | 'login' | 'authenticated' | 'error';

export function AppNavigator() {
  const hydrate = useAuthStore(state => state.hydrate);

  const [mode, setMode] = useState<AuthMode>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuthentication();
  }, []);

  const initializeAuthentication = async () => {
    try {
      setMode('loading');
      setError(null);

      // Check whether any users have been created.
      const users = await container.repositories.user.getAll();

      // First launch: no users exist.
      if (users.length === 0) {
        setMode('ownerSetup');
        return;
      }

      // Read the persisted session from secure storage.
      const persistedUserId = await useAuthStore
        .getState()
        .getPersistedUserId();

      // No saved session.
      if (!persistedUserId) {
        hydrate(null);
        setMode('login');
        return;
      }

      // Validate the persisted user against the local database.
      const persistedUser = await container.repositories.user.getById(
        persistedUserId,
      );

      // Session is invalid, user was deleted, or user was disabled.
      if (!persistedUser || !persistedUser.active) {
        await useAuthStore.getState().logout();
        setMode('login');
        return;
      }

      // Restore the user into Zustand.
      // This does NOT rewrite the Keychain.
      hydrate(persistedUser);

      setMode('authenticated');
    } catch (err) {
      console.error('Authentication initialization failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to initialize authentication.',
      );

      setMode('error');
    }
  };

  if (mode === 'loading') {
    return <LoadingScreen />;
  }

  if (mode === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to start Gym Manager</Text>

          <Text style={styles.errorText}>{error ?? 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      {mode === 'ownerSetup' && (
        <Stack.Navigator>
          <Stack.Screen
            name="OwnerSetup"
            component={OwnerSetupScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      )}

      {mode === 'login' && (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      )}

      {mode === 'authenticated' && (
        <Stack.Navigator>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'Gym Manager',
            }}
          />

          <Stack.Screen
            name="Members"
            component={MembersScreen}
            options={{
              title: 'Members',
            }}
          />

          <Stack.Screen
            name="AddMember"
            component={AddMemberScreen}
            options={{
              title: 'Add Member',
            }}
          />

          <Stack.Screen
            name="MemberDetails"
            component={MemberDetailsScreen}
            options={{
              title: 'Member Details',
            }}
          />

          <Stack.Screen
            name="Payments"
            component={PaymentsScreen}
            options={{
              title: 'Payments',
            }}
          />

          <Stack.Screen
            name="Plans"
            component={PlansScreen}
            options={{
              title: 'Membership Plans',
            }}
          />

          <Stack.Screen
            name="Birthdays"
            component={BirthdaysScreen}
            options={{
              title: 'Birthdays',
            }}
          />

          <Stack.Screen
            name="Staff"
            component={StaffScreen}
            options={{
              title: 'Staff',
            }}
          />

          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />

          <Stack.Screen
            name="RenewMembership"
            component={RenewMembershipScreen}
            options={{
              title: 'Renew Membership',
            }}
          />

          <Stack.Screen
            name="ChangeMembershipPlan"
            component={ChangeMembershipPlanScreen}
            options={{
              title: 'Change Membership Plan',
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Starting Gym Manager...</Text>
      </View>
    </SafeAreaView>
  );
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
    marginTop: 14,
    color: '#6B7280',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
});
