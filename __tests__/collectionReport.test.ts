import { SQLitePaymentRepository } from '../src/infrastructure/database/repositories/SQLitePaymentRepository';
import { collectionReportToCsv } from '../src/application/utils/collectionReportCsv';

describe('collection report transactions', () => {
  it('includes payment and adjustment transactions but totals only received payments', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        payment_id: 'payment-1',
        transaction_type: 'payment',
        payment_date: '2026-10-02T10:00:00.000Z',
        member_id: 'member-1',
        member_number: 'GYM-1',
        member_name: 'Test Member',
        membership_id: 'membership-1',
        amount: 500,
        payment_method: 'cash',
        recorded_by: 'staff-1',
        notes: null,
      },
      {
        payment_id: 'write-off-1',
        transaction_type: 'write_off',
        payment_date: '2026-10-02T11:00:00.000Z',
        member_id: 'member-1',
        member_number: 'GYM-1',
        member_name: 'Test Member',
        membership_id: 'membership-1',
        amount: -700,
        payment_method: 'adjustment',
        recorded_by: 'staff-1',
        notes: 'Approved write-off',
      },
      {
        payment_id: 'membership-1-credit',
        transaction_type: 'unused_membership_credit',
        payment_date: '2026-10-02T12:00:00.000Z',
        member_id: 'member-1',
        member_number: 'GYM-1',
        member_name: 'Test Member',
        membership_id: 'membership-1',
        amount: -100,
        payment_method: 'adjustment',
        recorded_by: '',
        notes: 'Unused days credit',
      },
    ]);
    const repository = new SQLitePaymentRepository({ query } as never);

    const report = await repository.getCollectionReport(
      '2026-10-01',
      '2026-11-01',
    );

    expect(query.mock.calls[0][0]).toContain('UNION ALL');
    expect(report.transactions.map(row => row.transactionType)).toEqual([
      'payment',
      'write_off',
      'unused_membership_credit',
    ]);
    expect(report.payments).toHaveLength(1);
    expect(report.totalAmount).toBe(500);
    expect(report.paymentCount).toBe(1);

    const csv = collectionReportToCsv(report);
    expect(csv).toContain('write off');
    expect(csv).toContain('unused membership credit');
    expect(csv).toContain('-700.00');
    expect(csv).toContain('500.00');
  });
});
