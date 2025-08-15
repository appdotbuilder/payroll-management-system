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
import { deleteEmployeeSalaryComponent } from '../handlers/delete_employee_salary_component';
import { eq } from 'drizzle-orm';

describe('deleteEmployeeSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an employee salary component', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '1234567890',
        email: 'john@test.com',
        phone: '1234567890'
      })
      .returning()
      .execute();

    // Create test salary component
    const salaryComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Housing Allowance',
        type: 'allowance',
        description: 'Monthly housing allowance'
      })
      .returning()
      .execute();

    // Create employee salary component assignment
    const employeeSalaryComponent = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent[0].id,
        amount: '1000.00'
      })
      .returning()
      .execute();

    // Delete the assignment
    const result = await deleteEmployeeSalaryComponent(employeeSalaryComponent[0].id);

    expect(result.success).toBe(true);

    // Verify the assignment was deleted
    const deletedComponent = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, employeeSalaryComponent[0].id))
      .execute();

    expect(deletedComponent).toHaveLength(0);
  });

  it('should throw error when employee salary component does not exist', async () => {
    const nonExistentId = 999;

    expect(deleteEmployeeSalaryComponent(nonExistentId))
      .rejects
      .toThrow(/Employee salary component not found/i);
  });

  it('should delete related payroll details when deleting employee salary component', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP002',
        full_name: 'Jane Smith',
        position: 'Manager',
        department: 'HR',
        start_date: new Date('2023-01-01'),
        bank_account: '9876543210',
        email: 'jane@test.com',
        phone: '9876543210'
      })
      .returning()
      .execute();

    // Create test salary component
    const salaryComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Transport Allowance',
        type: 'allowance',
        description: 'Monthly transport allowance'
      })
      .returning()
      .execute();

    // Create employee salary component assignment
    const employeeSalaryComponent = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent[0].id,
        amount: '500.00'
      })
      .returning()
      .execute();

    // Create payroll period
    const payrollPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      })
      .returning()
      .execute();

    // Create payroll record
    const payrollRecord = await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee[0].id,
        payroll_period_id: payrollPeriod[0].id,
        base_salary: '5000.00',
        total_allowances: '500.00',
        total_deductions: '0.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: null,
        gross_salary: '5500.00',
        net_salary: '5500.00'
      })
      .returning()
      .execute();

    // Create payroll detail with the salary component
    const payrollDetail = await db.insert(payrollDetailsTable)
      .values({
        payroll_record_id: payrollRecord[0].id,
        salary_component_id: salaryComponent[0].id,
        amount: '500.00'
      })
      .returning()
      .execute();

    // Verify payroll detail exists before deletion
    const existingDetail = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.id, payrollDetail[0].id))
      .execute();

    expect(existingDetail).toHaveLength(1);

    // Delete the employee salary component
    const result = await deleteEmployeeSalaryComponent(employeeSalaryComponent[0].id);

    expect(result.success).toBe(true);

    // Verify related payroll detail was deleted
    const deletedDetail = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.salary_component_id, salaryComponent[0].id))
      .execute();

    expect(deletedDetail).toHaveLength(0);

    // Verify the employee salary component was deleted
    const deletedComponent = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, employeeSalaryComponent[0].id))
      .execute();

    expect(deletedComponent).toHaveLength(0);
  });

  it('should handle deletion when no related payroll details exist', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP003',
        full_name: 'Bob Johnson',
        position: 'Analyst',
        department: 'Finance',
        start_date: new Date('2023-01-01'),
        bank_account: '1122334455',
        email: 'bob@test.com',
        phone: '1122334455'
      })
      .returning()
      .execute();

    // Create test salary component
    const salaryComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Meal Allowance',
        type: 'allowance',
        description: 'Daily meal allowance'
      })
      .returning()
      .execute();

    // Create employee salary component assignment (no related payroll details)
    const employeeSalaryComponent = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent[0].id,
        amount: '200.00'
      })
      .returning()
      .execute();

    // Delete the assignment (should work even without payroll details)
    const result = await deleteEmployeeSalaryComponent(employeeSalaryComponent[0].id);

    expect(result.success).toBe(true);

    // Verify the assignment was deleted
    const deletedComponent = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, employeeSalaryComponent[0].id))
      .execute();

    expect(deletedComponent).toHaveLength(0);
  });

  it('should delete only payroll details for the specific salary component', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP004',
        full_name: 'Alice Wilson',
        position: 'Designer',
        department: 'Creative',
        start_date: new Date('2023-01-01'),
        bank_account: '5566778899',
        email: 'alice@test.com',
        phone: '5566778899'
      })
      .returning()
      .execute();

    // Create two different salary components
    const salaryComponent1 = await db.insert(salaryComponentsTable)
      .values({
        name: 'Internet Allowance',
        type: 'allowance',
        description: 'Monthly internet allowance'
      })
      .returning()
      .execute();

    const salaryComponent2 = await db.insert(salaryComponentsTable)
      .values({
        name: 'Phone Allowance',
        type: 'allowance',
        description: 'Monthly phone allowance'
      })
      .returning()
      .execute();

    // Create employee salary component assignments
    const employeeSalaryComponent1 = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent1[0].id,
        amount: '100.00'
      })
      .returning()
      .execute();

    const employeeSalaryComponent2 = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent2[0].id,
        amount: '150.00'
      })
      .returning()
      .execute();

    // Create payroll period and record
    const payrollPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 2,
        period_start: new Date('2024-02-01'),
        period_end: new Date('2024-02-29')
      })
      .returning()
      .execute();

    const payrollRecord = await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee[0].id,
        payroll_period_id: payrollPeriod[0].id,
        base_salary: '4000.00',
        total_allowances: '250.00',
        total_deductions: '0.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: null,
        gross_salary: '4250.00',
        net_salary: '4250.00'
      })
      .returning()
      .execute();

    // Create payroll details for both components
    const payrollDetail1 = await db.insert(payrollDetailsTable)
      .values({
        payroll_record_id: payrollRecord[0].id,
        salary_component_id: salaryComponent1[0].id,
        amount: '100.00'
      })
      .returning()
      .execute();

    const payrollDetail2 = await db.insert(payrollDetailsTable)
      .values({
        payroll_record_id: payrollRecord[0].id,
        salary_component_id: salaryComponent2[0].id,
        amount: '150.00'
      })
      .returning()
      .execute();

    // Delete only the first employee salary component
    const result = await deleteEmployeeSalaryComponent(employeeSalaryComponent1[0].id);

    expect(result.success).toBe(true);

    // Verify first payroll detail was deleted
    const deletedDetail1 = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.id, payrollDetail1[0].id))
      .execute();

    expect(deletedDetail1).toHaveLength(0);

    // Verify second payroll detail still exists
    const remainingDetail2 = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.id, payrollDetail2[0].id))
      .execute();

    expect(remainingDetail2).toHaveLength(1);

    // Verify first employee salary component was deleted
    const deletedComponent1 = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, employeeSalaryComponent1[0].id))
      .execute();

    expect(deletedComponent1).toHaveLength(0);

    // Verify second employee salary component still exists
    const remainingComponent2 = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, employeeSalaryComponent2[0].id))
      .execute();

    expect(remainingComponent2).toHaveLength(1);
  });
});