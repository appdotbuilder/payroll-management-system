import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type CreateSalaryComponentInput } from '../schema';
import { createSalaryComponent } from '../handlers/create_salary_component';
import { eq, and } from 'drizzle-orm';

// Test input for base salary
const testBaseSalaryInput: CreateSalaryComponentInput = {
  name: 'Basic Salary',
  type: 'base_salary',
  description: 'Monthly basic salary for employees'
};

// Test input for allowance
const testAllowanceInput: CreateSalaryComponentInput = {
  name: 'Transport Allowance',
  type: 'allowance',
  description: 'Monthly transportation allowance'
};

// Test input for deduction
const testDeductionInput: CreateSalaryComponentInput = {
  name: 'Income Tax',
  type: 'deduction',
  description: 'Monthly income tax deduction'
};

// Test input with null description
const testNullDescriptionInput: CreateSalaryComponentInput = {
  name: 'Overtime Pay',
  type: 'allowance',
  description: null
};

describe('createSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a base salary component', async () => {
    const result = await createSalaryComponent(testBaseSalaryInput);

    // Basic field validation
    expect(result.name).toEqual('Basic Salary');
    expect(result.type).toEqual('base_salary');
    expect(result.description).toEqual('Monthly basic salary for employees');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an allowance component', async () => {
    const result = await createSalaryComponent(testAllowanceInput);

    expect(result.name).toEqual('Transport Allowance');
    expect(result.type).toEqual('allowance');
    expect(result.description).toEqual('Monthly transportation allowance');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a deduction component', async () => {
    const result = await createSalaryComponent(testDeductionInput);

    expect(result.name).toEqual('Income Tax');
    expect(result.type).toEqual('deduction');
    expect(result.description).toEqual('Monthly income tax deduction');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create component with null description', async () => {
    const result = await createSalaryComponent(testNullDescriptionInput);

    expect(result.name).toEqual('Overtime Pay');
    expect(result.type).toEqual('allowance');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save salary component to database', async () => {
    const result = await createSalaryComponent(testBaseSalaryInput);

    // Query using proper drizzle syntax
    const components = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, result.id))
      .execute();

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Basic Salary');
    expect(components[0].type).toEqual('base_salary');
    expect(components[0].description).toEqual('Monthly basic salary for employees');
    expect(components[0].created_at).toBeInstanceOf(Date);
    expect(components[0].updated_at).toBeInstanceOf(Date);
  });

  it('should allow same name for different component types', async () => {
    // Create a component with same name but different type
    const input1: CreateSalaryComponentInput = {
      name: 'Bonus',
      type: 'allowance',
      description: 'Performance bonus'
    };

    const input2: CreateSalaryComponentInput = {
      name: 'Bonus',
      type: 'deduction',
      description: 'Bonus tax deduction'
    };

    const result1 = await createSalaryComponent(input1);
    const result2 = await createSalaryComponent(input2);

    expect(result1.name).toEqual('Bonus');
    expect(result1.type).toEqual('allowance');
    expect(result2.name).toEqual('Bonus');
    expect(result2.type).toEqual('deduction');

    // Verify both are saved in database
    const components = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.name, 'Bonus'))
      .execute();

    expect(components).toHaveLength(2);
    expect(components.map(c => c.type).sort()).toEqual(['allowance', 'deduction']);
  });

  it('should throw error for duplicate name within same type', async () => {
    // Create first component
    await createSalaryComponent(testBaseSalaryInput);

    // Try to create another component with same name and type
    const duplicateInput: CreateSalaryComponentInput = {
      name: 'Basic Salary',
      type: 'base_salary',
      description: 'Another basic salary'
    };

    await expect(createSalaryComponent(duplicateInput))
      .rejects
      .toThrow(/already exists for type/i);
  });

  it('should query components by type correctly', async () => {
    // Create components of different types
    await createSalaryComponent(testBaseSalaryInput);
    await createSalaryComponent(testAllowanceInput);
    await createSalaryComponent(testDeductionInput);

    // Query only allowance components
    const allowanceComponents = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.type, 'allowance'))
      .execute();

    expect(allowanceComponents).toHaveLength(1);
    expect(allowanceComponents[0].name).toEqual('Transport Allowance');
    expect(allowanceComponents[0].type).toEqual('allowance');
  });

  it('should query components with complex conditions', async () => {
    // Create multiple components
    await createSalaryComponent(testBaseSalaryInput);
    await createSalaryComponent(testAllowanceInput);
    
    const anotherAllowance: CreateSalaryComponentInput = {
      name: 'Housing Allowance',
      type: 'allowance',
      description: 'Monthly housing allowance'
    };
    await createSalaryComponent(anotherAllowance);

    // Query using complex conditions
    const query = db.select()
      .from(salaryComponentsTable);

    const conditions = [
      eq(salaryComponentsTable.type, 'allowance')
    ];

    const allowanceComponents = await query
      .where(and(...conditions))
      .execute();

    expect(allowanceComponents).toHaveLength(2);
    expect(allowanceComponents.map(c => c.name).sort()).toEqual(['Housing Allowance', 'Transport Allowance']);
    
    allowanceComponents.forEach(component => {
      expect(component.type).toEqual('allowance');
      expect(component.created_at).toBeInstanceOf(Date);
      expect(component.updated_at).toBeInstanceOf(Date);
    });
  });
});