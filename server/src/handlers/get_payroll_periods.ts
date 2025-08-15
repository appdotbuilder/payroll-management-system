import { db } from '../db';
import { payrollPeriodsTable } from '../db/schema';
import { type PayrollPeriod } from '../schema';
import { desc } from 'drizzle-orm';

export async function getPayrollPeriods(): Promise<PayrollPeriod[]> {
  try {
    // Fetch all payroll periods ordered by year and month (most recent first)
    const results = await db.select()
      .from(payrollPeriodsTable)
      .orderBy(desc(payrollPeriodsTable.year), desc(payrollPeriodsTable.month))
      .execute();

    // Convert numeric fields back to numbers for return
    return results.map(period => ({
      ...period,
      // Convert all numeric fields to numbers (numeric columns are returned as strings from DB)
      // Note: No numeric fields in payroll periods table, all are already proper types
      // Just return as-is since all fields are already in correct format
      ...period
    }));
  } catch (error) {
    console.error('Failed to fetch payroll periods:', error);
    throw error;
  }
}