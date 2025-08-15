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
import { deleteEmployee } from '../handlers/delete_employee';
import { eq } from 'drizzle-orm';

// Test data
const testEmployee = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'IT',
  start_date: new Date('2023-01-01'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1234567890'
};

const testSalaryComponent = {
  name: 'Base Salary',
  type: 'base_salary' as const,
  description: 'Monthly base salary'
};

const testPayrollPeriod = {
  year: 2024,
  month: 1,
  period_start: new Date('2024-01-01'),
  period_end: new Date('2024-01-31')
};

describe('deleteEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing employee', async () => {
    // Create test employee
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    // Verify employee exists
    const beforeDelete = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employee.id))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete employee
    const result = await deleteEmployee(employee.id);
    expect(result.success).toBe(true);

    // Verify employee is deleted
    const afterDelete = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employee.id))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should throw error when employee does not exist', async () => {
    const nonExistentId = 99999;

    await expect(deleteEmployee(nonExistentId)).rejects.toThrow(/Employee with id 99999 not found/i);
  });

  it('should cascade delete employee salary components', async () => {
    // Create test data
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const [salaryComponent] = await db.insert(salaryComponentsTable)
      .values(testSalaryComponent)
      .returning()
      .execute();

    const [employeeSalaryComponent] = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee.id,
        salary_component_id: salaryComponent.id,
        amount: '5000.00'
      })
      .returning()
      .execute();

    // Verify salary component exists
    const beforeDelete = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.employee_id, employee.id))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete employee
    const result = await deleteEmployee(employee.id);
    expect(result.success).toBe(true);

    // Verify employee salary component is cascade deleted
    const afterDelete = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.employee_id, employee.id))
      .execute();
    expect(afterDelete).toHaveLength(0);

    // Verify salary component itself still exists (only the relationship is deleted)
    const salaryComponentStillExists = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, salaryComponent.id))
      .execute();
    expect(salaryComponentStillExists).toHaveLength(1);
  });

  it('should cascade delete payroll records and details', async () => {
    // Create test data
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const [payrollPeriod] = await db.insert(payrollPeriodsTable)
      .values(testPayrollPeriod)
      .returning()
      .execute();

    const [salaryComponent] = await db.insert(salaryComponentsTable)
      .values(testSalaryComponent)
      .returning()
      .execute();

    const [payrollRecord] = await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee.id,
        payroll_period_id: payrollPeriod.id,
        base_salary: '5000.00',
        total_allowances: '500.00',
        total_deductions: '200.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: null,
        gross_salary: '5500.00',
        net_salary: '5300.00'
      })
      .returning()
      .execute();

    const [payrollDetail] = await db.insert(payrollDetailsTable)
      .values({
        payroll_record_id: payrollRecord.id,
        salary_component_id: salaryComponent.id,
        amount: '5000.00'
      })
      .returning()
      .execute();

    // Verify payroll records and details exist
    const payrollRecordsBefore = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.employee_id, employee.id))
      .execute();
    expect(payrollRecordsBefore).toHaveLength(1);

    const payrollDetailsBefore = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.payroll_record_id, payrollRecord.id))
      .execute();
    expect(payrollDetailsBefore).toHaveLength(1);

    // Delete employee
    const result = await deleteEmployee(employee.id);
    expect(result.success).toBe(true);

    // Verify payroll records are cascade deleted
    const payrollRecordsAfter = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.employee_id, employee.id))
      .execute();
    expect(payrollRecordsAfter).toHaveLength(0);

    // Verify payroll details are cascade deleted
    const payrollDetailsAfter = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.payroll_record_id, payrollRecord.id))
      .execute();
    expect(payrollDetailsAfter).toHaveLength(0);

    // Verify payroll period and salary component still exist
    const payrollPeriodExists = await db.select()
      .from(payrollPeriodsTable)
      .where(eq(payrollPeriodsTable.id, payrollPeriod.id))
      .execute();
    expect(payrollPeriodExists).toHaveLength(1);

    const salaryComponentExists = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, salaryComponent.id))
      .execute();
    expect(salaryComponentExists).toHaveLength(1);
  });

  it('should handle multiple related records deletion', async () => {
    // Create test employee
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    // Create multiple salary components for the employee
    const [baseSalaryComponent] = await db.insert(salaryComponentsTable)
      .values({ name: 'Base Salary', type: 'base_salary', description: 'Base salary' })
      .returning()
      .execute();

    const [allowanceComponent] = await db.insert(salaryComponentsTable)
      .values({ name: 'Housing Allowance', type: 'allowance', description: 'Housing allowance' })
      .returning()
      .execute();

    // Create employee salary components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee.id,
          salary_component_id: baseSalaryComponent.id,
          amount: '5000.00'
        },
        {
          employee_id: employee.id,
          salary_component_id: allowanceComponent.id,
          amount: '1000.00'
        }
      ])
      .execute();

    // Create multiple payroll periods and records
    const [period1] = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const [period2] = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 2,
        period_start: new Date('2024-02-01'),
        period_end: new Date('2024-02-29')
      })
      .returning()
      .execute();

    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employee.id,
          payroll_period_id: period1.id,
          base_salary: '5000.00',
          total_allowances: '1000.00',
          total_deductions: '0.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 31,
          gross_salary: '6000.00',
          net_salary: '6000.00'
        },
        {
          employee_id: employee.id,
          payroll_period_id: period2.id,
          base_salary: '5000.00',
          total_allowances: '1000.00',
          total_deductions: '100.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 29,
          gross_salary: '6000.00',
          net_salary: '5900.00'
        }
      ])
      .execute();

    // Verify all records exist before deletion
    const salaryComponentsBefore = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.employee_id, employee.id))
      .execute();
    expect(salaryComponentsBefore).toHaveLength(2);

    const payrollRecordsBefore = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.employee_id, employee.id))
      .execute();
    expect(payrollRecordsBefore).toHaveLength(2);

    // Delete employee
    const result = await deleteEmployee(employee.id);
    expect(result.success).toBe(true);

    // Verify all related records are deleted
    const salaryComponentsAfter = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.employee_id, employee.id))
      .execute();
    expect(salaryComponentsAfter).toHaveLength(0);

    const payrollRecordsAfter = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.employee_id, employee.id))
      .execute();
    expect(payrollRecordsAfter).toHaveLength(0);
  });
});