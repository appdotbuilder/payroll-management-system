import { db } from '../db';
import { 
  payrollRecordsTable, 
  employeesTable, 
  payrollPeriodsTable,
  payrollDetailsTable,
  salaryComponentsTable
} from '../db/schema';
import { type PayrollRecordWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPayrollRecordWithDetails(recordId: number): Promise<PayrollRecordWithDetails | null> {
  try {
    // Fetch the main payroll record with employee and period info
    const mainResults = await db.select()
      .from(payrollRecordsTable)
      .innerJoin(employeesTable, eq(payrollRecordsTable.employee_id, employeesTable.id))
      .innerJoin(payrollPeriodsTable, eq(payrollRecordsTable.payroll_period_id, payrollPeriodsTable.id))
      .where(eq(payrollRecordsTable.id, recordId))
      .execute();

    if (mainResults.length === 0) {
      return null;
    }

    const mainResult = mainResults[0];

    // Fetch payroll details with salary components
    const detailResults = await db.select()
      .from(payrollDetailsTable)
      .innerJoin(salaryComponentsTable, eq(payrollDetailsTable.salary_component_id, salaryComponentsTable.id))
      .where(eq(payrollDetailsTable.payroll_record_id, recordId))
      .execute();

    // Convert numeric fields from strings to numbers
    const record = {
      ...mainResult.payroll_records,
      base_salary: parseFloat(mainResult.payroll_records.base_salary),
      total_allowances: parseFloat(mainResult.payroll_records.total_allowances),
      total_deductions: parseFloat(mainResult.payroll_records.total_deductions),
      overtime_hours: mainResult.payroll_records.overtime_hours ? parseFloat(mainResult.payroll_records.overtime_hours) : null,
      overtime_amount: mainResult.payroll_records.overtime_amount ? parseFloat(mainResult.payroll_records.overtime_amount) : null,
      bonus_amount: mainResult.payroll_records.bonus_amount ? parseFloat(mainResult.payroll_records.bonus_amount) : null,
      gross_salary: parseFloat(mainResult.payroll_records.gross_salary),
      net_salary: parseFloat(mainResult.payroll_records.net_salary)
    };

    const employee = mainResult.employees;
    const period = mainResult.payroll_periods;

    const details = detailResults.map(detail => ({
      component: detail.salary_components,
      amount: parseFloat(detail.payroll_details.amount)
    }));

    return {
      record,
      employee,
      period,
      details
    };
  } catch (error) {
    console.error('Failed to fetch payroll record with details:', error);
    throw error;
  }
}