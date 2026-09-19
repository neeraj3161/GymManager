export type CollectionPeriod = 'monthly' | 'yearly';

export function getCollectionDateRange(
  period: CollectionPeriod,
  date = new Date(),
): { fromDate: string; toDate: string } {
  const year = date.getFullYear();
  const month = date.getMonth();

  const pad = (value: number) => String(value).padStart(2, '0');

  if (period === 'monthly') {
    const fromDate = `${year}-${pad(month + 1)}-01`;

    const nextMonth = new Date(year, month + 1, 1);

    const toDate =
      `${nextMonth.getFullYear()}-` + `${pad(nextMonth.getMonth() + 1)}-01`;

    return { fromDate, toDate };
  }

  return {
    fromDate: `${year}-01-01`,
    toDate: `${year + 1}-01-01`,
  };
}
