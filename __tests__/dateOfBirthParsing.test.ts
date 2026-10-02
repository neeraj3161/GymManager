import { parseDateOnly } from '../src/shared/utils/date';

describe('date-of-birth parsing', () => {
  it('keeps the selected calendar date without timezone drift', () => {
    const parsed = parseDateOnly('2024-06-01');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2024);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(1);
  });

  it('rejects invalid calendar dates', () => {
    expect(parseDateOnly('2024-02-30')).toBeNull();
    expect(parseDateOnly('not-a-date')).toBeNull();
  });
});
