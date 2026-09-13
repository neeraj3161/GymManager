import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SafeAreaView, Text, View} from 'react-native';

import {AppNavigator} from './src/navigation/AppNavigator';
import {container} from './src/di/container';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    container.database
      .initialize()
      .then(() => setReady(true))
      .catch((initializationError: Error) => {
        setError(initializationError.message);
      });
  }, []);

  if (error) {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', padding: 24}}>
        <Text style={{fontSize: 22, fontWeight: '800'}}>
          Database error
        </Text>
        <Text style={{marginTop: 10}}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" />
        <Text style={{marginTop: 12}}>Preparing Gym Manager...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}
