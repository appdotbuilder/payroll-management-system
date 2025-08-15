import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, salaryComponentsTable, employeeSalaryComponentsTable } from '../db/schema';
import { type CreateEmployeeSalaryComponentInput } from '../schema';
import { createEmployeeSalaryComponent } from '../handlers/create_employee_salary_component';
import { eq, and } from 'drizzle-orm';

describe('createEmployeeSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEmployeeId: number;
  let testSalaryComponentId: number;

  beforeEach(async () => {
    // Create test employee
    const employees = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Software Engineer',
        department: 'IT',
        start_date: new Date('2023-01-15'),
        bank_account: '1234567890',
        email: 'john.doe@company.com',
        phone: '+1234567890'
      })
      .returning()
      .execute();

    testEmployeeId = employees[0].id;

    // Create test salary component
    const salaryComponents = await db.insert(salaryComponentsTable)
      .values({
        name: 'Base Salary',
        type: 'base_salary',
        description: 'Monthly base salary'
      })
      .returning()
      .execute();

    testSalaryComponentId = salaryComponents[0].id;
  });

  const testInput: CreateEmployeeSalaryComponentInput = {
    employee_id: 0, // Will be set in tests
    salary_component_id: 0, // Will be set in tests
    amount: 5000.50
  };

  it('should create an employee salary component assignment', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId
    };

    const result = await createEmployeeSalaryComponent(input);

    // Basic field validation
    expect(result.employee_id).toEqual(testEmployeeId);
    expect(result.salary_component_id).toEqual(testSalaryComponentId);
    expect(result.amount).toEqual(5000.50);
    expect(typeof result.amount).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save employee salary component to database', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId
    };

    const result = await createEmployeeSalaryComponent(input);

    // Query database to verify record was saved
    const assignments = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].employee_id).toEqual(testEmployeeId);
    expect(assignments[0].salary_component_id).toEqual(testSalaryComponentId);
    expect(parseFloat(assignments[0].amount)).toEqual(5000.50);
    expect(assignments[0].created_at).toBeInstanceOf(Date);
    expect(assignments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId,
      amount: 1234.56
    };

    const result = await createEmployeeSalaryComponent(input);

    expect(result.amount).toEqual(1234.56);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const assignments = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, result.id))
      .execute();

    expect(parseFloat(assignments[0].amount)).toEqual(1234.56);
  });

  it('should throw error when employee does not exist', async () => {
    const input = {
      ...testInput,
      employee_id: 99999, // Non-existent employee
      salary_component_id: testSalaryComponentId
    };

    await expect(createEmployeeSalaryComponent(input))
      .rejects.toThrow(/Employee with id 99999 not found/i);
  });

  it('should throw error when salary component does not exist', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: 99999 // Non-existent salary component
    };

    await expect(createEmployeeSalaryComponent(input))
      .rejects.toThrow(/Salary component with id 99999 not found/i);
  });

  it('should prevent duplicate assignments of same component to same employee', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId
    };

    // First assignment should succeed
    await createEmployeeSalaryComponent(input);

    // Second assignment should fail
    await expect(createEmployeeSalaryComponent(input))
      .rejects.toThrow(/Salary component .* is already assigned to employee/i);
  });

  it('should allow same salary component for different employees', async () => {
    // Create second employee
    const employees = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP002',
        full_name: 'Jane Smith',
        position: 'Data Analyst',
        department: 'IT',
        start_date: new Date('2023-02-01'),
        bank_account: '0987654321',
        email: 'jane.smith@company.com',
        phone: '+1987654321'
      })
      .returning()
      .execute();

    const secondEmployeeId = employees[0].id;

    // Assign same component to first employee
    const firstInput = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId,
      amount: 5000
    };

    const firstResult = await createEmployeeSalaryComponent(firstInput);

    // Assign same component to second employee (should succeed)
    const secondInput = {
      ...testInput,
      employee_id: secondEmployeeId,
      salary_component_id: testSalaryComponentId,
      amount: 6000
    };

    const secondResult = await createEmployeeSalaryComponent(secondInput);

    expect(firstResult.employee_id).toEqual(testEmployeeId);
    expect(secondResult.employee_id).toEqual(secondEmployeeId);
    expect(firstResult.salary_component_id).toEqual(testSalaryComponentId);
    expect(secondResult.salary_component_id).toEqual(testSalaryComponentId);
    expect(firstResult.amount).toEqual(5000);
    expect(secondResult.amount).toEqual(6000);
  });

  it('should allow different salary components for same employee', async () => {
    // Create second salary component
    const salaryComponents = await db.insert(salaryComponentsTable)
      .values({
        name: 'Housing Allowance',
        type: 'allowance',
        description: 'Monthly housing allowance'
      })
      .returning()
      .execute();

    const secondComponentId = salaryComponents[0].id;

    // Assign first component
    const firstInput = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId,
      amount: 5000
    };

    const firstResult = await createEmployeeSalaryComponent(firstInput);

    // Assign second component to same employee (should succeed)
    const secondInput = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: secondComponentId,
      amount: 1500
    };

    const secondResult = await createEmployeeSalaryComponent(secondInput);

    expect(firstResult.employee_id).toEqual(testEmployeeId);
    expect(secondResult.employee_id).toEqual(testEmployeeId);
    expect(firstResult.salary_component_id).toEqual(testSalaryComponentId);
    expect(secondResult.salary_component_id).toEqual(secondComponentId);
    expect(firstResult.amount).toEqual(5000);
    expect(secondResult.amount).toEqual(1500);
  });

  it('should verify assignment exists in database with correct relationships', async () => {
    const input = {
      ...testInput,
      employee_id: testEmployeeId,
      salary_component_id: testSalaryComponentId
    };

    const result = await createEmployeeSalaryComponent(input);

    // Verify the assignment exists with proper foreign key relationships
    const assignments = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(and(
        eq(employeeSalaryComponentsTable.employee_id, testEmployeeId),
        eq(employeeSalaryComponentsTable.salary_component_id, testSalaryComponentId)
      ))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].id).toEqual(result.id);
  });
});