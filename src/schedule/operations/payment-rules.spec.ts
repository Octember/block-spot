import { describe, it, expect } from "vitest";
import { PaymentRule } from "wasp/entities";
import { runPaymentRules } from "./payment-rules";
import { Decimal } from "decimal.js";

describe("Payment Rules", () => {
  const baseDate = new Date("2024-01-01T10:00:00"); // Tuesday
  const oneHourLater = new Date("2024-01-01T11:00:00");
  const twoHoursLater = new Date("2024-01-01T12:00:00");
  const spaceId = "space-123";
  const venueId = "venue-123";
  const now = new Date();

  const createBaseRule = (
    overrides: Partial<PaymentRule> = {},
  ): PaymentRule => ({
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
    });

    it("should handle rules with no pricing information", () => {
      const rules: PaymentRule[] = [createBaseRule()];

      const result = runPaymentRules(rules, baseDate, oneHourLater, spaceId);
      expect(result.requiresPayment).toBe(false);
      expect(result.totalCost).toBe(0);
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
});
