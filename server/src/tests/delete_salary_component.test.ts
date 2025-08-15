import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  salaryComponentsTable, 
  employeesTable, 
  employeeSalaryComponentsTable,
  payrollPeriodsTable,
  payrollRecordsTable,
  payrollDetailsTable
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteSalaryComponent } from '../handlers/delete_salary_component';

describe('deleteSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing salary component', async () => {
    // Create test salary component
    const result = await db.insert(salaryComponentsTable)
      .values({
        name: 'Test Allowance',
        type: 'allowance',
        description: 'Test allowance for deletion'
      })
      .returning()
      .execute();

    const componentId = result[0].id;

    // Delete the component
    const deleteResult = await deleteSalaryComponent(componentId);

    expect(deleteResult.success).toBe(true);

    // Verify component is deleted
    const components = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, componentId))
      .execute();

    expect(components).toHaveLength(0);
  });

  it('should throw error when salary component does not exist', async () => {
    const nonExistentId = 999;

    expect(deleteSalaryComponent(nonExistentId)).rejects.toThrow(/salary component with id 999 not found/i);
  });

  it('should cascade delete related employee salary components', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2024-01-01'),
        bank_account: '1234567890',
        email: 'john.doe@example.com',
        phone: '555-0123'
      })
      .returning()
      .execute();

    // Create test salary component
    const component = await db.insert(salaryComponentsTable)
      .values({
        name: 'Test Allowance',
        type: 'allowance',
        description: 'Test allowance for cascade deletion'
      })
      .returning()
      .execute();

    // Create employee salary component association
    const empComponent = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: component[0].id,
        amount: '5000.00'
      })
      .returning()
      .execute();

    // Delete the salary component
    const deleteResult = await deleteSalaryComponent(component[0].id);

    expect(deleteResult.success).toBe(true);

    // Verify salary component is deleted
    const components = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, component[0].id))
      .execute();

    expect(components).toHaveLength(0);

    // Verify employee salary component is cascade deleted
    const empComponents = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, empComponent[0].id))
      .execute();

    expect(empComponents).toHaveLength(0);
  });

  it('should cascade delete related payroll details', async () => {
    // Create test employee
    const employee = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP002',
        full_name: 'Jane Smith',
        position: 'Manager',
        department: 'HR',
        start_date: new Date('2024-01-01'),
        bank_account: '9876543210',
        email: 'jane.smith@example.com',
        phone: '555-0124'
      })
      .returning()
      .execute();

    // Create test salary component
    const component = await db.insert(salaryComponentsTable)
      .values({
        name: 'Test Deduction',
        type: 'deduction',
        description: 'Test deduction for cascade deletion'
      })
      .returning()
      .execute();

    // Create payroll period
    const period = await db.insert(payrollPeriodsTable)
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
        payroll_period_id: period[0].id,
        base_salary: '10000.00',
        total_allowances: '2000.00',
        total_deductions: '500.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '12000.00',
        net_salary: '11500.00'
      })
      .returning()
      .execute();

    // Create payroll detail
    const payrollDetail = await db.insert(payrollDetailsTable)
      .values({
        payroll_record_id: payrollRecord[0].id,
        salary_component_id: component[0].id,
        amount: '500.00'
      })
      .returning()
      .execute();

    // Delete the salary component
    const deleteResult = await deleteSalaryComponent(component[0].id);

    expect(deleteResult.success).toBe(true);

    // Verify salary component is deleted
    const components = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, component[0].id))
      .execute();

    expect(components).toHaveLength(0);

    // Verify payroll detail is cascade deleted
    const payrollDetails = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.id, payrollDetail[0].id))
      .execute();

    expect(payrollDetails).toHaveLength(0);
  });

  it('should handle deletion of component with multiple relationships', async () => {
    // Create test employees
    const employee1 = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP003',
        full_name: 'Alice Johnson',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2024-01-01'),
        bank_account: '1111111111',
        email: 'alice.johnson@example.com',
        phone: '555-0125'
      })
      .returning()
      .execute();

    const employee2 = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP004',
        full_name: 'Bob Wilson',
        position: 'Analyst',
        department: 'Finance',
        start_date: new Date('2024-01-01'),
        bank_account: '2222222222',
        email: 'bob.wilson@example.com',
        phone: '555-0126'
      })
      .returning()
      .execute();

    // Create salary component
    const component = await db.insert(salaryComponentsTable)
      .values({
        name: 'Transport Allowance',
        type: 'allowance',
        description: 'Monthly transport allowance'
      })
      .returning()
      .execute();

    // Create multiple employee salary components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee1[0].id,
          salary_component_id: component[0].id,
          amount: '1000.00'
        },
        {
          employee_id: employee2[0].id,
          salary_component_id: component[0].id,
          amount: '1500.00'
        }
      ])
      .execute();

    // Delete the salary component
    const deleteResult = await deleteSalaryComponent(component[0].id);

    expect(deleteResult.success).toBe(true);

    // Verify all related employee salary components are deleted
    const empComponents = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.salary_component_id, component[0].id))
      .execute();

    expect(empComponents).toHaveLength(0);
  });
});