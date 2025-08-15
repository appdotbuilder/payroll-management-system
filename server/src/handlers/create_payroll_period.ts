import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { type CreatePayrollPeriodInput, type PayrollPeriod } from '../schema';
import { or, and, lte, gte } from 'drizzle-orm';

export const createPayrollPeriod = async (input: CreatePayrollPeriodInput): Promise<PayrollPeriod> => {
  try {
    // Validate that period_start is before period_end
    if (input.period_start >= input.period_end) {
      throw new Error('Period start date must be before period end date');
    }

    // Check for overlapping periods
    const existingPeriods = await db.select()
      .from(payrollPeriodsTable)
      .where(
        or(
          // New period starts within an existing period
          and(
            lte(payrollPeriodsTable.period_start, input.period_start),
            gte(payrollPeriodsTable.period_end, input.period_start)
          ),
          // New period ends within an existing period
          and(
            lte(payrollPeriodsTable.period_start, input.period_end),
            gte(payrollPeriodsTable.period_end, input.period_end)
          ),
          // New period completely contains an existing period
          and(
            gte(payrollPeriodsTable.period_start, input.period_start),
            lte(payrollPeriodsTable.period_end, input.period_end)
          )
        )
      )
      .execute();

    if (existingPeriods.length > 0) {
      throw new Error('Payroll period overlaps with existing period');
    }

    // Insert the new payroll period
    const result = await db.insert(payrollPeriodsTable)
      .values({
        year: input.year,
        month: input.month,
        period_start: input.period_start,
        period_end: input.period_end
        // is_closed defaults to false
      })
      .returning()
      .execute();

    const payrollPeriod = result[0];
    return {
      ...payrollPeriod,
      // No numeric conversions needed as all fields are integers, booleans, or dates
    };
  } catch (error) {
    console.error('Payroll period creation failed:', error);
    throw error;
  }
};