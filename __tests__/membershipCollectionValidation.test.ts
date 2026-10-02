import {
  getMaxCollectableAmount,
  getRemainingDue,
  validateCollectionAmount,
} from '../src/application/memberships/collectionValidation';

describe('membership collection validation', () => {
  it('caps collection at the outstanding previous due only', () => {
    expect(
      getMaxCollectableAmount({
        previousDue: 1200,
        newPlanAmount: 3000,
      }),
    ).toBe(1200);
  });

  it('blocks partial collection amounts above the due amount', () => {
    const result = validateCollectionAmount({
      collectAmount: 1500,
      previousDue: 1200,
      newPlanAmount: 3000,
    });

    expect(result.isValid).toBe(false);
    expect(result.maxAllowed).toBe(1200);
    expect(result.message).toContain('1,200');
  });

  it('allows collecting the full outstanding previous due', () => {
    const result = validateCollectionAmount({
      collectAmount: 1200,
      previousDue: 1200,
      newPlanAmount: 3000,
    });

    expect(result.isValid).toBe(true);
  });

  it('keeps the leftover due as part of the final payment when partially collected', () => {
    expect(getRemainingDue(400, 200)).toBe(200);
  });
});
