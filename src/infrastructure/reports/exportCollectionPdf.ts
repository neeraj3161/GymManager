import { saveDocuments } from '@react-native-documents/picker';
import { generatePDF } from 'react-native-html-to-pdf';

import { CollectionReport } from '../../domain/entities/CollectionReport';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: number): string {
  return `INR ${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildInsights(report: CollectionReport): string[] {
  const average = report.paymentCount
    ? report.totalAmount / report.paymentCount
    : 0;
  const methods = new Map<string, number>();

  for (const payment of report.payments) {
    methods.set(
      payment.paymentMethod,
      (methods.get(payment.paymentMethod) ?? 0) + payment.amount,
    );
  }

  const topMethod = [...methods.entries()].sort((a, b) => b[1] - a[1])[0];
  const insights = [
    `${report.paymentCount} payment${
      report.paymentCount === 1 ? '' : 's'
    } recorded in this period.`,
    `Average payment value: ${formatMoney(average)}.`,
  ];

  if (topMethod) {
    insights.push(
      `${topMethod[0].toUpperCase()} contributed the most: ${formatMoney(
        topMethod[1],
      )}.`,
    );
  }

  if (report.paymentCount === 0) {
    insights[0] = 'No payments were recorded in this period.';
  }

  return insights;
}

function reportToHtml(report: CollectionReport, title: string): string {
  const insights = buildInsights(report);
  const rows = report.payments
    .map(
      payment => `
        <tr>
          <td>${escapeHtml(formatDate(payment.paymentDate))}</td>
          <td><strong>${escapeHtml(
            payment.memberName,
          )}</strong><br><span>${escapeHtml(payment.memberNumber)}</span></td>
          <td>${escapeHtml(payment.paymentMethod.toUpperCase())}</td>
          <td class="amount">${escapeHtml(formatMoney(payment.amount))}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 34px 36px; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #172033; font-family: sans-serif; font-size: 10px; }
  .header { background: #172033; color: white; padding: 24px; border-radius: 12px; }
  .eyebrow { color: #8ed8c4; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; }
  h1 { margin: 8px 0 4px; font-size: 25px; }
  .range { color: #c7d0df; font-size: 11px; }
  .cards { display: flex; gap: 10px; margin: 18px 0; }
  .card { flex: 1; border: 1px solid #e2e7ef; border-radius: 9px; padding: 13px; }
  .card-label { color: #68758a; font-size: 9px; text-transform: uppercase; }
  .card-value { margin-top: 6px; color: #172033; font-size: 16px; font-weight: bold; }
  .section-title { margin: 18px 0 8px; color: #172033; font-size: 13px; font-weight: bold; }
  .insights { background: #eef8f5; border-left: 4px solid #36a88c; padding: 10px 13px; }
  .insights p { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #172033; color: white; padding: 9px 7px; text-align: left; font-size: 9px; }
  td { border-bottom: 1px solid #e2e7ef; padding: 8px 7px; vertical-align: top; }
  td span { color: #68758a; font-size: 8px; }
  .amount { text-align: right; font-weight: bold; white-space: nowrap; }
  .footer { margin-top: 22px; color: #8a95a5; font-size: 8px; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">GymManager Collection Report</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="range">${escapeHtml(
      formatDate(report.fromDate),
    )} - ${escapeHtml(formatDate(report.toDate))}</div>
  </div>
  <div class="cards">
    <div class="card"><div class="card-label">Total collected</div><div class="card-value">${escapeHtml(
      formatMoney(report.totalAmount),
    )}</div></div>
    <div class="card"><div class="card-label">Payments</div><div class="card-value">${
      report.paymentCount
    }</div></div>
    <div class="card"><div class="card-label">Average payment</div><div class="card-value">${escapeHtml(
      formatMoney(
        report.paymentCount ? report.totalAmount / report.paymentCount : 0,
      ),
    )}</div></div>
  </div>
  <div class="section-title">Report insights</div>
  <div class="insights">${insights
    .map(insight => `<p>&bull; ${escapeHtml(insight)}</p>`)
    .join('')}</div>
  <div class="section-title">Payment details</div>
  <table>
    <thead><tr><th>Date</th><th>Member</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${
      rows || '<tr><td colspan="4">No payments recorded.</td></tr>'
    }</tbody>
  </table>
  <div class="footer">Generated by GymManager</div>
</body>
</html>`;
}

export async function exportCollectionPdf(
  report: CollectionReport,
  title: string,
  fileName: string,
): Promise<void> {
  const pdf = await generatePDF({
    html: reportToHtml(report, title),
    fileName: fileName.replace(/\.pdf$/i, ''),
    base64: false,
  });

  const saved = await saveDocuments({
    sourceUris: [`file://${pdf.filePath}`],
    mimeType: 'application/pdf',
    fileName,
  });

  if (saved[0]?.error) {
    throw new Error(saved[0].error);
  }
}
