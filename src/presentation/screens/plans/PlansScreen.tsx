import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipPlan } from '../../../domain/entities/MembershipPlan';
import { container } from '../../../di/container';

export function PlansScreen() {
  const insets = useSafeAreaInsets();
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
      setLoading(true);
      const data = await container.useCases.getPlans.execute();
      setPlans(data);
    } catch (error) {
      Alert.alert(
        'Unable to load plans',
        error instanceof Error ? error.message : 'Please try again.',
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

  const resetForm = () => {
    setEditingPlan(null);
    setName('');
    setDuration('');
    setAmount('');
    setDescription('');
  };

  const openAddModal = () => {
    resetForm();
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
    resetForm();
  };

  const savePlan = async () => {
    const durationMonths = Number(duration);
    const planAmount = Number(amount);

    if (!name.trim()) {
      Alert.alert(
        'Plan name required',
        'Enter a name for this membership plan.',
      );
      return;
    }

    if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
      Alert.alert(
        'Invalid duration',
        'Duration must be a positive whole number of months.',
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
          name: name.trim(),
          durationMonths,
          amount: planAmount,
          description: description.trim(),
        });

        Alert.alert('Plan updated', `${name.trim()} is ready to use.`);
      } else {
        await container.useCases.createPlan.execute({
          name: name.trim(),
          durationMonths,
          amount: planAmount,
          description: description.trim(),
        });

        Alert.alert('Plan created', `${name.trim()} is now available.`);
      }

      setModalVisible(false);
      resetForm();
      await load();
    } catch (error) {
      Alert.alert(
        'Unable to save plan',
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
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeCount = plans.filter(plan => plan.active).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MEMBERSHIPS</Text>
            <Text style={styles.title}>Plans</Text>
            <Text style={styles.subtitle}>
              Manage the membership plans available to your gym.
            </Text>
          </View>

          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.addPlus}>+</Text>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.overviewLabel}>AVAILABLE PLANS</Text>
            <Text style={styles.overviewValue}>{activeCount}</Text>
          </View>

          <View style={styles.overviewRight}>
            <Text style={styles.overviewLabel}>TOTAL PLANS</Text>
            <Text style={styles.overviewSecondary}>{plans.length}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membership plans</Text>
          <Text style={styles.sectionHint}>
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
          </Text>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>+</Text>
            <Text style={styles.emptyTitle}>No plans yet</Text>
            <Text style={styles.emptyText}>
              Create your first membership plan to start adding memberships.
            </Text>

            <Pressable
              onPress={openAddModal}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emptyButtonText}>Add first plan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.planList}>
            {plans.map(plan => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  !plan.active && styles.planCardInactive,
                ]}
              >
                <View style={styles.planTop}>
                  <View style={styles.planInfo}>
                    <View style={styles.planNameRow}>
                      <Text
                        style={[
                          styles.planName,
                          !plan.active && styles.planNameInactive,
                        ]}
                        numberOfLines={1}
                      >
                        {plan.name}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          plan.active
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            plan.active
                              ? styles.statusTextActive
                              : styles.statusTextInactive,
                          ]}
                        >
                          {plan.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.planDuration}>
                      {plan.durationMonths} month
                      {plan.durationMonths > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.planAmount,
                      !plan.active && styles.planAmountInactive,
                    ]}
                  >
                    ₹{plan.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                {plan.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}

                <View style={styles.planFooter}>
                  <Pressable
                    onPress={() => openEditModal(plan)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.textButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => togglePlan(plan)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.textButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        plan.active ? styles.disableText : styles.enableText,
                      ]}
                    >
                      {plan.active ? 'Disable' : 'Enable'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeModal}
              disabled={saving}
            />

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetEyebrow}>
                    {editingPlan ? 'EDIT PLAN' : 'NEW PLAN'}
                  </Text>
                  <Text style={styles.sheetTitle}>
                    {editingPlan ? 'Edit plan' : 'Add plan'}
                  </Text>
                </View>

                <Pressable
                  onPress={closeModal}
                  disabled={saving}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.sheetContent}
              >
                <Field
                  label="Plan name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Monthly"
                  editable={!saving}
                  autoCapitalize="words"
                />

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Duration"
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="1"
                      keyboardType="number-pad"
                      editable={!saving}
                      suffix="months"
                    />
                  </View>

                  <View style={styles.fieldHalf}>
                    <Field
                      label="Amount"
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="1200"
                      keyboardType="decimal-pad"
                      editable={!saving}
                      prefix="₹"
                    />
                  </View>
                </View>

                <Field
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  editable={!saving}
                  multiline
                  textAlignVertical="top"
                  inputStyle={styles.descriptionInput}
                />
              </ScrollView>

              <View
                style={[
                  styles.sheetFooter,
                  { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    saving && styles.saveButtonDisabled,
                    pressed && !saving && styles.saveButtonPressed,
                  ]}
                  onPress={savePlan}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveText}>
                      {editingPlan ? 'Save changes' : 'Create plan'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  textAlignVertical,
  prefix,
  suffix,
  inputStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  prefix?: string;
  suffix?: string;
  inputStyle?: object;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={[styles.inputShell, !editable && styles.inputDisabled]}>
        {prefix ? <Text style={styles.inputAffix}>{prefix}</Text> : null}

        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B5"
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          textAlignVertical={textAlignVertical}
        />

        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 34,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 10,
  },

  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '900',
    color: '#7C3AED',
  },

  title: {
    marginTop: 2,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#7C8796',
  },

  addButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  addPlus: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '300',
    marginRight: 6,
  },

  addText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151A24',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 25,
  },

  overviewLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#8F98A7',
    fontWeight: '900',
  },

  overviewValue: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  overviewRight: {
    alignItems: 'flex-end',
  },

  overviewSecondary: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 22,
    color: '#D8DDE5',
    fontWeight: '900',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: '#111827',
    fontWeight: '900',
  },

  sectionHint: {
    fontSize: 9,
    color: '#98A2B3',
    fontWeight: '800',
  },

  planList: {
    gap: 10,
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF0',
    borderRadius: 19,
    padding: 15,
  },

  planCardInactive: {
    backgroundColor: '#FBFBFC',
  },

  planTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  planInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  planName: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#182230',
    fontWeight: '900',
  },

  planNameInactive: {
    color: '#667085',
  },

  statusBadge: {
    marginLeft: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  statusBadgeActive: {
    backgroundColor: '#EAF8F0',
  },

  statusBadgeInactive: {
    backgroundColor: '#EFF1F4',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  statusTextActive: {
    color: '#15803D',
  },

  statusTextInactive: {
    color: '#687282',
  },

  planDuration: {
    marginTop: 5,
    fontSize: 11,
    color: '#808B9A',
    fontWeight: '700',
  },

  planAmount: {
    fontSize: 18,
    lineHeight: 22,
    color: '#111827',
    fontWeight: '900',
  },

  planAmountInactive: {
    color: '#7D8794',
  },

  description: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F4',
    fontSize: 11,
    lineHeight: 16,
    color: '#8A94A3',
  },

  planFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
  },

  textButton: {
    minWidth: 44,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '900',
  },

  toggleText: {
    fontSize: 11,
    fontWeight: '900',
  },

  disableText: {
    color: '#DC2626',
  },

  enableText: {
    color: '#16A34A',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EBF0',
    borderRadius: 21,
    padding: 26,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 30,
    color: '#7C3AED',
    fontWeight: '300',
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#101828',
    fontWeight: '900',
  },

  emptyText: {
    marginTop: 6,
    maxWidth: 285,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: '#7C8796',
  },

  emptyButton: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  modalRoot: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,16,23,0.48)',
    justifyContent: 'flex-end',
  },

  sheet: {
    maxHeight: '84%',
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5DC',
    marginTop: 9,
    marginBottom: 7,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
  },

  sheetHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },

  sheetEyebrow: {
    fontSize: 9,
    letterSpacing: 1.3,
    color: '#7C3AED',
    fontWeight: '900',
  },

  sheetTitle: {
    marginTop: 3,
    fontSize: 22,
    lineHeight: 27,
    color: '#101828',
    fontWeight: '900',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    marginTop: -2,
    fontSize: 24,
    lineHeight: 25,
    color: '#5D6775',
    fontWeight: '300',
  },

  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },

  field: {
    marginBottom: 15,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },

  fieldHalf: {
    flex: 1,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 11,
    color: '#697586',
    fontWeight: '900',
  },

  inputShell: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E5EB',
    borderRadius: 14,
    paddingHorizontal: 12,
  },

  inputDisabled: {
    opacity: 0.55,
  },

  inputAffix: {
    marginRight: 3,
    fontSize: 15,
    fontWeight: '900',
    color: '#667085',
  },

  inputSuffix: {
    marginLeft: 5,
    fontSize: 10,
    color: '#98A2B3',
    fontWeight: '800',
  },

  input: {
    flex: 1,
    minHeight: 47,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 13,
    color: '#17212F',
    fontWeight: '700',
  },

  descriptionInput: {
    minHeight: 92,
    paddingTop: 12,
    paddingBottom: 12,
  },

  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 11,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E9EE',
    shadowColor: '#101828',
    shadowOpacity: 0.07,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: -5 },
    elevation: 11,
  },

  cancelButton: {
    height: 50,
    minWidth: 84,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  cancelText: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '900',
  },

  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.18,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  saveButtonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonPressed: {
    transform: [{ scale: 0.985 }],
  },

  saveText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
  },

  loadingText: {
    marginTop: 11,
    color: '#7C8796',
    fontSize: 12,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.72,
  },
});
