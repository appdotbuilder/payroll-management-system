import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { getEmployees } from '../handlers/get_employees';

// Test employee data
const testEmployee1: CreateEmployeeInput = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'Engineering',
  start_date: new Date('2023-01-15'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1234567890'
};

const testEmployee2: CreateEmployeeInput = {
  employee_id: 'EMP002',
  full_name: 'Jane Smith',
  position: 'Product Manager',
  department: 'Product',
  start_date: new Date('2023-02-01'),
  bank_account: '0987654321',
  email: 'jane.smith@company.com',
  phone: '+0987654321'
};

const testEmployee3: CreateEmployeeInput = {
  employee_id: 'EMP003',
  full_name: 'Bob Johnson',
  position: 'Designer',
  department: 'Design',
  start_date: new Date('2023-03-10'),
  bank_account: '5555555555',
  email: 'bob.johnson@company.com',
  phone: '+5555555555'
};

describe('getEmployees', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no employees exist', async () => {
    const result = await getEmployees();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all employees', async () => {
    // Create test employees
    await db.insert(employeesTable)
      .values([testEmployee1, testEmployee2, testEmployee3])
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(3);
    
    // Verify all employees are returned
    const employeeIds = result.map(emp => emp.employee_id);
    expect(employeeIds).toContain('EMP001');
    expect(employeeIds).toContain('EMP002');
    expect(employeeIds).toContain('EMP003');
  });

  it('should return employees with all required fields', async () => {
    // Create a test employee
    await db.insert(employeesTable)
      .values(testEmployee1)
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(1);
    const employee = result[0];

    // Verify all fields are present
    expect(employee.id).toBeDefined();
    expect(typeof employee.id).toBe('number');
    expect(employee.employee_id).toEqual('EMP001');
    expect(employee.full_name).toEqual('John Doe');
    expect(employee.position).toEqual('Software Engineer');
    expect(employee.department).toEqual('Engineering');
    expect(employee.start_date).toBeInstanceOf(Date);
    expect(employee.bank_account).toEqual('1234567890');
    expect(employee.email).toEqual('john.doe@company.com');
    expect(employee.phone).toEqual('+1234567890');
    expect(employee.created_at).toBeInstanceOf(Date);
    expect(employee.updated_at).toBeInstanceOf(Date);
  });

  it('should return employees ordered by created_at descending', async () => {
    // Insert employees with slight delays to ensure different created_at timestamps
    await db.insert(employeesTable)
      .values(testEmployee1)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(employeesTable)
      .values(testEmployee2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(employeesTable)
      .values(testEmployee3)
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].employee_id).toEqual('EMP003'); // Latest created
    expect(result[1].employee_id).toEqual('EMP002'); // Middle
    expect(result[2].employee_id).toEqual('EMP001'); // First created

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle employees from different departments', async () => {
    // Create employees from different departments
    await db.insert(employeesTable)
      .values([testEmployee1, testEmployee2, testEmployee3])
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(3);

    // Verify different departments are included
    const departments = result.map(emp => emp.department);
    expect(departments).toContain('Engineering');
    expect(departments).toContain('Product');
    expect(departments).toContain('Design');
  });

  it('should handle employees with different positions', async () => {
    // Create employees with different positions
    await db.insert(employeesTable)
      .values([testEmployee1, testEmployee2, testEmployee3])
      .execute();

    const result = await getEmployees();

    expect(result).toHaveLength(3);

    // Verify different positions are included
    const positions = result.map(emp => emp.position);
    expect(positions).toContain('Software Engineer');
    expect(positions).toContain('Product Manager');
    expect(positions).toContain('Designer');
  });

  it('should preserve unique constraints', async () => {
    // Insert first employee
    await db.insert(employeesTable)
      .values(testEmployee1)
      .execute();

    // Try to insert employee with same employee_id (should fail)
    const duplicateEmployee = {
      ...testEmployee2,
      employee_id: 'EMP001' // Same as testEmployee1
    };

    await expect(
      db.insert(employeesTable)
        .values(duplicateEmployee)
        .execute()
    ).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});