import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { createEmployee } from '../handlers/create_employee';
import { eq } from 'drizzle-orm';

// Test input data
const testEmployeeInput: CreateEmployeeInput = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'Engineering',
  start_date: new Date('2024-01-15'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1-555-0123'
};

describe('createEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an employee', async () => {
    const result = await createEmployee(testEmployeeInput);

    // Basic field validation
    expect(result.employee_id).toEqual('EMP001');
    expect(result.full_name).toEqual('John Doe');
    expect(result.position).toEqual('Software Engineer');
    expect(result.department).toEqual('Engineering');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.bank_account).toEqual('1234567890');
    expect(result.email).toEqual('john.doe@company.com');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save employee to database', async () => {
    const result = await createEmployee(testEmployeeInput);

    // Query the database to verify employee was saved
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(employees).toHaveLength(1);
    const savedEmployee = employees[0];
    expect(savedEmployee.employee_id).toEqual('EMP001');
    expect(savedEmployee.full_name).toEqual('John Doe');
    expect(savedEmployee.position).toEqual('Software Engineer');
    expect(savedEmployee.department).toEqual('Engineering');
    expect(savedEmployee.start_date).toBeInstanceOf(Date);
    expect(savedEmployee.bank_account).toEqual('1234567890');
    expect(savedEmployee.email).toEqual('john.doe@company.com');
    expect(savedEmployee.phone).toEqual('+1-555-0123');
    expect(savedEmployee.created_at).toBeInstanceOf(Date);
    expect(savedEmployee.updated_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate employee_id', async () => {
    // Create first employee
    await createEmployee(testEmployeeInput);

    // Try to create another employee with same employee_id
    const duplicateInput: CreateEmployeeInput = {
      ...testEmployeeInput,
      email: 'different@company.com' // Different email to avoid email uniqueness constraint
    };

    await expect(createEmployee(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint|unique constraint/i);
  });

  it('should handle duplicate email', async () => {
    // Create first employee
    await createEmployee(testEmployeeInput);

    // Try to create another employee with same email
    const duplicateInput: CreateEmployeeInput = {
      ...testEmployeeInput,
      employee_id: 'EMP002' // Different employee_id to avoid employee_id uniqueness constraint
    };

    await expect(createEmployee(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint|unique constraint/i);
  });

  it('should create multiple employees with different details', async () => {
    const employee1 = await createEmployee(testEmployeeInput);

    const employee2Input: CreateEmployeeInput = {
      employee_id: 'EMP002',
      full_name: 'Jane Smith',
      position: 'Product Manager',
      department: 'Product',
      start_date: new Date('2024-02-01'),
      bank_account: '0987654321',
      email: 'jane.smith@company.com',
      phone: '+1-555-0456'
    };

    const employee2 = await createEmployee(employee2Input);

    // Verify both employees exist in database
    const employees = await db.select().from(employeesTable).execute();
    expect(employees).toHaveLength(2);

    // Verify IDs are different
    expect(employee1.id).not.toEqual(employee2.id);

    // Verify different employee details
    expect(employee1.employee_id).toEqual('EMP001');
    expect(employee2.employee_id).toEqual('EMP002');
    expect(employee1.full_name).toEqual('John Doe');
    expect(employee2.full_name).toEqual('Jane Smith');
  });

  it('should handle date fields correctly', async () => {
    const specificDate = new Date('2023-12-01T10:30:00Z');
    const dateInput: CreateEmployeeInput = {
      ...testEmployeeInput,
      employee_id: 'EMP003',
      email: 'date.test@company.com',
      start_date: specificDate
    };

    const result = await createEmployee(dateInput);

    // Verify start_date is properly handled
    expect(result.start_date).toBeInstanceOf(Date);
    
    // Query database to verify date persistence
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(employees[0].start_date).toBeInstanceOf(Date);
  });

  it('should create employee with all required fields present', async () => {
    const completeInput: CreateEmployeeInput = {
      employee_id: 'EMP004',
      full_name: 'Alice Johnson',
      position: 'Data Scientist',
      department: 'Analytics',
      start_date: new Date('2024-03-01'),
      bank_account: '1122334455',
      email: 'alice.johnson@company.com',
      phone: '+1-555-0789'
    };

    const result = await createEmployee(completeInput);

    // Verify all fields are present and correct
    expect(result.employee_id).toBeTruthy();
    expect(result.full_name).toBeTruthy();
    expect(result.position).toBeTruthy();
    expect(result.department).toBeTruthy();
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.bank_account).toBeTruthy();
    expect(result.email).toBeTruthy();
    expect(result.phone).toBeTruthy();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});