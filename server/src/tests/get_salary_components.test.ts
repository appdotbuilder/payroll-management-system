import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type CreateSalaryComponentInput } from '../schema';
import { getSalaryComponents } from '../handlers/get_salary_components';

// Test data for different component types
const testComponents: CreateSalaryComponentInput[] = [
  {
    name: 'Basic Salary',
    type: 'base_salary',
    description: 'Monthly base salary'
  },
  {
    name: 'Housing Allowance',
    type: 'allowance',
    description: 'Monthly housing allowance'
  },
  {
    name: 'Transport Allowance',
    type: 'allowance',
    description: 'Daily transport allowance'
  },
  {
    name: 'Income Tax',
    type: 'deduction',
    description: 'Monthly income tax deduction'
  },
  {
    name: 'Medical Insurance',
    type: 'deduction',
    description: 'Monthly medical insurance deduction'
  },
  {
    name: 'Performance Bonus',
    type: 'allowance',
    description: 'Quarterly performance bonus'
  }
];

describe('getSalaryComponents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no salary components exist', async () => {
    const result = await getSalaryComponents();
    expect(result).toEqual([]);
  });

  it('should return all salary components ordered by type and name', async () => {
    // Insert test components
    await db.insert(salaryComponentsTable)
      .values(testComponents)
      .execute();

    const result = await getSalaryComponents();

    expect(result).toHaveLength(6);

    // Verify ordering: base_salary, then allowance (alphabetical), then deduction (alphabetical)
    expect(result[0].name).toEqual('Basic Salary');
    expect(result[0].type).toEqual('base_salary');

    expect(result[1].name).toEqual('Housing Allowance');
    expect(result[1].type).toEqual('allowance');

    expect(result[2].name).toEqual('Performance Bonus');
    expect(result[2].type).toEqual('allowance');

    expect(result[3].name).toEqual('Transport Allowance');
    expect(result[3].type).toEqual('allowance');

    expect(result[4].name).toEqual('Income Tax');
    expect(result[4].type).toEqual('deduction');

    expect(result[5].name).toEqual('Medical Insurance');
    expect(result[5].type).toEqual('deduction');

    // Verify all components have required fields
    result.forEach(component => {
      expect(component.id).toBeDefined();
      expect(component.name).toBeDefined();
      expect(component.type).toBeDefined();
      expect(component.created_at).toBeInstanceOf(Date);
      expect(component.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter by base_salary type', async () => {
    // Insert test components
    await db.insert(salaryComponentsTable)
      .values(testComponents)
      .execute();

    const result = await getSalaryComponents('base_salary');

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Salary');
    expect(result[0].type).toEqual('base_salary');
    expect(result[0].description).toEqual('Monthly base salary');
  });

  it('should filter by allowance type', async () => {
    // Insert test components
    await db.insert(salaryComponentsTable)
      .values(testComponents)
      .execute();

    const result = await getSalaryComponents('allowance');

    expect(result).toHaveLength(3);
    
    // Verify all are allowances and ordered alphabetically by name
    expect(result[0].name).toEqual('Housing Allowance');
    expect(result[0].type).toEqual('allowance');

    expect(result[1].name).toEqual('Performance Bonus');
    expect(result[1].type).toEqual('allowance');

    expect(result[2].name).toEqual('Transport Allowance');
    expect(result[2].type).toEqual('allowance');

    result.forEach(component => {
      expect(component.type).toEqual('allowance');
    });
  });

  it('should filter by deduction type', async () => {
    // Insert test components
    await db.insert(salaryComponentsTable)
      .values(testComponents)
      .execute();

    const result = await getSalaryComponents('deduction');

    expect(result).toHaveLength(2);

    // Verify all are deductions and ordered alphabetically by name
    expect(result[0].name).toEqual('Income Tax');
    expect(result[0].type).toEqual('deduction');

    expect(result[1].name).toEqual('Medical Insurance');
    expect(result[1].type).toEqual('deduction');

    result.forEach(component => {
      expect(component.type).toEqual('deduction');
    });
  });

  it('should return empty array when filtering by type with no matching components', async () => {
    // Insert only allowance components
    const allowanceComponents = testComponents.filter(c => c.type === 'allowance');
    await db.insert(salaryComponentsTable)
      .values(allowanceComponents)
      .execute();

    const result = await getSalaryComponents('base_salary');
    expect(result).toEqual([]);
  });

  it('should handle components with null descriptions', async () => {
    // Insert component with null description
    const componentWithNullDesc: CreateSalaryComponentInput = {
      name: 'Special Allowance',
      type: 'allowance',
      description: null
    };

    await db.insert(salaryComponentsTable)
      .values([componentWithNullDesc])
      .execute();

    const result = await getSalaryComponents();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Special Allowance');
    expect(result[0].description).toBeNull();
    expect(result[0].type).toEqual('allowance');
  });

  it('should handle mixed case ordering correctly', async () => {
    // Insert components with mixed case names
    const mixedCaseComponents: CreateSalaryComponentInput[] = [
      {
        name: 'zSpecial Allowance',
        type: 'allowance',
        description: 'Last alphabetically'
      },
      {
        name: 'aFirst Allowance',
        type: 'allowance',
        description: 'First alphabetically'
      },
      {
        name: 'Mid Allowance',
        type: 'allowance',
        description: 'Middle alphabetically'
      }
    ];

    await db.insert(salaryComponentsTable)
      .values(mixedCaseComponents)
      .execute();

    const result = await getSalaryComponents('allowance');

    expect(result).toHaveLength(3);
    
    // PostgreSQL default ordering is case-sensitive with uppercase before lowercase
    // So 'Mid Allowance' comes before 'aFirst Allowance' in default ASCII ordering
    expect(result[0].name).toEqual('Mid Allowance');
    expect(result[1].name).toEqual('aFirst Allowance');
    expect(result[2].name).toEqual('zSpecial Allowance');
  });
});