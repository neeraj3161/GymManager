import {
  calculateMembershipPaymentSummary,
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

  it('does not require a collection when there is no previous due', () => {
    const result = validateCollectionAmount({
      collectAmount: 0,
      previousDue: 0,
      newPlanAmount: 3000,
    });

    expect(result.isValid).toBe(true);
    expect(result.maxAllowed).toBe(0);
  });

  it('keeps the leftover due as part of the final payment when partially collected', () => {
    expect(getRemainingDue(400, 200)).toBe(200);
  });

  it('calculates the correct total for collect, write-off, and carry-forward actions', () => {
    expect(
      calculateMembershipPaymentSummary({
        planAmount: 2000,
        previousDue: 600,
        previousDueAction: 'collect',
        collectAmount: 200,
      }),
    ).toMatchObject({
      baseAmount: 2000,
      collectedAmount: 200,
      remainingPreviousDue: 400,
      finalAmount: 2400,
    });

    expect(
      calculateMembershipPaymentSummary({
        planAmount: 2000,
        previousDue: 600,
        previousDueAction: 'write_off',
        collectAmount: 0,
      }),
    ).toMatchObject({
      finalAmount: 2000,
      remainingPreviousDue: 600,
    });

    expect(
      calculateMembershipPaymentSummary({
        planAmount: 2000,
        previousDue: 600,
        previousDueAction: 'carry_forward',
        collectAmount: 0,
      }),
    ).toMatchObject({
      finalAmount: 2600,
      remainingPreviousDue: 600,
    });
  });
});
