import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { container } from '../../../di/container';

export function PlansScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await container.useCases.getPlans.execute();
      setPlans(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load plans.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openAddModal = () => {
    setEditingPlan(null);
    setName('');
    setDuration('');
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDuration(String(plan.durationMonths));
    setAmount(String(plan.amount));
    setDescription(plan.description ?? '');
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingPlan(null);
  };

  const savePlan = async () => {
    const durationMonths = Number(duration);
    const planAmount = Number(amount);

    if (!name.trim()) {
      Alert.alert('Invalid plan', 'Plan name is required.');
      return;
    }

    if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
      Alert.alert(
        'Invalid duration',
        'Duration must be a positive number of months.',
      );
      return;
    }

    if (!Number.isFinite(planAmount) || planAmount < 0) {
      Alert.alert('Invalid amount', 'Enter a valid plan amount.');
      return;
    }

    try {
      setSaving(true);

      if (editingPlan) {
        await container.useCases.updatePlan.execute({
          id: editingPlan.id,
          name,
          durationMonths,
          amount: planAmount,
          description,
        });

        Alert.alert('Success', 'Membership plan updated.');
      } else {
        await container.useCases.createPlan.execute({
          name,
          durationMonths,
          amount: planAmount,
          description,
        });

        Alert.alert('Success', 'Membership plan created.');
      }

      setModalVisible(false);
      setEditingPlan(null);

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to save',
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = (plan: MembershipPlan) => {
    const action = plan.active ? 'disable' : 'enable';

    Alert.alert(
      `${plan.active ? 'Disable' : 'Enable'} plan`,
      plan.active
        ? `"${plan.name}" will no longer be available for new memberships. Existing memberships will not be affected.`
        : `"${plan.name}" will become available for new memberships.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: plan.active ? 'Disable' : 'Enable',
          style: plan.active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await container.useCases.togglePlanStatus.execute(plan.id);

              await load();
            } catch (error) {
              Alert.alert(
                `Unable to ${action} plan`,
                error instanceof Error
                  ? error.message
                  : 'Something went wrong.',
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading membership plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <View style={styles.heading}>
            <Text style={styles.title}>Membership Plans</Text>

            <Text style={styles.subtitle}>
              Create and manage your gym plans.
            </Text>
          </View>

          <Pressable style={styles.add} onPress={openAddModal}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>

        {plans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No membership plans</Text>

            <Text style={styles.emptyText}>
              Create your first membership plan.
            </Text>
          </View>
        ) : (
          plans.map(plan => (
            <View
              style={[styles.card, !plan.active && styles.inactiveCard]}
              key={plan.id}
            >
              <View style={styles.cardMain}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{plan.name}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      plan.active ? styles.activeBadge : styles.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        plan.active ? styles.activeText : styles.inactiveText,
                      ]}
                    >
                      {plan.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.duration}>
                  {plan.durationMonths} month
                  {plan.durationMonths > 1 ? 's' : ''}
                </Text>

                {plan.description ? (
                  <Text style={styles.description}>{plan.description}</Text>
                ) : null}
              </View>

              <View style={styles.right}>
                <Text style={styles.amount}>
                  ₹{plan.amount.toLocaleString('en-IN')}
                </Text>

                <View style={styles.actions}>
                  <Pressable onPress={() => openEditModal(plan)}>
                    <Text style={styles.edit}>Edit</Text>
                  </Pressable>

                  <Pressable onPress={() => togglePlan(plan)}>
                    <Text
                      style={[
                        styles.toggle,
                        plan.active ? styles.disableText : styles.enableText,
                      ]}
                    >
                      {plan.active ? 'Disable' : 'Enable'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingPlan ? 'Edit Plan' : 'Add Plan'}
            </Text>

            <Text style={styles.label}>Plan name</Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Monthly"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              editable={!saving}
            />

            <Text style={styles.label}>Duration (months)</Text>

            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 1"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              editable={!saving}
            />

            <Text style={styles.label}>Amount</Text>

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 1200"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Text style={styles.label}>Description</Text>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional"
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!saving}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={savePlan}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  heading: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    color: '#6B7280',
  },

  add: {
    backgroundColor: '#111827',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  inactiveCard: {
    opacity: 0.75,
  },

  cardMain: {
    flex: 1,
    marginRight: 12,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  duration: {
    marginTop: 4,
    color: '#6B7280',
  },

  description: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  activeBadge: {
    backgroundColor: '#DCFCE7',
  },

  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  activeText: {
    color: '#166534',
  },

  inactiveText: {
    color: '#6B7280',
  },

  right: {
    alignItems: 'flex-end',
  },

  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  actions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 7,
  },

  edit: {
    fontWeight: '700',
    color: '#2563EB',
  },

  toggle: {
    fontWeight: '700',
  },

  disableText: {
    color: '#DC2626',
  },

  enableText: {
    color: '#16A34A',
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
    marginTop: 6,
    color: '#6B7280',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  descriptionInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  cancelText: {
    color: '#374151',
    fontWeight: '700',
  },

  saveButton: {
    minWidth: 75,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },
});
