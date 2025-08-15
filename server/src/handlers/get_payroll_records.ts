import { db } from '../db';
import { payrollRecordsTable, employeesTable } from '../db/schema';
import { type PayrollRecord } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getPayrollRecords(periodId?: number): Promise<PayrollRecord[]> {
  try {
    // Build base query with employee join for ordering
    const baseQuery = db.select({
      id: payrollRecordsTable.id,
      employee_id: payrollRecordsTable.employee_id,
      payroll_period_id: payrollRecordsTable.payroll_period_id,
      base_salary: payrollRecordsTable.base_salary,
      total_allowances: payrollRecordsTable.total_allowances,
      total_deductions: payrollRecordsTable.total_deductions,
      overtime_hours: payrollRecordsTable.overtime_hours,
      overtime_amount: payrollRecordsTable.overtime_amount,
      bonus_amount: payrollRecordsTable.bonus_amount,
      attendance_days: payrollRecordsTable.attendance_days,
      gross_salary: payrollRecordsTable.gross_salary,
      net_salary: payrollRecordsTable.net_salary,
      created_at: payrollRecordsTable.created_at,
      updated_at: payrollRecordsTable.updated_at,
    })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employee_id, employeesTable.id));

    // Apply period filter and ordering in one go
    const query = periodId !== undefined 
      ? baseQuery
          .where(eq(payrollRecordsTable.payroll_period_id, periodId))
          .orderBy(asc(employeesTable.full_name))
      : baseQuery.orderBy(asc(employeesTable.full_name));

    const results = await query.execute();

    // Convert numeric fields to numbers and handle nullable fields
    return results.map(record => ({
      id: record.id,
      employee_id: record.employee_id,
      payroll_period_id: record.payroll_period_id,
      base_salary: parseFloat(record.base_salary),
      total_allowances: parseFloat(record.total_allowances),
      total_deductions: parseFloat(record.total_deductions),
      overtime_hours: record.overtime_hours ? parseFloat(record.overtime_hours) : null,
      overtime_amount: record.overtime_amount ? parseFloat(record.overtime_amount) : null,
      bonus_amount: record.bonus_amount ? parseFloat(record.bonus_amount) : null,
      attendance_days: record.attendance_days,
      gross_salary: parseFloat(record.gross_salary),
      net_salary: parseFloat(record.net_salary),
      created_at: record.created_at,
      updated_at: record.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch payroll records:', error);
    throw error;
  }
}