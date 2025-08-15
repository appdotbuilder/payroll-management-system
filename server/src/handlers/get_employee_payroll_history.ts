import { db } from '../db';
import { payrollRecordsTable, payrollPeriodsTable } from '../db/schema';
import { type PayrollRecord } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getEmployeePayrollHistory(employeeId: number): Promise<PayrollRecord[]> {
  try {
    // Query payroll records for the employee with period information
    // Join with payroll periods to enable ordering by period
    const results = await db.select()
      .from(payrollRecordsTable)
      .innerJoin(payrollPeriodsTable, eq(payrollRecordsTable.payroll_period_id, payrollPeriodsTable.id))
      .where(eq(payrollRecordsTable.employee_id, employeeId))
      .orderBy(
        desc(payrollPeriodsTable.year),
        desc(payrollPeriodsTable.month),
        desc(payrollRecordsTable.created_at)
      )
      .execute();

    // Transform the joined results back to PayrollRecord format
    // Convert numeric fields from strings to numbers
    return results.map(result => ({
      id: result.payroll_records.id,
      employee_id: result.payroll_records.employee_id,
      payroll_period_id: result.payroll_records.payroll_period_id,
      base_salary: parseFloat(result.payroll_records.base_salary),
      total_allowances: parseFloat(result.payroll_records.total_allowances),
      total_deductions: parseFloat(result.payroll_records.total_deductions),
      overtime_hours: result.payroll_records.overtime_hours ? parseFloat(result.payroll_records.overtime_hours) : null,
      overtime_amount: result.payroll_records.overtime_amount ? parseFloat(result.payroll_records.overtime_amount) : null,
      bonus_amount: result.payroll_records.bonus_amount ? parseFloat(result.payroll_records.bonus_amount) : null,
      attendance_days: result.payroll_records.attendance_days,
      gross_salary: parseFloat(result.payroll_records.gross_salary),
      net_salary: parseFloat(result.payroll_records.net_salary),
      created_at: result.payroll_records.created_at,
      updated_at: result.payroll_records.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch employee payroll history:', error);
    throw error;
  }
}