import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  employeesTable, 
  salaryComponentsTable, 
  employeeSalaryComponentsTable,
  payrollPeriodsTable,
  payrollRecordsTable,
  payrollDetailsTable
} from '../db/schema';
import { type CreatePayrollRecordInput } from '../schema';
import { createPayrollRecord } from '../handlers/create_payroll_record';
import { eq, and } from 'drizzle-orm';

describe('createPayrollRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  async function setupTestData() {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
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

    // Create payroll period
    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        is_closed: false
      })
      .returning()
      .execute();

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
        name: 'Tax Deduction',
        type: 'deduction',
        description: 'Monthly tax deduction'
      })
      .returning()
      .execute();

    // Assign salary components to employee
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employeeResult[0].id,
          salary_component_id: baseSalaryComponent[0].id,
          amount: '5000000'
        },
        {
          employee_id: employeeResult[0].id,
          salary_component_id: allowanceComponent[0].id,
          amount: '1000000'
        },
        {
          employee_id: employeeResult[0].id,
          salary_component_id: deductionComponent[0].id,
          amount: '500000'
        }
      ])
      .execute();

    return {
      employee: employeeResult[0],
      period: periodResult[0],
      components: {
        baseSalary: baseSalaryComponent[0],
        allowance: allowanceComponent[0],
        deduction: deductionComponent[0]
      }
    };
  }

  it('should create a payroll record with correct calculations', async () => {
    const { employee, period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: period.id,
      overtime_hours: 10,
      overtime_amount: 200000,
      bonus_amount: 500000,
      attendance_days: 22
    };

    const result = await createPayrollRecord(input);

    // Verify basic fields
    expect(result.employee_id).toEqual(employee.id);
    expect(result.payroll_period_id).toEqual(period.id);
    expect(result.overtime_hours).toEqual(10);
    expect(result.overtime_amount).toEqual(200000);
    expect(result.bonus_amount).toEqual(500000);
    expect(result.attendance_days).toEqual(22);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify calculated amounts
    expect(result.base_salary).toEqual(5000000); // Base salary component
    expect(result.total_allowances).toEqual(1000000); // Transport allowance
    expect(result.total_deductions).toEqual(500000); // Tax deduction
    expect(result.gross_salary).toEqual(6700000); // 5000000 + 1000000 + 200000 + 500000
    expect(result.net_salary).toEqual(6200000); // 6700000 - 500000

    // Verify numeric types
    expect(typeof result.base_salary).toBe('number');
    expect(typeof result.total_allowances).toBe('number');
    expect(typeof result.total_deductions).toBe('number');
    expect(typeof result.gross_salary).toBe('number');
    expect(typeof result.net_salary).toBe('number');
  });

  it('should create payroll record without optional fields', async () => {
    const { employee, period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: period.id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    const result = await createPayrollRecord(input);

    // Verify optional fields are null
    expect(result.overtime_hours).toBeNull();
    expect(result.overtime_amount).toBeNull();
    expect(result.bonus_amount).toBeNull();
    expect(result.attendance_days).toBeNull();

    // Verify calculations without optional amounts
    expect(result.base_salary).toEqual(5000000);
    expect(result.total_allowances).toEqual(1000000);
    expect(result.total_deductions).toEqual(500000);
    expect(result.gross_salary).toEqual(6000000); // 5000000 + 1000000 + 0 + 0
    expect(result.net_salary).toEqual(5500000); // 6000000 - 500000
  });

  it('should save payroll record to database', async () => {
    const { employee, period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: period.id,
      overtime_hours: 5,
      overtime_amount: 100000,
      bonus_amount: null,
      attendance_days: 20
    };

    const result = await createPayrollRecord(input);

    // Verify record exists in database
    const records = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].employee_id).toEqual(employee.id);
    expect(records[0].payroll_period_id).toEqual(period.id);
    expect(parseFloat(records[0].base_salary)).toEqual(5000000);
    expect(parseFloat(records[0].gross_salary)).toEqual(6100000);
    expect(parseFloat(records[0].net_salary)).toEqual(5600000);
  });

  it('should create payroll details for each salary component', async () => {
    const { employee, period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: period.id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    const result = await createPayrollRecord(input);

    // Verify payroll details were created
    const details = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.payroll_record_id, result.id))
      .execute();

    expect(details).toHaveLength(3); // Base salary, allowance, deduction

    // Verify amounts match salary components
    const detailAmounts = details.map(d => parseFloat(d.amount)).sort((a, b) => b - a);
    expect(detailAmounts).toEqual([5000000, 1000000, 500000]);
  });

  it('should throw error for non-existent employee', async () => {
    const { period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: 999,
      payroll_period_id: period.id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    await expect(createPayrollRecord(input)).rejects.toThrow(/Employee with id 999 not found/i);
  });

  it('should throw error for non-existent payroll period', async () => {
    const { employee } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: 999,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    await expect(createPayrollRecord(input)).rejects.toThrow(/Payroll period with id 999 not found/i);
  });

  it('should throw error for closed payroll period', async () => {
    const { employee } = await setupTestData();

    // Create closed payroll period
    const closedPeriodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 2,
        period_start: new Date('2024-02-01'),
        period_end: new Date('2024-02-28'),
        is_closed: true
      })
      .returning()
      .execute();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: closedPeriodResult[0].id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    await expect(createPayrollRecord(input)).rejects.toThrow(/Cannot create payroll record for closed period/i);
  });

  it('should throw error for duplicate payroll record', async () => {
    const { employee, period } = await setupTestData();

    const input: CreatePayrollRecordInput = {
      employee_id: employee.id,
      payroll_period_id: period.id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null
    };

    // Create first payroll record
    await createPayrollRecord(input);

    // Try to create duplicate
    await expect(createPayrollRecord(input)).rejects.toThrow(/Payroll record already exists for this employee and period/i);
  });

  it('should handle employee with no salary components', async () => {
    // Create employee without salary components
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP002',
        full_name: 'Jane Smith',
        position: 'Intern',
        department: 'HR',
        start_date: new Date('2023-06-01'),
        bank_account: '9876543210',
        email: 'jane.smith@company.com',
        phone: '+9876543210'
      })
      .returning()
      .execute();

    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 3,
        period_start: new Date('2024-03-01'),
        period_end: new Date('2024-03-31'),
        is_closed: false
      })
      .returning()
      .execute();

    const input: CreatePayrollRecordInput = {
      employee_id: employeeResult[0].id,
      payroll_period_id: periodResult[0].id,
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: 100000,
      attendance_days: 15
    };

    const result = await createPayrollRecord(input);

    // All salary components should be zero
    expect(result.base_salary).toEqual(0);
    expect(result.total_allowances).toEqual(0);
    expect(result.total_deductions).toEqual(0);
    expect(result.gross_salary).toEqual(100000); // Only bonus
    expect(result.net_salary).toEqual(100000); // No deductions

    // No payroll details should be created
    const details = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.payroll_record_id, result.id))
      .execute();

    expect(details).toHaveLength(0);
  });
});