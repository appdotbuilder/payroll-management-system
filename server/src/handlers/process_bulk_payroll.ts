import { db } from '../db';
import { 
  employeesTable, 
  payrollPeriodsTable, 
  payrollRecordsTable, 
  payrollDetailsTable,
  employeeSalaryComponentsTable,
  salaryComponentsTable
} from '../db/schema';
import { type PayrollRecord } from '../schema';
import { eq, and, notExists } from 'drizzle-orm';

export async function processBulkPayroll(periodId: number): Promise<PayrollRecord[]> {
  try {
    // Validate that the payroll period exists and is not closed
    const periods = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, periodId))
      .execute();

    if (periods.length === 0) {
      throw new Error('Payroll period not found');
    }

    const period = periods[0];
    if (period.is_closed) {
      throw new Error('Cannot process payroll for a closed period');
    }

    // Get all employees who don't already have payroll records for this period
    const eligibleEmployees = await db.select()
      .from(employeesTable)
      .where(
        notExists(
          db.select()
            .from(payrollRecordsTable)
            .where(
              and(
                eq(payrollRecordsTable.employee_id, employeesTable.id),
                eq(payrollRecordsTable.payroll_period_id, periodId)
              )
            )
        )
      )
      .execute();

    const payrollRecords: PayrollRecord[] = [];

    // Process payroll for each eligible employee
    for (const employee of eligibleEmployees) {
      // Get employee's salary components
      const salaryComponents = await db.select({
        component_id: employeeSalaryComponentsTable.salary_component_id,
        amount: employeeSalaryComponentsTable.amount,
        type: salaryComponentsTable.type,
        name: salaryComponentsTable.name
      })
      .from(employeeSalaryComponentsTable)
      .innerJoin(
        salaryComponentsTable,
        eq(employeeSalaryComponentsTable.salary_component_id, salaryComponentsTable.id)
      )
      .where(eq(employeeSalaryComponentsTable.employee_id, employee.id))
      .execute();

      // Calculate salary totals
      let baseSalary = 0;
      let totalAllowances = 0;
      let totalDeductions = 0;

      for (const component of salaryComponents) {
        const amount = parseFloat(component.amount);
        switch (component.type) {
          case 'base_salary':
            baseSalary += amount;
            break;
          case 'allowance':
            totalAllowances += amount;
            break;
          case 'deduction':
            totalDeductions += amount;
            break;
        }
      }

      // Calculate gross and net salary
      const grossSalary = baseSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      // Create payroll record
      const payrollRecordResult = await db.insert(payrollRecordsTable)
        .values({
          employee_id: employee.id,
          payroll_period_id: periodId,
          base_salary: baseSalary.toString(),
          total_allowances: totalAllowances.toString(),
          total_deductions: totalDeductions.toString(),
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: null,
          gross_salary: grossSalary.toString(),
          net_salary: netSalary.toString()
        })
        .returning()
        .execute();

      const payrollRecord = payrollRecordResult[0];

      // Create payroll details for each salary component
      for (const component of salaryComponents) {
        await db.insert(payrollDetailsTable)
          .values({
            payroll_record_id: payrollRecord.id,
            salary_component_id: component.component_id,
            amount: component.amount
          })
          .execute();
      }

      // Convert numeric fields back to numbers for return
      const processedRecord: PayrollRecord = {
        ...payrollRecord,
        base_salary: parseFloat(payrollRecord.base_salary),
        total_allowances: parseFloat(payrollRecord.total_allowances),
        total_deductions: parseFloat(payrollRecord.total_deductions),
        overtime_hours: payrollRecord.overtime_hours ? parseFloat(payrollRecord.overtime_hours) : null,
        overtime_amount: payrollRecord.overtime_amount ? parseFloat(payrollRecord.overtime_amount) : null,
        bonus_amount: payrollRecord.bonus_amount ? parseFloat(payrollRecord.bonus_amount) : null,
        gross_salary: parseFloat(payrollRecord.gross_salary),
        net_salary: parseFloat(payrollRecord.net_salary)
      };

      payrollRecords.push(processedRecord);
    }

    return payrollRecords;
  } catch (error) {
    console.error('Bulk payroll processing failed:', error);
    throw error;
  }
}