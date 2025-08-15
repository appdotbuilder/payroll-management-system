import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  employeesTable, 
  salaryComponentsTable, 
  employeeSalaryComponentsTable,
  payrollPeriodsTable,
  payrollRecordsTable
} from '../db/schema';
import { type UpdatePayrollRecordInput } from '../schema';
import { updatePayrollRecord } from '../handlers/update_payroll_record';
import { eq } from 'drizzle-orm';

describe('updatePayrollRecord', () => {
  let testEmployeeId: number;
  let testPeriodId: number;
  let testPayrollRecordId: number;
  let closedPeriodId: number;
  let closedPayrollRecordId: number;

  beforeEach(async () => {
    await createDB();

    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Software Engineer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '1234567890',
        email: 'john.doe@company.com',
        phone: '+1234567890'
      })
      .returning()
      .execute();
    testEmployeeId = employee[0].id;

    // Create salary components
    const baseSalaryComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Base Salary',
        type: 'base_salary',
        description: 'Monthly base salary'
      })
      .returning()
      .execute();

    const allowanceComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Transport Allowance',
        type: 'allowance',
        description: 'Monthly transport allowance'
      })
      .returning()
      .execute();

    const deductionComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Tax',
        type: 'deduction',
        description: 'Income tax deduction'
      })
      .returning()
      .execute();

    // Create employee salary components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: testEmployeeId,
          salary_component_id: baseSalaryComponent[0].id,
          amount: '5000000'
        },
        {
          employee_id: testEmployeeId,
          salary_component_id: allowanceComponent[0].id,
          amount: '1000000'
        },
        {
          employee_id: testEmployeeId,
          salary_component_id: deductionComponent[0].id,
          amount: '500000'
        }
      ])
      .execute();

    // Create test payroll period (open)
    const period = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        is_closed: false
      })
      .returning()
      .execute();
    testPeriodId = period[0].id;

    // Create closed payroll period
    const closedPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2023,
        month: 12,
        period_start: new Date('2023-12-01'),
        period_end: new Date('2023-12-31'),
        is_closed: true
      })
      .returning()
      .execute();
    closedPeriodId = closedPeriod[0].id;

    // Create test payroll record (open period)
    const payrollRecord = await db.insert(payrollRecordsTable)
      .values({
        employee_id: testEmployeeId,
        payroll_period_id: testPeriodId,
        base_salary: '5000000',
        total_allowances: '1000000',
        total_deductions: '500000',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '6000000',
        net_salary: '5500000'
      })
      .returning()
      .execute();
    testPayrollRecordId = payrollRecord[0].id;

    // Create payroll record for closed period
    const closedPayrollRecord = await db.insert(payrollRecordsTable)
      .values({
        employee_id: testEmployeeId,
        payroll_period_id: closedPeriodId,
        base_salary: '5000000',
        total_allowances: '1000000',
        total_deductions: '500000',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '6000000',
        net_salary: '5500000'
      })
      .returning()
      .execute();
    closedPayrollRecordId = closedPayrollRecord[0].id;
  });

  afterEach(resetDB);

  it('should update overtime hours and amount correctly', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      overtime_hours: 10,
      overtime_amount: 500000
    };

    const result = await updatePayrollRecord(input);

    expect(result.id).toBe(testPayrollRecordId);
    expect(result.overtime_hours).toBe(10);
    expect(result.overtime_amount).toBe(500000);
    expect(result.gross_salary).toBe(6500000); // 6000000 + 500000 overtime
    expect(result.net_salary).toBe(6000000); // 6500000 - 500000 deductions
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update bonus amount correctly', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      bonus_amount: 1000000
    };

    const result = await updatePayrollRecord(input);

    expect(result.bonus_amount).toBe(1000000);
    expect(result.gross_salary).toBe(7000000); // 6000000 + 1000000 bonus
    expect(result.net_salary).toBe(6500000); // 7000000 - 500000 deductions
  });

  it('should update attendance days correctly', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      attendance_days: 20
    };

    const result = await updatePayrollRecord(input);

    expect(result.attendance_days).toBe(20);
    expect(result.gross_salary).toBe(6000000); // No change in calculation
    expect(result.net_salary).toBe(5500000);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      overtime_hours: 15,
      overtime_amount: 750000,
      bonus_amount: 500000,
      attendance_days: 21
    };

    const result = await updatePayrollRecord(input);

    expect(result.overtime_hours).toBe(15);
    expect(result.overtime_amount).toBe(750000);
    expect(result.bonus_amount).toBe(500000);
    expect(result.attendance_days).toBe(21);
    expect(result.gross_salary).toBe(7250000); // 6000000 + 750000 + 500000
    expect(result.net_salary).toBe(6750000); // 7250000 - 500000
  });

  it('should handle null values correctly', async () => {
    // First add some values
    await updatePayrollRecord({
      id: testPayrollRecordId,
      overtime_amount: 500000,
      bonus_amount: 300000
    });

    // Then set them to null
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null
    };

    const result = await updatePayrollRecord(input);

    expect(result.overtime_hours).toBeNull();
    expect(result.overtime_amount).toBeNull();
    expect(result.bonus_amount).toBeNull();
    expect(result.gross_salary).toBe(6000000); // Back to base + allowances
    expect(result.net_salary).toBe(5500000);
  });

  it('should persist changes to database', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      overtime_amount: 400000,
      bonus_amount: 200000
    };

    await updatePayrollRecord(input);

    // Query database directly to verify persistence
    const records = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.id, testPayrollRecordId))
      .execute();

    expect(records).toHaveLength(1);
    const record = records[0];
    expect(parseFloat(record.overtime_amount!)).toBe(400000);
    expect(parseFloat(record.bonus_amount!)).toBe(200000);
    expect(parseFloat(record.gross_salary)).toBe(6600000);
    expect(parseFloat(record.net_salary)).toBe(6100000);
  });

  it('should throw error for non-existent payroll record', async () => {
    const input: UpdatePayrollRecordInput = {
      id: 99999,
      overtime_amount: 100000
    };

    await expect(updatePayrollRecord(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error for closed payroll period', async () => {
    const input: UpdatePayrollRecordInput = {
      id: closedPayrollRecordId,
      overtime_amount: 100000
    };

    await expect(updatePayrollRecord(input)).rejects.toThrow(/closed period/i);
  });

  it('should preserve original values when not updating specific fields', async () => {
    // First, set some initial values
    await updatePayrollRecord({
      id: testPayrollRecordId,
      overtime_hours: 8,
      overtime_amount: 300000,
      bonus_amount: 150000,
      attendance_days: 20
    });

    // Update only bonus amount
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      bonus_amount: 250000
    };

    const result = await updatePayrollRecord(input);

    // These should remain unchanged
    expect(result.overtime_hours).toBe(8);
    expect(result.overtime_amount).toBe(300000);
    expect(result.attendance_days).toBe(20);
    
    // This should be updated
    expect(result.bonus_amount).toBe(250000);
    expect(result.gross_salary).toBe(6550000); // 6000000 + 300000 + 250000
  });

  it('should handle zero values correctly', async () => {
    const input: UpdatePayrollRecordInput = {
      id: testPayrollRecordId,
      overtime_hours: 0,
      overtime_amount: 0,
      bonus_amount: 0,
      attendance_days: 0
    };

    const result = await updatePayrollRecord(input);

    expect(result.overtime_hours).toBe(0);
    expect(result.overtime_amount).toBe(0);
    expect(result.bonus_amount).toBe(0);
    expect(result.attendance_days).toBe(0);
    expect(result.gross_salary).toBe(6000000); // Base + allowances only
    expect(result.net_salary).toBe(5500000);
  });
});