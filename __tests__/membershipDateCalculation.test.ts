import {
  calculateMembershipEndDate,
  formatDateOnly,
  parseDateOnly,
} from '../src/shared/utils/date';

describe('membership end date calculation', () => {
  it('calculates the end date from the selected start date at month end', () => {
    const startDate = parseDateOnly('2024-01-31');

    expect(startDate).not.toBeNull();
    expect(formatDateOnly(calculateMembershipEndDate(startDate!, 1))).toBe(
      '2024-02-28',
    );
  });

  it('uses the selected date for a multi-month plan', () => {
    const startDate = parseDateOnly('2025-09-15');

    expect(startDate).not.toBeNull();
    expect(formatDateOnly(calculateMembershipEndDate(startDate!, 3))).toBe(
      '2025-12-14',
    );
  });
});
