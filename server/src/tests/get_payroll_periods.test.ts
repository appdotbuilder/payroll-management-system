import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { type CreatePayrollPeriodInput } from '../schema';
import { getPayrollPeriods } from '../handlers/get_payroll_periods';
import { eq } from 'drizzle-orm';

// Test data for payroll periods
const testPeriods: CreatePayrollPeriodInput[] = [
  {
    year: 2024,
    month: 3,
    period_start: new Date('2024-03-01'),
    period_end: new Date('2024-03-31')
  },
  {
    year: 2024,
    month: 1,
    period_start: new Date('2024-01-01'),
    period_end: new Date('2024-01-31')
  },
  {
    year: 2023,
    month: 12,
    period_start: new Date('2023-12-01'),
    period_end: new Date('2023-12-31')
  }
];

describe('getPayrollPeriods', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payroll periods exist', async () => {
    const result = await getPayrollPeriods();
    expect(result).toEqual([]);
  });

  it('should fetch all payroll periods', async () => {
    // Create test data
    await db.insert(payrollPeriodsTable)
      .values(testPeriods)
      .execute();

    const result = await getPayrollPeriods();

    // Should return all periods
    expect(result).toHaveLength(3);
    
    // Verify basic structure
    result.forEach(period => {
      expect(period.id).toBeDefined();
      expect(typeof period.year).toBe('number');
      expect(typeof period.month).toBe('number');
      expect(period.period_start).toBeInstanceOf(Date);
      expect(period.period_end).toBeInstanceOf(Date);
      expect(typeof period.is_closed).toBe('boolean');
      expect(period.created_at).toBeInstanceOf(Date);
      expect(period.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return periods ordered by year and month (most recent first)', async () => {
    // Create test data
    await db.insert(payrollPeriodsTable)
      .values(testPeriods)
      .execute();

    const result = await getPayrollPeriods();

    // Verify ordering: 2024-03, 2024-01, 2023-12
    expect(result[0].year).toBe(2024);
    expect(result[0].month).toBe(3);
    
    expect(result[1].year).toBe(2024);
    expect(result[1].month).toBe(1);
    
    expect(result[2].year).toBe(2023);
    expect(result[2].month).toBe(12);
  });

  it('should handle mixed years and months correctly', async () => {
    // Create periods with mixed ordering
    const mixedPeriods = [
      {
        year: 2023,
        month: 6,
        period_start: new Date('2023-06-01'),
        period_end: new Date('2023-06-30')
      },
      {
        year: 2024,
        month: 2,
        period_start: new Date('2024-02-01'),
        period_end: new Date('2024-02-29')
      },
      {
        year: 2023,
        month: 11,
        period_start: new Date('2023-11-01'),
        period_end: new Date('2023-11-30')
      }
    ];

    await db.insert(payrollPeriodsTable)
      .values(mixedPeriods)
      .execute();

    const result = await getPayrollPeriods();

    // Should be ordered: 2024-02, 2023-11, 2023-06
    expect(result[0].year).toBe(2024);
    expect(result[0].month).toBe(2);
    
    expect(result[1].year).toBe(2023);
    expect(result[1].month).toBe(11);
    
    expect(result[2].year).toBe(2023);
    expect(result[2].month).toBe(6);
  });

  it('should return correct period properties', async () => {
    // Create single period with all properties
    const periodData = {
      year: 2024,
      month: 5,
      period_start: new Date('2024-05-01T00:00:00Z'),
      period_end: new Date('2024-05-31T23:59:59Z')
    };

    await db.insert(payrollPeriodsTable)
      .values([periodData])
      .execute();

    const result = await getPayrollPeriods();
    const period = result[0];

    expect(period.year).toBe(2024);
    expect(period.month).toBe(5);
    expect(period.period_start).toEqual(new Date('2024-05-01T00:00:00Z'));
    expect(period.period_end).toEqual(new Date('2024-05-31T23:59:59Z'));
    expect(period.is_closed).toBe(false); // Default value
  });

  it('should handle closed periods correctly', async () => {
    // Insert period and then update to closed
    const result = await db.insert(payrollPeriodsTable)
      .values([{
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      }])
      .returning()
      .execute();

    const periodId = result[0].id;

    // Update period to closed using proper Drizzle syntax
    await db.update(payrollPeriodsTable)
      .set({ is_closed: true })
      .where(eq(payrollPeriodsTable.id, periodId))
      .execute();

    const periods = await getPayrollPeriods();
    
    expect(periods[0].is_closed).toBe(true);
  });
})