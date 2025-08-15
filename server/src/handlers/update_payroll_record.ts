import { db } from '../db';
import { payrollRecordsTable, payrollPeriodsTable } from '../db/schema';
import { type UpdatePayrollRecordInput, type PayrollRecord } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updatePayrollRecord = async (input: UpdatePayrollRecordInput): Promise<PayrollRecord> => {
  try {
    // First, get the current payroll record with its period to validate
    const currentRecord = await db.select({
      payrollRecord: payrollRecordsTable,
      period: payrollPeriodsTable
    })
    .from(payrollRecordsTable)
    .innerJoin(payrollPeriodsTable, eq(payrollRecordsTable.payroll_period_id, payrollPeriodsTable.id))
    .where(eq(payrollRecordsTable.id, input.id))
    .execute();

    if (currentRecord.length === 0) {
      throw new Error(`Payroll record with id ${input.id} not found`);
    }

    const record = currentRecord[0].payrollRecord;
    const period = currentRecord[0].period;

    // Validate that the payroll period is not closed
    if (period.is_closed) {
      throw new Error('Cannot update payroll record for a closed period');
    }

    // Prepare update values - only update fields that are provided
    const updateValues: any = {};
    
    if (input.overtime_hours !== undefined) {
      updateValues.overtime_hours = input.overtime_hours?.toString() || null;
    }
    if (input.overtime_amount !== undefined) {
      updateValues.overtime_amount = input.overtime_amount?.toString() || null;
    }
    if (input.bonus_amount !== undefined) {
      updateValues.bonus_amount = input.bonus_amount?.toString() || null;
    }
    if (input.attendance_days !== undefined) {
      updateValues.attendance_days = input.attendance_days;
    }

    // Get current values for calculation, using input values if provided
    const overtimeAmount = input.overtime_amount !== undefined 
      ? input.overtime_amount 
      : (record.overtime_amount ? parseFloat(record.overtime_amount) : 0);
    
    const bonusAmount = input.bonus_amount !== undefined 
      ? input.bonus_amount 
      : (record.bonus_amount ? parseFloat(record.bonus_amount) : 0);

    // Recalculate gross and net salary
    const baseSalary = parseFloat(record.base_salary);
    const totalAllowances = parseFloat(record.total_allowances);
    const totalDeductions = parseFloat(record.total_deductions);
    
    const grossSalary = baseSalary + totalAllowances + (overtimeAmount || 0) + (bonusAmount || 0);
    const netSalary = grossSalary - totalDeductions;

    // Add calculated fields to update values
    updateValues.gross_salary = grossSalary.toString();
    updateValues.net_salary = netSalary.toString();
    updateValues.updated_at = new Date();

    // Update the record
    const result = await db.update(payrollRecordsTable)
      .set(updateValues)
      .where(eq(payrollRecordsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedRecord = result[0];
    return {
      ...updatedRecord,
      base_salary: parseFloat(updatedRecord.base_salary),
      total_allowances: parseFloat(updatedRecord.total_allowances),
      total_deductions: parseFloat(updatedRecord.total_deductions),
      overtime_hours: updatedRecord.overtime_hours ? parseFloat(updatedRecord.overtime_hours) : null,
      overtime_amount: updatedRecord.overtime_amount ? parseFloat(updatedRecord.overtime_amount) : null,
      bonus_amount: updatedRecord.bonus_amount ? parseFloat(updatedRecord.bonus_amount) : null,
      gross_salary: parseFloat(updatedRecord.gross_salary),
      net_salary: parseFloat(updatedRecord.net_salary)
    };
  } catch (error) {
    console.error('Payroll record update failed:', error);
    throw error;
  }
};