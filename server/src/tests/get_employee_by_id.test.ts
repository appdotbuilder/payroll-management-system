import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { getEmployeeById } from '../handlers/get_employee_by_id';

// Test employee data
const testEmployee: CreateEmployeeInput = {
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

describe('getEmployeeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return employee when found', async () => {
    // Create test employee
    const insertResult = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const createdEmployee = insertResult[0];

    // Get employee by ID
    const result = await getEmployeeById(createdEmployee.id);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEmployee.id);
    expect(result!.employee_id).toEqual('EMP001');
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.position).toEqual('Software Engineer');
    expect(result!.department).toEqual('Engineering');
    expect(result!.start_date).toEqual(testEmployee.start_date);
    expect(result!.bank_account).toEqual('1234567890');
    expect(result!.email).toEqual('john.doe@company.com');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when employee not found', async () => {
    // Try to get non-existent employee
    const result = await getEmployeeById(999);

    expect(result).toBeNull();
  });

  it('should return correct employee when multiple employees exist', async () => {
    // Create multiple test employees
    const insertResult1 = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const insertResult2 = await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();

    const employee1Id = insertResult1[0].id;
    const employee2Id = insertResult2[0].id;

    // Get first employee
    const result1 = await getEmployeeById(employee1Id);
    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(employee1Id);
    expect(result1!.full_name).toEqual('John Doe');
    expect(result1!.department).toEqual('Engineering');

    // Get second employee
    const result2 = await getEmployeeById(employee2Id);
    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(employee2Id);
    expect(result2!.full_name).toEqual('Jane Smith');
    expect(result2!.department).toEqual('Product');
  });

  it('should handle negative ID gracefully', async () => {
    const result = await getEmployeeById(-1);
    expect(result).toBeNull();
  });

  it('should handle zero ID gracefully', async () => {
    const result = await getEmployeeById(0);
    expect(result).toBeNull();
  });
});