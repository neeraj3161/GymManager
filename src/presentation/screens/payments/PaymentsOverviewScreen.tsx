import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { CollectionReportRow } from '../../../domain/entities/CollectionReport';
import { container } from '../../../di/container';

const REPORT_START = '0000-01-01';
const REPORT_END = '9999-12-31';

export function PaymentsOverviewScreen() {
  const [payments, setPayments] = useState<CollectionReportRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setError(null);
      const report = await container.useCases.getCollectionReport.execute(
        REPORT_START,
        REPORT_END,
      );
      setPayments(report.payments);
      setTotalAmount(report.totalAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments]),
  );

  const refresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.ink} />
          <Text style={styles.loadingText}>Loading received payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to load payments</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadPayments}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={payments}
        keyExtractor={item => item.paymentId}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>COLLECTIONS</Text>
            <Text style={styles.title}>Payments received</Text>
            <Text style={styles.subtitle}>
              Every recorded payment, newest first.
            </Text>

            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL RECEIVED</Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{payments.length}</Text>
                <Text style={styles.summaryBadgeLabel}>payments</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Payment activity</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payments recorded</Text>
            <Text style={styles.emptyText}>
              Payments will appear here after they are recorded for a member.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PaymentRow payment={item} />}
      />
    </SafeAreaView>
  );
}

function PaymentRow({ payment }: { payment: CollectionReportRow }) {
  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentIcon}>
        <Text style={styles.paymentIconText}>₹</Text>
      </View>
      <View style={styles.paymentCopy}>
        <Text style={styles.memberName} numberOfLines={1}>
          {payment.memberName}
        </Text>
        <Text style={styles.paymentDate}>
          {formatDate(payment.paymentDate)}
        </Text>
      </View>
      <View style={styles.paymentValue}>
        <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
        <Text style={styles.method}>{payment.paymentMethod.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const colors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  ink: '#0D1220',
  muted: '#7B8496',
  subtle: '#A6ADBA',
  border: '#E9ECF2',
  green: '#149A67',
  greenSoft: '#EAF8F2',
  red: '#C73C3C',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 42 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: { marginTop: 14, color: colors.muted, fontWeight: '600' },
  eyebrow: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: { marginTop: 6, color: colors.ink, fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.muted, fontSize: 14 },
  summaryCard: {
    marginTop: 20,
    marginBottom: 26,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: '#98A2B3', fontSize: 11, fontWeight: '800' },
  summaryAmount: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  summaryBadge: {
    minWidth: 62,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.green,
  },
  summaryBadgeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  summaryBadgeLabel: { color: '#D8F6E9', fontSize: 10, fontWeight: '700' },
  sectionTitle: {
    marginBottom: 10,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  paymentCard: {
    minHeight: 76,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },
  paymentIconText: { color: colors.green, fontSize: 19, fontWeight: '800' },
  paymentCopy: { flex: 1, marginHorizontal: 12 },
  memberName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  paymentDate: { marginTop: 4, color: colors.muted, fontSize: 12 },
  paymentValue: { alignItems: 'flex-end' },
  amount: { color: colors.green, fontSize: 16, fontWeight: '800' },
  method: {
    marginTop: 4,
    color: colors.subtle,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 22,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { marginTop: 6, color: colors.muted, lineHeight: 20 },
  errorTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  errorText: { marginTop: 8, color: colors.muted, textAlign: 'center' },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});
