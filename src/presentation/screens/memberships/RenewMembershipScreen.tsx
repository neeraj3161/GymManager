import React, {useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';

import {MembershipPlan} from '../../../domain/entities/MembershipPlan';
import {container} from '../../../di/container';

export function RenewMembershipScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const memberId = route.params?.memberId as string;
  const memberName = route.params?.memberName as string;

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await container.useCases.getPlans.execute();

      setPlans(data);

      if (data.length > 0) {
        setSelectedPlanId(data[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load membership plans.');
    }
  };

  const selectedPlan = plans.find(
    plan => plan.id === selectedPlanId,
  );

  const renew = async () => {
    if (!selectedPlanId) {
      Alert.alert(
        'Select a plan',
        'Please select a membership plan.',
      );
      return;
    }

    try {
      setSaving(true);

      await container.useCases.renewMembership.execute({
        memberId,
        planId: selectedPlanId,
      });

      Alert.alert(
        'Membership renewed',
        `${selectedPlan?.name ?? 'Membership'} has been added.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Renewal failed',
        error instanceof Error
          ? error.message
          : 'Unable to renew membership.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Renew Membership</Text>

        <Text style={styles.memberName}>
          {memberName}
        </Text>

        <Text style={styles.sectionTitle}>
          Choose a plan
        </Text>

        {plans.map(plan => {
          const selected = plan.id === selectedPlanId;

          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlanId(plan.id)}
              style={[
                styles.planCard,
                selected && styles.selectedPlan,
              ]}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>
                  {plan.name}
                </Text>

                <Text style={styles.duration}>
                  {plan.durationMonths} month
                  {plan.durationMonths === 1 ? '' : 's'}
                </Text>
              </View>

              <Text style={styles.amount}>
                ₹{plan.amount.toLocaleString('en-IN')}
              </Text>
            </Pressable>
          );
        })}

        {selectedPlan && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              Renewal Summary
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Plan</Text>
              <Text style={styles.value}>
                {selectedPlan.name}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>
                {selectedPlan.durationMonths} month
                {selectedPlan.durationMonths === 1
                  ? ''
                  : 's'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>
                ₹{selectedPlan.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.renewButton,
            saving && styles.disabledButton,
          ]}
          onPress={renew}
          disabled={saving}>
          <Text style={styles.renewButtonText}>
            {saving ? 'Renewing...' : 'Confirm Renewal'}
          </Text>
        </Pressable>
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

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  memberName: {
    marginTop: 5,
    fontSize: 15,
    color: '#6B7280',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedPlan: {
    borderColor: '#111827',
  },

  planInfo: {
    flex: 1,
  },

  planName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  duration: {
    marginTop: 4,
    color: '#6B7280',
  },

  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    color: '#6B7280',
  },

  value: {
    fontWeight: '700',
    color: '#111827',
  },

  renewButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.6,
  },

  renewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});