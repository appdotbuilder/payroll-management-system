import { db } from '../db';
import { 
  employeesTable, 
  payrollPeriodsTable, 
  employeeSalaryComponentsTable, 
  salaryComponentsTable,
  payrollRecordsTable,
  payrollDetailsTable
} from '../db/schema';
import { type CreatePayrollRecordInput, type PayrollRecord } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createPayrollRecord(input: CreatePayrollRecordInput): Promise<PayrollRecord> {
  try {
    // Validate that employee exists
    const employee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error(`Employee with id ${input.employee_id} not found`);
    }

    // Validate that payroll period exists and is not closed
    const period = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, input.payroll_period_id))
      .execute();

    if (period.length === 0) {
      throw new Error(`Payroll period with id ${input.payroll_period_id} not found`);
    }

    if (period[0].is_closed) {
      throw new Error('Cannot create payroll record for closed period');
    }

    // Check if payroll record already exists for this employee and period
    const existingRecord = await db.select()
      .from(payrollRecordsTable)
      .where(and(
        eq(payrollRecordsTable.employee_id, input.employee_id),
        eq(payrollRecordsTable.payroll_period_id, input.payroll_period_id)
      ))
      .execute();

    if (existingRecord.length > 0) {
      throw new Error('Payroll record already exists for this employee and period');
    }

    // Get employee's salary components with amounts
    const salaryComponents = await db.select({
      id: salaryComponentsTable.id,
      name: salaryComponentsTable.name,
      type: salaryComponentsTable.type,
      amount: employeeSalaryComponentsTable.amount
    })
      .from(employeeSalaryComponentsTable)
      .innerJoin(salaryComponentsTable, eq(employeeSalaryComponentsTable.salary_component_id, salaryComponentsTable.id))
      .where(eq(employeeSalaryComponentsTable.employee_id, input.employee_id))
      .execute();

    // Calculate salary totals
    let base_salary = 0;
    let total_allowances = 0;
    let total_deductions = 0;

    for (const component of salaryComponents) {
      const amount = parseFloat(component.amount);
      
      switch (component.type) {
        case 'base_salary':
          base_salary += amount;
          break;
        case 'allowance':
          total_allowances += amount;
          break;
        case 'deduction':
          total_deductions += amount;
          break;
      }
    }

    // Calculate gross and net salary
    const overtime_amount = input.overtime_amount || 0;
    const bonus_amount = input.bonus_amount || 0;
    const gross_salary = base_salary + total_allowances + overtime_amount + bonus_amount;
    const net_salary = gross_salary - total_deductions;

    // Insert payroll record
    const payrollRecordResult = await db.insert(payrollRecordsTable)
      .values({
        employee_id: input.employee_id,
        payroll_period_id: input.payroll_period_id,
        base_salary: base_salary.toString(),
        total_allowances: total_allowances.toString(),
        total_deductions: total_deductions.toString(),
        overtime_hours: input.overtime_hours?.toString() || null,
        overtime_amount: input.overtime_amount?.toString() || null,
        bonus_amount: input.bonus_amount?.toString() || null,
        attendance_days: input.attendance_days,
        gross_salary: gross_salary.toString(),
        net_salary: net_salary.toString()
      })
      .returning()
      .execute();

    const payrollRecord = payrollRecordResult[0];

    // Create payroll details for each salary component
    const payrollDetailsData = salaryComponents.map(component => ({
      payroll_record_id: payrollRecord.id,
      salary_component_id: component.id,
      amount: component.amount
    }));

    if (payrollDetailsData.length > 0) {
      await db.insert(payrollDetailsTable)
        .values(payrollDetailsData)
        .execute();
    }

    // Convert numeric fields back to numbers for return
    return {
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
  } catch (error) {
    console.error('Payroll record creation failed:', error);
    throw error;
  }
}