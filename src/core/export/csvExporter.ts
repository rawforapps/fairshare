/**
 * Free Ledger CSV Exporter
 * Eliminates Splitwise's paywalled data export restrictions.
 */

export interface ExportExpenseRow {
  date: string;
  description: string;
  category: string;
  totalAmount: string;
  currency: string;
  paidBy: string;
  yourShare: string;
}

export function generateLedgerCSV(groupName: string, rows: ExportExpenseRow[]): string {
  const headers = [
    'Date',
    'Description',
    'Category',
    'Total Amount',
    'Currency',
    'Paid By',
    'Your Share',
  ];

  const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const csvLines: string[] = [];
  csvLines.push(`# FairShare Ledger Export - Group: ${groupName}`);
  csvLines.push(`# Exported: ${new Date().toISOString()}`);
  csvLines.push('');
  csvLines.push(headers.map(escapeCSV).join(','));

  for (const row of rows) {
    const line = [
      row.date,
      row.description,
      row.category,
      row.totalAmount,
      row.currency,
      row.paidBy,
      row.yourShare,
    ].map(escapeCSV);
    csvLines.push(line.join(','));
  }

  return csvLines.join('\n');
}
