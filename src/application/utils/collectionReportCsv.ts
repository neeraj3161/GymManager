import { CollectionReport } from '../../domain/entities/CollectionReport';

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');

  // Prevent spreadsheet formula injection.
  const safe =
    typeof value === 'number' && value < 0
      ? text
      : /^[\s]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function collectionReportToCsv(report: CollectionReport): string {
  const rows: unknown[][] = [
    ['Collection Report'],
    ['From', report.fromDate],
    ['To (exclusive)', report.toDate],
    ['Total Collected', report.totalAmount.toFixed(2)],
    ['Payment Count', report.paymentCount],
    ['Transaction Count', report.transactions.length],
    [
      'Write-off Total (not collected)',
      report.transactions
        .filter(transaction => transaction.transactionType === 'write_off')
        .reduce((total, transaction) => total + Math.abs(transaction.amount), 0)
        .toFixed(2),
    ],
    [],
    [
      'Transaction Date',
      'Transaction Type',
      'Member Number',
      'Member Name',
      'Member ID',
      'Membership ID',
      'Amount',
      'Payment Method',
      'Recorded By',
      'Notes',
    ],
    ...report.transactions.map(transaction => [
      transaction.paymentDate,
      transaction.transactionType.replace(/_/g, ' '),
      transaction.memberNumber,
      transaction.memberName,
      transaction.memberId,
      transaction.membershipId,
      transaction.amount.toFixed(2),
      transaction.paymentMethod,
      transaction.recordedBy,
      transaction.notes ?? '',
    ]),
  ];

  return rows.map(row => row.map(escapeCsv).join(',')).join('\r\n');
}
