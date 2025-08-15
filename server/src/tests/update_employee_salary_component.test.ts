import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, salaryComponentsTable, employeeSalaryComponentsTable } from '../db/schema';
import { type UpdateEmployeeSalaryComponentInput } from '../schema';
import { updateEmployeeSalaryComponent } from '../handlers/update_employee_salary_component';
import { eq } from 'drizzle-orm';

describe('updateEmployeeSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
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

    // Create test salary component
    const salaryComponent = await db.insert(salaryComponentsTable)
      .values({
        name: 'Basic Salary',
        type: 'base_salary',
        description: 'Monthly basic salary'
      })
      .returning()
      .execute();

    // Create employee salary component assignment
    const employeeSalaryComponent = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee[0].id,
        salary_component_id: salaryComponent[0].id,
        amount: '5000.00' // Initial amount
      })
      .returning()
      .execute();

    return {
      employee: employee[0],
      salaryComponent: salaryComponent[0],
      employeeSalaryComponent: employeeSalaryComponent[0]
    };
  };

  it('should update employee salary component amount', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateEmployeeSalaryComponentInput = {
      id: testData.employeeSalaryComponent.id,
      amount: 6000.00
    };

    const result = await updateEmployeeSalaryComponent(updateInput);

    // Verify response fields
    expect(result.id).toEqual(testData.employeeSalaryComponent.id);
    expect(result.employee_id).toEqual(testData.employee.id);
    expect(result.salary_component_id).toEqual(testData.salaryComponent.id);
    expect(result.amount).toEqual(6000.00);
    expect(typeof result.amount).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save updated amount to database', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateEmployeeSalaryComponentInput = {
      id: testData.employeeSalaryComponent.id,
      amount: 7500.50
    };

    await updateEmployeeSalaryComponent(updateInput);

    // Query database to verify the update was persisted
    const updated = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, testData.employeeSalaryComponent.id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(parseFloat(updated[0].amount)).toEqual(7500.50);
    expect(updated[0].updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at was changed
    expect(updated[0].updated_at.getTime()).toBeGreaterThan(testData.employeeSalaryComponent.updated_at.getTime());
  });

  it('should handle decimal amounts correctly', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateEmployeeSalaryComponentInput = {
      id: testData.employeeSalaryComponent.id,
      amount: 4999.99
    };

    const result = await updateEmployeeSalaryComponent(updateInput);

    expect(result.amount).toEqual(4999.99);
    expect(typeof result.amount).toBe('number');

    // Verify precision is maintained in database
    const dbRecord = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, testData.employeeSalaryComponent.id))
      .execute();

    expect(parseFloat(dbRecord[0].amount)).toEqual(4999.99);
  });

  it('should throw error when employee salary component not found', async () => {
    const updateInput: UpdateEmployeeSalaryComponentInput = {
      id: 999999, // Non-existent ID
      amount: 5000.00
    };

    await expect(updateEmployeeSalaryComponent(updateInput)).rejects.toThrow(/Employee salary component with id 999999 not found/);
  });

  it('should preserve other fields when updating', async () => {
    const testData = await createTestData();
    
    const updateInput: UpdateEmployeeSalaryComponentInput = {
      id: testData.employeeSalaryComponent.id,
      amount: 8000.00
    };

    const result = await updateEmployeeSalaryComponent(updateInput);

    // Verify other fields remain unchanged
    expect(result.employee_id).toEqual(testData.employeeSalaryComponent.employee_id);
    expect(result.salary_component_id).toEqual(testData.employeeSalaryComponent.salary_component_id);
    expect(result.created_at.getTime()).toEqual(testData.employeeSalaryComponent.created_at.getTime());
    
    // Only amount and updated_at should change
    expect(result.amount).not.toEqual(parseFloat(testData.employeeSalaryComponent.amount));
    expect(result.updated_at.getTime()).toBeGreaterThan(testData.employeeSalaryComponent.updated_at.getTime());
  });
});