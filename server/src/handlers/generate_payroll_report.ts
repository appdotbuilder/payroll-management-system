import { db } from '../db';
import { employeesTable, payrollRecordsTable, payrollPeriodsTable } from '../db/schema';
import { type GenerateReportInput, type PayrollReportSummary } from '../schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';

export async function generatePayrollReport(input: GenerateReportInput): Promise<PayrollReportSummary[]> {
  try {
    // Build base query step by step to maintain proper type inference
    let baseQuery = db.select({
      department: employeesTable.department,
      employee_count: sql<string>`count(distinct ${employeesTable.id})`.as('employee_count'),
      total_gross_salary: sql<string>`sum(${payrollRecordsTable.gross_salary})`.as('total_gross_salary'),
      total_net_salary: sql<string>`sum(${payrollRecordsTable.net_salary})`.as('total_net_salary'),
      total_allowances: sql<string>`sum(${payrollRecordsTable.total_allowances})`.as('total_allowances'),
      total_deductions: sql<string>`sum(${payrollRecordsTable.total_deductions})`.as('total_deductions')
    })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employee_id, employeesTable.id))
    .innerJoin(payrollPeriodsTable, eq(payrollRecordsTable.payroll_period_id, payrollPeriodsTable.id));

    // Build filter conditions
    const conditions: SQL<unknown>[] = [];
    
    // Filter by year and month
    conditions.push(eq(payrollPeriodsTable.year, input.year));
    conditions.push(eq(payrollPeriodsTable.month, input.month));
    
    // Filter by department if specified
    if (input.department) {
      conditions.push(eq(employeesTable.department, input.department));
    }

    // Apply where clause and complete query
    const query = baseQuery
      .where(and(...conditions))
      .groupBy(employeesTable.department);
    
    const results = await query.execute();

    // Convert all numeric string fields back to numbers and return
    return results.map(result => ({
      department: result.department,
      employee_count: parseInt(result.employee_count || '0', 10),
      total_gross_salary: parseFloat(result.total_gross_salary || '0'),
      total_net_salary: parseFloat(result.total_net_salary || '0'),
      total_allowances: parseFloat(result.total_allowances || '0'),
      total_deductions: parseFloat(result.total_deductions || '0')
    }));
  } catch (error) {
    console.error('Payroll report generation failed:', error);
    throw error;
  }
}