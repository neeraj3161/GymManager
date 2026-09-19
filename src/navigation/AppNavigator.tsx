import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import UpdateTestScreen from '../presentation/screens/UpdateTestScreen';

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
  UpdateTest: undefined;

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

type InitialMode = 'loading' | 'ownerSetup' | 'ready' | 'error';

export function AppNavigator() {
  // Subscribe to Zustand. This is the key fix.
  const user = useAuthStore(state => state.user);
  const hydrate = useAuthStore(state => state.hydrate);

  const [initialMode, setInitialMode] = useState<InitialMode>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuthentication = async () => {
      try {
        // Check whether an owner/account has been created.
        const users = await container.repositories.user.getAll();

        if (!mounted) return;

        if (users.length === 0) {
          setInitialMode('ownerSetup');
          return;
        }

        // Check for a persisted session.
        const persistedUserId = await useAuthStore
          .getState()
          .getPersistedUserId();

        if (!mounted) return;

        // No saved session: show Login.
        if (!persistedUserId) {
          hydrate(null);
          setInitialMode('ready');
          return;
        }

        // Validate saved session against SQLite.
        const persistedUser = await container.repositories.user.getById(
          persistedUserId,
        );

        if (!mounted) return;

        // Invalid or disabled user.
        if (!persistedUser || !persistedUser.active) {
          await useAuthStore.getState().logout();

          if (!mounted) return;

          setInitialMode('ready');
          return;
        }

        // Restore session into Zustand.
        hydrate(persistedUser);

        setInitialMode('ready');
      } catch (err) {
        console.error('Authentication initialization failed:', err);

        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to initialize authentication.',
        );

        setInitialMode('error');
      }
    };

    initializeAuthentication();

    return () => {
      mounted = false;
    };
  }, [hydrate]);

  if (initialMode === 'loading') {
    return <LoadingScreen />;
  }

  if (initialMode === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to start Gym Manager</Text>

          <Text style={styles.errorText}>{error ?? 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // First launch: owner setup.
  if (initialMode === 'ownerSetup') {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="OwnerSetup"
            component={OwnerSetupScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // No authenticated user: Login.
  // Authenticated user: render the app.
  // Zustand changes automatically switch between these navigators.
  return (
    <NavigationContainer key={user ? 'authenticated' : 'unauthenticated'}>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={({ navigation }) => ({
              title: 'Gym Manager',
              headerRight: () => (
                <Pressable
                  onPress={() => navigation.navigate('Settings')}
                  hitSlop={10}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 22 }}>⚙</Text>
                </Pressable>
              ),
            })}
          />

          <Stack.Screen
            name="Members"
            component={MembersScreen}
            options={{ title: 'Members' }}
          />

          <Stack.Screen
            name="AddMember"
            component={AddMemberScreen}
            options={{ title: 'Add Member' }}
          />

          <Stack.Screen
            name="MemberDetails"
            component={MemberDetailsScreen}
            options={{ title: 'Member Details' }}
          />

          <Stack.Screen
            name="Payments"
            component={PaymentsScreen}
            options={{ title: 'Payments' }}
          />

          <Stack.Screen
            name="Plans"
            component={PlansScreen}
            options={{ title: 'Membership Plans' }}
          />

          <Stack.Screen
            name="Birthdays"
            component={BirthdaysScreen}
            options={{ title: 'Birthdays' }}
          />

          <Stack.Screen
            name="Staff"
            component={StaffScreen}
            options={{ title: 'Staff' }}
          />

          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />

          <Stack.Screen name="UpdateTest" component={UpdateTestScreen} />

          <Stack.Screen
            name="RenewMembership"
            component={RenewMembershipScreen}
            options={{ title: 'Renew Membership' }}
          />

          <Stack.Screen
            name="ChangeMembershipPlan"
            component={ChangeMembershipPlanScreen}
            options={{ title: 'Change Membership Plan' }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
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
