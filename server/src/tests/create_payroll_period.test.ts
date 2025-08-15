import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { type CreatePayrollPeriodInput } from '../schema';
import { createPayrollPeriod } from '../handlers/create_payroll_period';
import { eq } from 'drizzle-orm';

// Test input for January 2024
const testInput: CreatePayrollPeriodInput = {
  year: 2024,
  month: 1,
  period_start: new Date('2024-01-01'),
  period_end: new Date('2024-01-31')
};

describe('createPayrollPeriod', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a payroll period', async () => {
    const result = await createPayrollPeriod(testInput);

    // Basic field validation
    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(1);
    expect(result.period_start).toEqual(testInput.period_start);
    expect(result.period_end).toEqual(testInput.period_end);
    expect(result.is_closed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payroll period to database', async () => {
    const result = await createPayrollPeriod(testInput);

    // Query the database to verify the record was saved
    const periods = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, result.id))
      .execute();

    expect(periods).toHaveLength(1);
    expect(periods[0].year).toEqual(2024);
    expect(periods[0].month).toEqual(1);
    expect(periods[0].period_start).toEqual(testInput.period_start);
    expect(periods[0].period_end).toEqual(testInput.period_end);
    expect(periods[0].is_closed).toEqual(false);
    expect(periods[0].created_at).toBeInstanceOf(Date);
    expect(periods[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject period where start date is after end date', async () => {
    const invalidInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-31'),
      period_end: new Date('2024-01-01') // End before start
    };

    await expect(createPayrollPeriod(invalidInput))
      .rejects
      .toThrow(/period start date must be before period end date/i);
  });

  it('should reject period where start date equals end date', async () => {
    const invalidInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-15'),
      period_end: new Date('2024-01-15') // Same date
    };

    await expect(createPayrollPeriod(invalidInput))
      .rejects
      .toThrow(/period start date must be before period end date/i);
  });

  it('should reject overlapping periods - new period starts within existing', async () => {
    // Create first period: Jan 1-31
    await createPayrollPeriod(testInput);

    // Try to create overlapping period: Jan 15 - Feb 15
    const overlappingInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-15'),
      period_end: new Date('2024-02-15')
    };

    await expect(createPayrollPeriod(overlappingInput))
      .rejects
      .toThrow(/payroll period overlaps with existing period/i);
  });

  it('should reject overlapping periods - new period ends within existing', async () => {
    // Create first period: Jan 1-31
    await createPayrollPeriod(testInput);

    // Try to create overlapping period: Dec 15 - Jan 15
    const overlappingInput: CreatePayrollPeriodInput = {
      year: 2023,
      month: 12,
      period_start: new Date('2023-12-15'),
      period_end: new Date('2024-01-15')
    };

    await expect(createPayrollPeriod(overlappingInput))
      .rejects
      .toThrow(/payroll period overlaps with existing period/i);
  });

  it('should reject overlapping periods - new period completely contains existing', async () => {
    // Create first period: Jan 15-25 (small period)
    const smallPeriodInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-15'),
      period_end: new Date('2024-01-25')
    };
    await createPayrollPeriod(smallPeriodInput);

    // Try to create larger overlapping period: Jan 1 - Jan 31 (contains existing)
    await expect(createPayrollPeriod(testInput))
      .rejects
      .toThrow(/payroll period overlaps with existing period/i);
  });

  it('should allow adjacent non-overlapping periods', async () => {
    // Create first period: Jan 1-31
    await createPayrollPeriod(testInput);

    // Create adjacent period: Feb 1-28 (no overlap)
    const adjacentInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 2,
      period_start: new Date('2024-02-01'),
      period_end: new Date('2024-02-28')
    };

    const result = await createPayrollPeriod(adjacentInput);
    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(2);
    expect(result.period_start).toEqual(adjacentInput.period_start);
    expect(result.period_end).toEqual(adjacentInput.period_end);

    // Verify both periods exist in database
    const allPeriods = await db.select()
      .from(payrollPeriodsTable)
      .execute();

    expect(allPeriods).toHaveLength(2);
  });

  it('should allow periods with same year/month but different date ranges', async () => {
    // Create first period: Jan 1-15
    const firstHalfInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-01-15')
    };
    await createPayrollPeriod(firstHalfInput);

    // Create second period: Jan 16-31 (same month, no overlap)
    const secondHalfInput: CreatePayrollPeriodInput = {
      year: 2024,
      month: 1,
      period_start: new Date('2024-01-16'),
      period_end: new Date('2024-01-31')
    };

    const result = await createPayrollPeriod(secondHalfInput);
    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(1);

    // Verify both periods exist
    const januaryPeriods = await db.select()
      .from(payrollPeriodsTable)
      .execute();

    expect(januaryPeriods).toHaveLength(2);
  });
});