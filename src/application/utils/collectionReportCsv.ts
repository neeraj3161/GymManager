import { CollectionReport } from '../../domain/entities/CollectionReport';

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');

  // Prevent spreadsheet formula injection.
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function collectionReportToCsv(report: CollectionReport): string {
  const rows: unknown[][] = [
    ['Collection Report'],
    ['From', report.fromDate],
    ['To (exclusive)', report.toDate],
    ['Total Collected', report.totalAmount.toFixed(2)],
    ['Payment Count', report.paymentCount],
    [],
    [
      'Payment Date',
      'Member Number',
      'Member Name',
      'Member ID',
      'Membership ID',
      'Amount',
      'Payment Method',
      'Recorded By',
      'Notes',
    ],
    ...report.payments.map(payment => [
      payment.paymentDate,
      payment.memberNumber,
      payment.memberName,
      payment.memberId,
      payment.membershipId,
      payment.amount.toFixed(2),
      payment.paymentMethod,
      payment.recordedBy,
      payment.notes ?? '',
    ]),
  ];

  return rows.map(row => row.map(escapeCsv).join(',')).join('\r\n');
}
