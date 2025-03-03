import { describe, it, expect } from "vitest";
import { PaymentRule, PriceCondition } from "wasp/entities";
import { runPaymentRules } from "./payment-rules";
import { Decimal } from "decimal.js";

// Type definitions for mocking with conditions
type MockPaymentRule = PaymentRule & {
  conditions?: MockPriceCondition[];
};

type MockPriceCondition = {
  id: string;
  paymentRuleId: string;
  startTime: number | null;
  endTime: number | null;
  userTags: string[];
  createdAt: Date;
  updatedAt: Date;
};

describe("Payment Rules", () => {
  const baseDate = new Date("2024-01-01T10:00:00"); // Tuesday
  const oneHourLater = new Date("2024-01-01T11:00:00");
  const twoHoursLater = new Date("2024-01-01T12:00:00");
  const spaceId = "space-123";
  const venueId = "venue-123";
  const now = new Date();

  const createBaseRule = (
    overrides: Partial<MockPaymentRule> = {},
  ): MockPaymentRule => ({
    id: "1",
    venueId,
    spaceIds: [spaceId],
    priority: 1,
    ruleType: "BASE_RATE",
    pricePerPeriod: null,
    periodMinutes: null,
    multiplier: null,
    discountRate: null,
    startTime: null,
    endTime: null,
    daysOfWeek: [],
    createdAt: now,
    updatedAt: now,
    conditions: [],
    ...overrides,
  });

  const createCondition = (
    overrides: Partial<MockPriceCondition> = {},
  ): MockPriceCondition => ({
    id: "c1",
    paymentRuleId: "1", // Default to the first rule's ID
    startTime: null,
    endTime: null,
    userTags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  describe("Base Rate Rules", () => {
    it("should calculate correct base rate for one-hour period", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(10);
    });

    it("should round up partial periods", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
      ];

      const ninetyMinutesLater = new Date("2024-01-01T11:30:00");
      const result = runPaymentRules(
        rules,
        baseDate,
        ninetyMinutesLater,
        spaceId,
      );
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(20); // Should charge for 2 full hours
    });
  });

  describe("Time and Day Restrictions", () => {
    it("should only apply rules within specified time range", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          startTime: 600, // 10:00
          endTime: 660, // 11:00
        }),
      ];

      const outsideTimeRange = new Date("2024-01-01T12:00:00");
      const result = runPaymentRules(
        rules,
        outsideTimeRange,
        twoHoursLater,
        spaceId,
      );
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
    });

    it("should only apply rules on specified days", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          daysOfWeek: [0, 6], // Only weekends
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId); // Tuesday
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
    });
  });

  describe("Multiplier Rules", () => {
    it("should apply multiplier after base rate", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "MULTIPLIER",
          priority: 2,
          multiplier: new Decimal(2),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(20); // 10 * 2
    });
  });

  describe("Discount Rules", () => {
    it("should apply discount after base rate", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "DISCOUNT",
          priority: 2,
          discountRate: new Decimal(0.5),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(5); // 10 * (1 - 0.5)
    });
  });

  describe("Flat Fee Rules", () => {
    it("should add flat fee to total", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "FLAT_FEE",
          priority: 2,
          pricePerPeriod: new Decimal(5),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(15); // 10 + 5
    });
  });

  describe("Rule Priority", () => {
    it("should apply rules in priority order", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "MULTIPLIER",
          priority: 2,
          multiplier: new Decimal(2),
        }),
        createBaseRule({
          id: "3",
          ruleType: "DISCOUNT",
          priority: 3,
          discountRate: new Decimal(0.5),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(10); // (10 * 2) * (1 - 0.5)
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty rules array", () => {
      const result = runPaymentRules([], baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
      expect(result.priceBreakdown).toBeUndefined();
    });

    it("should handle rules with no pricing information", () => {
      const rules: PaymentRule[] = [createBaseRule()];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
      expect(result.priceBreakdown).toBeUndefined();
    });

    it("should handle rules for different spaces", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          spaceIds: ["different-space"],
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
    });

    it("should handle zero-duration bookings", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
      ];

      const sameTime = new Date("2024-01-01T10:00:00");
      const result = runPaymentRules(rules, sameTime, sameTime, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
    });

    it("should handle negative duration bookings", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
      ];

      const laterTime = new Date("2024-01-01T11:00:00");
      const earlierTime = new Date("2024-01-01T10:00:00");
      const result = runPaymentRules(rules, laterTime, earlierTime, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
    });

    it("should handle extremely long durations without overflow", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
      ];

      const farFuture = new Date("2025-01-01T10:00:00"); // One year later
      const result = runPaymentRules(rules, baseDate, farFuture, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(87840); // 8784 hours in a year (including leap year) * 10
    });

    it("should handle multiple overlapping time restrictions", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          startTime: 600, // 10:00
          endTime: 720, // 12:00
        }),
        createBaseRule({
          id: "2",
          pricePerPeriod: new Decimal(20),
          periodMinutes: 60,
          startTime: 660, // 11:00
          endTime: 780, // 13:00
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId); // 10:00 - 11:00
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(10); // Should use first rule only
    });

    it("should handle decimal precision in complex calculations", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal("9.99"),
          periodMinutes: 30,
        }),
        createBaseRule({
          id: "2",
          ruleType: "MULTIPLIER",
          priority: 2,
          multiplier: new Decimal("1.5"),
        }),
        createBaseRule({
          id: "3",
          ruleType: "DISCOUNT",
          priority: 3,
          discountRate: new Decimal("0.333333"),
        }),
      ];

      const thirtyMinutesLater = new Date("2024-01-01T10:30:00");
      const result = runPaymentRules(
        rules,
        baseDate,
        thirtyMinutesLater,
        spaceId,
      );
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(9.99); // Rounded to 2 decimal places
    });

    it("should handle rules with all fields set to edge values", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal("0.01"), // Minimum price
          periodMinutes: 1, // Minimum period
          startTime: 0, // Start of day
          endTime: 1439, // End of day (23:59)
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
          multiplier: new Decimal("0.01"), // Minimum multiplier
          discountRate: new Decimal("0.99"), // Maximum discount
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(0.6); // 60 periods * 0.01
    });

    it("should handle rules with global space applicability", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          spaceIds: [], // Empty array means applies to all spaces
        }),
      ];

      const result = runPaymentRules(
        rules,
        baseDate,
        oneHourLater,
        "any-space-id",
      );
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(10);
    });
  });

  describe("Price Breakdown", () => {
    it("should return priceBreakdown when there are applicable rules", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "FLAT_FEE",
          priority: 2,
          pricePerPeriod: new Decimal(5),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(true);
      expect(result.totalCost).toBe(15);
      expect(result.priceBreakdown).toBeDefined();
      
      // Verify breakdown structure
      expect(result.priceBreakdown?.baseRate).toBeDefined();
      expect(result.priceBreakdown?.baseRate?.amount).toBe(10);
      expect(result.priceBreakdown?.fees.length).toBe(1);
      expect(result.priceBreakdown?.fees[0].amount).toBe(5);
      expect(result.priceBreakdown?.subtotal).toBe(10);
      expect(result.priceBreakdown?.total).toBe(15);
    });

    it("should not return priceBreakdown when there are no applicable rules", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          daysOfWeek: [0, 6], // Only weekends
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId); // Tuesday
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
      expect(result.priceBreakdown).toBeUndefined();
    });

    it("should include multipliers in priceBreakdown", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "MULTIPLIER",
          priority: 2,
          multiplier: new Decimal(2),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.priceBreakdown).toBeDefined();
      expect(result.priceBreakdown?.multipliers.length).toBe(1);
      expect(result.priceBreakdown?.multipliers[0].amount).toBe(10); // Effect of 2x multiplier on base rate of 10
    });

    it("should include discounts in priceBreakdown", () => {
      const rules: PaymentRule[] = [
        createBaseRule({
          id: "1",
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
        }),
        createBaseRule({
          id: "2",
          ruleType: "DISCOUNT",
          priority: 2,
          discountRate: new Decimal(0.5),
        }),
      ];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.priceBreakdown).toBeDefined();
      expect(result.priceBreakdown?.discounts.length).toBe(1);
      expect(result.priceBreakdown?.discounts[0].amount).toBe(-5); // Negative amount for 50% discount on 10
    });
  });

  describe("Price Conditions", () => {
    it("should apply rule when condition matches user tags", () => {
      const rules = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          conditions: [
            createCondition({
              userTags: ["premium"],
            }),
          ],
        }),
      ] as PaymentRule[];

      // Without the required tag, rule shouldn't apply
      const resultWithoutTag = runPaymentRules(rules, baseDate, oneHourLater, spaceId, []);
      expect(resultWithoutTag.requiresPayment).toBe(false);
      expect(resultWithoutTag.totalCost).toBe(0);
      expect(resultWithoutTag.priceBreakdown).toBeUndefined();

      // With the required tag, rule should apply
      const resultWithTag = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["premium"]);
      expect(resultWithTag.requiresPayment).toBe(true);
      expect(resultWithTag.totalCost).toBe(10);
      expect(resultWithTag.priceBreakdown).toBeDefined();
    });

    it("should apply rule when condition matches time range", () => {
      const morningTime = new Date("2024-01-01T09:00:00"); // 9:00 AM
      const morningTimeEnd = new Date("2024-01-01T10:00:00"); // 10:00 AM
      
      const rules = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          conditions: [
            createCondition({
              // Time condition for morning hours (8:00 AM - 12:00 PM)
              startTime: 8 * 60, // 8:00 AM
              endTime: 12 * 60, // 12:00 PM
            }),
          ],
        }),
      ] as PaymentRule[];

      // In the morning time range, rule should apply
      const morningResult = runPaymentRules(rules, morningTime, morningTimeEnd, spaceId);
      expect(morningResult.requiresPayment).toBe(true);
      expect(morningResult.totalCost).toBe(10);
      expect(morningResult.priceBreakdown).toBeDefined();

      // Evening time - outside the condition range
      const eveningTime = new Date("2024-01-01T20:00:00"); // 8:00 PM
      const eveningTimeEnd = new Date("2024-01-01T21:00:00"); // 9:00 PM
      
      const eveningResult = runPaymentRules(rules, eveningTime, eveningTimeEnd, spaceId);
      expect(eveningResult.requiresPayment).toBe(false);
      expect(eveningResult.totalCost).toBe(0);
      expect(eveningResult.priceBreakdown).toBeUndefined();
    });

    it("should apply rule when multiple conditions exist and any matches", () => {
      const rules = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          conditions: [
            createCondition({
              userTags: ["vip"],
            }),
            createCondition({
              userTags: ["staff"],
            }),
          ],
        }),
      ] as PaymentRule[];

      // No tags, rule shouldn't apply
      const noTagResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, []);
      expect(noTagResult.requiresPayment).toBe(false);
      expect(noTagResult.totalCost).toBe(0);

      // With staff tag, rule should apply
      const staffResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["staff"]);
      expect(staffResult.requiresPayment).toBe(true);
      expect(staffResult.totalCost).toBe(10);

      // With vip tag, rule should apply
      const vipResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["vip"]);
      expect(vipResult.requiresPayment).toBe(true);
      expect(vipResult.totalCost).toBe(10);

      // With unrelated tag, rule shouldn't apply
      const otherResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["regular"]);
      expect(otherResult.requiresPayment).toBe(false);
      expect(otherResult.totalCost).toBe(0);
    });

    it("should apply rule when both time and tag conditions match", () => {
      const rules = [
        createBaseRule({
          pricePerPeriod: new Decimal(10),
          periodMinutes: 60,
          conditions: [
            createCondition({
              startTime: 9 * 60, // 9:00 AM
              endTime: 12 * 60, // 12:00 PM
              userTags: ["student"],
            }),
          ],
        }),
      ] as PaymentRule[];

      // Right time, right tag - should apply
      const correctResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["student"]);
      expect(correctResult.requiresPayment).toBe(true);
      expect(correctResult.totalCost).toBe(10);

      // Right time, wrong tag - shouldn't apply
      const wrongTagResult = runPaymentRules(rules, baseDate, oneHourLater, spaceId, ["teacher"]);
      expect(wrongTagResult.requiresPayment).toBe(false);
      expect(wrongTagResult.totalCost).toBe(0);

      // Wrong time, right tag - shouldn't apply
      const eveningTime = new Date("2024-01-01T20:00:00"); // 8:00 PM
      const eveningTimeEnd = new Date("2024-01-01T21:00:00"); // 9:00 PM
      
      const wrongTimeResult = runPaymentRules(rules, eveningTime, eveningTimeEnd, spaceId, ["student"]);
      expect(wrongTimeResult.requiresPayment).toBe(false);
      expect(wrongTimeResult.totalCost).toBe(0);
    });
  });

  describe("Student Discount Calculations", () => {
    it("should calculate correct prices with student discount", () => {
      // Setup a base rate rule that applies to everyone
      // and a special discount rule that only applies to students
      const rules = [
        createBaseRule({
          id: "1",
          priority: 1,
          ruleType: "BASE_RATE",
          pricePerPeriod: new Decimal(50), // $50 base rate
          periodMinutes: 60, // per hour
        }),
        createBaseRule({
          id: "2",
          priority: 2,
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.25), // 25% discount
          conditions: [
            createCondition({
              userTags: ["student"], // Only applies to students
            }),
          ],
        }),
      ] as PaymentRule[];

      // Test for non-student user (should pay full price)
      const regularUserResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["regular"]
      );
      expect(regularUserResult.requiresPayment).toBe(true);
      expect(regularUserResult.totalCost).toBe(50); // Full base rate
      expect(regularUserResult.priceBreakdown).toBeDefined();
      expect(regularUserResult.priceBreakdown?.baseRate?.amount).toBe(50);
      expect(regularUserResult.priceBreakdown?.discounts.length).toBe(0); // No discounts applied

      // Test for student user (should get discount)
      const studentUserResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["student"]
      );
      expect(studentUserResult.requiresPayment).toBe(true);
      expect(studentUserResult.totalCost).toBe(37.5); // $50 - 25% = $37.50
      expect(studentUserResult.priceBreakdown).toBeDefined();
      expect(studentUserResult.priceBreakdown?.baseRate?.amount).toBe(50);
      expect(studentUserResult.priceBreakdown?.discounts.length).toBe(1);
      expect(studentUserResult.priceBreakdown?.discounts[0].amount).toBe(-12.5); // Discount amount
      expect(studentUserResult.priceBreakdown?.discounts[0].ruleId).toBe("2");
    });

    it("should calculate correct prices for multiple hour bookings with student discount", () => {
      // Test for a longer booking (3 hours)
      const threeHourEnd = new Date("2024-01-01T13:00:00"); // 3 hours after base date
      
      const rules = [
        createBaseRule({
          id: "1",
          priority: 1,
          ruleType: "BASE_RATE",
          pricePerPeriod: new Decimal(50), // $50 base rate
          periodMinutes: 60, // per hour
        }),
        createBaseRule({
          id: "2",
          priority: 2,
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.25), // 25% discount
          conditions: [
            createCondition({
              userTags: ["student"], // Only applies to students
            }),
          ],
        }),
      ] as PaymentRule[];

      // Test for non-student user (should pay full price)
      const regularUserResult = runPaymentRules(
        rules, 
        baseDate, 
        threeHourEnd, 
        spaceId, 
        ["regular"]
      );
      expect(regularUserResult.requiresPayment).toBe(true);
      expect(regularUserResult.totalCost).toBe(150); // $50 × 3 hours = $150
      expect(regularUserResult.priceBreakdown?.baseRate?.amount).toBe(150);

      // Test for student user (should get discount)
      const studentUserResult = runPaymentRules(
        rules, 
        baseDate, 
        threeHourEnd, 
        spaceId, 
        ["student"]
      );
      expect(studentUserResult.requiresPayment).toBe(true);
      expect(studentUserResult.totalCost).toBe(112.5); // $150 - 25% = $112.50
      expect(studentUserResult.priceBreakdown?.baseRate?.amount).toBe(150);
      expect(studentUserResult.priceBreakdown?.discounts[0].amount).toBe(-37.5); // Discount amount
    });

    it("should calculate correct prices with time-restricted student discount", () => {
      // Set up specific time frames for testing
      const morningStart = new Date("2024-01-01T09:00:00"); // 9:00 AM
      const morningEnd = new Date("2024-01-01T10:00:00");   // 10:00 AM
      const eveningStart = new Date("2024-01-01T18:00:00"); // 6:00 PM
      const eveningEnd = new Date("2024-01-01T19:00:00");   // 7:00 PM
      
      const rules = [
        createBaseRule({
          id: "1",
          priority: 1,
          ruleType: "BASE_RATE",
          pricePerPeriod: new Decimal(50), // $50 base rate
          periodMinutes: 60, // per hour
        }),
        createBaseRule({
          id: "2",
          priority: 2,
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.40), // 40% discount
          conditions: [
            createCondition({
              userTags: ["student"],
              startTime: 9 * 60,  // 9:00 AM
              endTime: 15 * 60,   // 3:00 PM (off-peak hours)
            }),
          ],
        }),
      ] as PaymentRule[];

      // Morning booking - Should get student discount during off-peak hours
      const morningStudentResult = runPaymentRules(
        rules, 
        morningStart, 
        morningEnd, 
        spaceId, 
        ["student"]
      );
      expect(morningStudentResult.requiresPayment).toBe(true);
      expect(morningStudentResult.totalCost).toBe(30); // $50 - 40% = $30
      expect(morningStudentResult.priceBreakdown?.discounts[0].amount).toBe(-20);

      // Evening booking - Should NOT get student discount (outside time range)
      const eveningStudentResult = runPaymentRules(
        rules, 
        eveningStart, 
        eveningEnd, 
        spaceId, 
        ["student"]
      );
      expect(eveningStudentResult.requiresPayment).toBe(true);
      expect(eveningStudentResult.totalCost).toBe(50); // Full price - no discount
      expect(eveningStudentResult.priceBreakdown?.discounts.length).toBe(0);
    });

    it("should calculate prices with combined student and senior discount rules", () => {
      // Setup rules where we have both student and senior discount rules
      const rules = [
        createBaseRule({
          id: "1",
          priority: 1,
          ruleType: "BASE_RATE",
          pricePerPeriod: new Decimal(60), // $60 base rate
          periodMinutes: 60, // per hour
        }),
        createBaseRule({
          id: "2",
          priority: 2,
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.30), // 30% discount
          conditions: [
            createCondition({
              userTags: ["student"], // Only applies to students
            }),
          ],
        }),
        createBaseRule({
          id: "3",
          priority: 3, // Applied after student discount
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.20), // 20% discount
          conditions: [
            createCondition({
              userTags: ["senior"], // Only applies to seniors
            }),
          ],
        }),
      ] as PaymentRule[];

      // Regular user (no discount)
      const regularResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["regular"]
      );
      expect(regularResult.totalCost).toBe(60); // Full price

      // Student user (30% discount)
      const studentResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["student"]
      );
      expect(studentResult.totalCost).toBe(42); // $60 - 30% = $42
      expect(studentResult.priceBreakdown?.discounts.length).toBe(1);
      expect(studentResult.priceBreakdown?.discounts[0].amount).toBe(-18);

      // Senior user (20% discount)
      const seniorResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["senior"]
      );
      expect(seniorResult.totalCost).toBe(48); // $60 - 20% = $48
      expect(seniorResult.priceBreakdown?.discounts.length).toBe(1);
      expect(seniorResult.priceBreakdown?.discounts[0].amount).toBe(-12);

      // User with both student and senior tags
      // Should apply both discounts sequentially (not compounded)
      // First 30% off, then 20% off the remaining amount
      const combinedResult = runPaymentRules(
        rules, 
        baseDate, 
        oneHourLater, 
        spaceId, 
        ["student", "senior"]
      );
      expect(combinedResult.totalCost).toBe(33.6); // $60 - 30% = $42, then $42 - 20% = $33.60
      expect(combinedResult.priceBreakdown?.discounts.length).toBe(2);
      expect(combinedResult.priceBreakdown?.discounts[0].amount).toBe(-18);   // Student discount
      expect(combinedResult.priceBreakdown?.discounts[1].amount).toBe(-8.4);  // Senior discount
    });

    it("should calculate complex pricing with multiple conditional rules", () => {
      // Test comprehensive scenario with:
      // 1. Base rate for everyone
      // 2. Peak-hour multiplier that applies during certain hours
      // 3. Student discount that applies only to students
      // 4. Flat fee for equipment that applies to everyone
      
      // Morning time (peak hours)
      const morningStart = new Date("2024-01-01T09:00:00"); // 9:00 AM
      const morningEnd = new Date("2024-01-01T11:00:00");   // 11:00 AM (2 hours)
      
      // Evening time (off-peak hours)
      const eveningStart = new Date("2024-01-01T19:00:00"); // 7:00 PM
      const eveningEnd = new Date("2024-01-01T21:00:00");   // 9:00 PM (2 hours)
      
      const rules = [
        // Rule 1: Base rate ($40/hour)
        createBaseRule({
          id: "1",
          priority: 1,
          ruleType: "BASE_RATE",
          pricePerPeriod: new Decimal(40),
          periodMinutes: 60,
        }),
        
        // Rule 2: Peak-hour multiplier (1.5x during 8AM-5PM)
        createBaseRule({
          id: "2",
          priority: 2,
          ruleType: "MULTIPLIER",
          multiplier: new Decimal(1.5),
          conditions: [
            createCondition({
              startTime: 8 * 60,  // 8:00 AM
              endTime: 17 * 60,   // 5:00 PM
            }),
          ],
        }),
        
        // Rule 3: Student discount (25% off)
        createBaseRule({
          id: "3",
          priority: 3,
          ruleType: "DISCOUNT",
          discountRate: new Decimal(0.25),
          conditions: [
            createCondition({
              userTags: ["student"],
            }),
          ],
        }),
        
        // Rule 4: Equipment fee ($10 flat fee)
        createBaseRule({
          id: "4",
          priority: 4,
          ruleType: "FLAT_FEE",
          pricePerPeriod: new Decimal(10),
        }),
      ] as PaymentRule[];

      // Test 1: Regular user during peak hours
      // Base: $40 * 2 hours = $80
      // Peak multiplier: $80 * 1.5 = $120
      // Flat fee: +$10
      // Total: $130
      const regularPeakResult = runPaymentRules(
        rules,
        morningStart,
        morningEnd,
        spaceId,
        ["regular"]
      );
      expect(regularPeakResult.requiresPayment).toBe(true);
      expect(regularPeakResult.totalCost).toBe(130);
      expect(regularPeakResult.priceBreakdown?.baseRate?.amount).toBe(80);
      expect(regularPeakResult.priceBreakdown?.multipliers.length).toBe(1);
      expect(regularPeakResult.priceBreakdown?.multipliers[0].amount).toBe(40); // Effect of 1.5x
      expect(regularPeakResult.priceBreakdown?.fees.length).toBe(1);
      expect(regularPeakResult.priceBreakdown?.fees[0].amount).toBe(10);
      
      // Test 2: Student user during peak hours
      // Base: $40 * 2 hours = $80
      // Peak multiplier: $80 * 1.5 = $120
      // Student discount: $120 * 0.25 = $30 off
      // After discount: $90
      // Flat fee: +$10
      // Total: $100
      const studentPeakResult = runPaymentRules(
        rules,
        morningStart,
        morningEnd,
        spaceId,
        ["student"]
      );
      expect(studentPeakResult.requiresPayment).toBe(true);
      expect(studentPeakResult.totalCost).toBe(100);
      expect(studentPeakResult.priceBreakdown?.baseRate?.amount).toBe(80);
      expect(studentPeakResult.priceBreakdown?.multipliers.length).toBe(1);
      expect(studentPeakResult.priceBreakdown?.multipliers[0].amount).toBe(40);
      expect(studentPeakResult.priceBreakdown?.discounts.length).toBe(1);
      expect(studentPeakResult.priceBreakdown?.discounts[0].amount).toBe(-30);
      expect(studentPeakResult.priceBreakdown?.fees.length).toBe(1);
      expect(studentPeakResult.priceBreakdown?.fees[0].amount).toBe(10);
      
      // Test 3: Regular user during off-peak hours
      // Base: $40 * 2 hours = $80
      // No peak multiplier applies
      // Flat fee: +$10
      // Total: $90
      const regularOffPeakResult = runPaymentRules(
        rules,
        eveningStart,
        eveningEnd,
        spaceId,
        ["regular"]
      );
      expect(regularOffPeakResult.requiresPayment).toBe(true);
      expect(regularOffPeakResult.totalCost).toBe(90);
      expect(regularOffPeakResult.priceBreakdown?.baseRate?.amount).toBe(80);
      expect(regularOffPeakResult.priceBreakdown?.multipliers.length).toBe(0);
      expect(regularOffPeakResult.priceBreakdown?.fees.length).toBe(1);
      expect(regularOffPeakResult.priceBreakdown?.fees[0].amount).toBe(10);
      
      // Test 4: Student user during off-peak hours
      // Base: $40 * 2 hours = $80
      // No peak multiplier
      // Student discount: $80 * 0.25 = $20 off
      // After discount: $60
      // Flat fee: +$10
      // Total: $70
      const studentOffPeakResult = runPaymentRules(
        rules,
        eveningStart,
        eveningEnd,
        spaceId,
        ["student"]
      );
      expect(studentOffPeakResult.requiresPayment).toBe(true);
      expect(studentOffPeakResult.totalCost).toBe(70);
      expect(studentOffPeakResult.priceBreakdown?.baseRate?.amount).toBe(80);
      expect(studentOffPeakResult.priceBreakdown?.multipliers.length).toBe(0);
      expect(studentOffPeakResult.priceBreakdown?.discounts.length).toBe(1);
      expect(studentOffPeakResult.priceBreakdown?.discounts[0].amount).toBe(-20);
      expect(studentOffPeakResult.priceBreakdown?.fees.length).toBe(1);
      expect(studentOffPeakResult.priceBreakdown?.fees[0].amount).toBe(10);
    });
  });
});
