import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { type PayrollPeriod } from '../schema';
import { eq } from 'drizzle-orm';

export async function closePayrollPeriod(periodId: number): Promise<PayrollPeriod> {
  try {
    // First, check if the period exists and get current state
    const existingPeriod = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, periodId))
      .execute();

    if (existingPeriod.length === 0) {
      throw new Error(`Payroll period with id ${periodId} not found`);
    }

    const period = existingPeriod[0];

    // Check if period is already closed
    if (period.is_closed) {
      throw new Error(`Payroll period ${periodId} is already closed`);
    }

    // Update the period to closed status
    const result = await db.update(payrollPeriodsTable)
      .set({
        is_closed: true,
        updated_at: new Date()
      })
      .where(eq(payrollPeriodsTable.id, periodId))
      .returning()
      .execute();

    const updatedPeriod = result[0];

    // Return the updated period with proper type conversions
    return {
      ...updatedPeriod,
      year: updatedPeriod.year,
      month: updatedPeriod.month,
      is_closed: updatedPeriod.is_closed,
      period_start: updatedPeriod.period_start,
      period_end: updatedPeriod.period_end,
      created_at: updatedPeriod.created_at,
      updated_at: updatedPeriod.updated_at
    };
  } catch (error) {
    console.error('Close payroll period failed:', error);
    throw error;
  }
}