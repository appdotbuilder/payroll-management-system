import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { closePayrollPeriod } from '../handlers/close_payroll_period';
import { eq } from 'drizzle-orm';

describe('closePayrollPeriod', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should close an open payroll period', async () => {
    // Create test payroll period
    const testPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 3,
        period_start: new Date('2024-03-01'),
        period_end: new Date('2024-03-31'),
        is_closed: false
      })
      .returning()
      .execute();

    const periodId = testPeriod[0].id;

    // Close the period
    const result = await closePayrollPeriod(periodId);

    // Verify the result
    expect(result.id).toEqual(periodId);
    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(3);
    expect(result.is_closed).toBe(true);
    expect(result.period_start).toBeInstanceOf(Date);
    expect(result.period_end).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the database record correctly', async () => {
    // Create test payroll period
    const testPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 4,
        period_start: new Date('2024-04-01'),
        period_end: new Date('2024-04-30'),
        is_closed: false
      })
      .returning()
      .execute();

    const periodId = testPeriod[0].id;
    const originalUpdatedAt = testPeriod[0].updated_at;

    // Close the period
    await closePayrollPeriod(periodId);

    // Query the database to verify the update
    const updatedPeriod = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, periodId))
      .execute();

    expect(updatedPeriod).toHaveLength(1);
    expect(updatedPeriod[0].is_closed).toBe(true);
    expect(updatedPeriod[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when period does not exist', async () => {
    const nonExistentId = 99999;

    await expect(closePayrollPeriod(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should throw error when period is already closed', async () => {
    // Create already closed payroll period
    const testPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 5,
        period_start: new Date('2024-05-01'),
        period_end: new Date('2024-05-31'),
        is_closed: true
      })
      .returning()
      .execute();

    const periodId = testPeriod[0].id;

    await expect(closePayrollPeriod(periodId)).rejects.toThrow(/already closed/i);
  });

  it('should preserve all period data when closing', async () => {
    // Create test payroll period with specific data
    const periodStart = new Date('2024-06-01');
    const periodEnd = new Date('2024-06-30');
    
    const testPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 6,
        period_start: periodStart,
        period_end: periodEnd,
        is_closed: false
      })
      .returning()
      .execute();

    const periodId = testPeriod[0].id;
    const originalCreatedAt = testPeriod[0].created_at;

    // Close the period
    const result = await closePayrollPeriod(periodId);

    // Verify all original data is preserved
    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(6);
    expect(result.period_start.getTime()).toEqual(periodStart.getTime());
    expect(result.period_end.getTime()).toEqual(periodEnd.getTime());
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result.is_closed).toBe(true);
  });
});