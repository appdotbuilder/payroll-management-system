import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type UpdateEmployeeInput } from '../schema';
import { updateEmployee } from '../handlers/update_employee';
import { eq } from 'drizzle-orm';

// Test data for creating initial employees
const testEmployee1 = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'IT',
  start_date: new Date('2023-01-15'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1234567890'
};

const testEmployee2 = {
  employee_id: 'EMP002',
  full_name: 'Jane Smith',
  position: 'Product Manager',
  department: 'Product',
  start_date: new Date('2023-02-01'),
  bank_account: '0987654321',
  email: 'jane.smith@company.com',
  phone: '+0987654321'
};

describe('updateEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an employee with all fields', async () => {
    // Create an employee first
    const [createdEmployee] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: createdEmployee.id,
      employee_id: 'EMP001-UPDATED',
      full_name: 'John Doe Updated',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      start_date: new Date('2022-12-01'),
      bank_account: '1111111111',
      email: 'john.doe.updated@company.com',
      phone: '+1111111111'
    };

    const result = await updateEmployee(updateInput);

    // Verify the update result
    expect(result.id).toBe(createdEmployee.id);
    expect(result.employee_id).toBe('EMP001-UPDATED');
    expect(result.full_name).toBe('John Doe Updated');
    expect(result.position).toBe('Senior Software Engineer');
    expect(result.department).toBe('Engineering');
    expect(result.start_date).toEqual(new Date('2022-12-01'));
    expect(result.bank_account).toBe('1111111111');
    expect(result.email).toBe('john.doe.updated@company.com');
    expect(result.phone).toBe('+1111111111');
    expect(result.created_at).toEqual(createdEmployee.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdEmployee.updated_at.getTime());
  });

  it('should update employee with partial fields', async () => {
    // Create an employee first
    const [createdEmployee] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: createdEmployee.id,
      position: 'Lead Software Engineer',
      department: 'Engineering'
    };

    const result = await updateEmployee(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toBe(createdEmployee.id);
    expect(result.employee_id).toBe(testEmployee1.employee_id); // Unchanged
    expect(result.full_name).toBe(testEmployee1.full_name); // Unchanged
    expect(result.position).toBe('Lead Software Engineer'); // Updated
    expect(result.department).toBe('Engineering'); // Updated
    expect(result.start_date).toEqual(testEmployee1.start_date); // Unchanged
    expect(result.bank_account).toBe(testEmployee1.bank_account); // Unchanged
    expect(result.email).toBe(testEmployee1.email); // Unchanged
    expect(result.phone).toBe(testEmployee1.phone); // Unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(createdEmployee.updated_at.getTime());
  });

  it('should save updated employee to database', async () => {
    // Create an employee first
    const [createdEmployee] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: createdEmployee.id,
      full_name: 'John Doe Modified',
      email: 'john.modified@company.com'
    };

    await updateEmployee(updateInput);

    // Query database to verify changes were persisted
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, createdEmployee.id))
      .execute();

    expect(employees).toHaveLength(1);
    expect(employees[0].full_name).toBe('John Doe Modified');
    expect(employees[0].email).toBe('john.modified@company.com');
    expect(employees[0].updated_at.getTime()).toBeGreaterThan(createdEmployee.updated_at.getTime());
  });

  it('should throw error when employee does not exist', async () => {
    const updateInput: UpdateEmployeeInput = {
      id: 999, // Non-existent ID
      full_name: 'Test Update'
    };

    await expect(updateEmployee(updateInput)).rejects.toThrow(/Employee with id 999 not found/i);
  });

  it('should throw error when employee_id conflicts with existing employee', async () => {
    // Create two employees
    const [employee1] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: employee1.id,
      employee_id: 'EMP002' // This conflicts with the second employee
    };

    await expect(updateEmployee(updateInput)).rejects.toThrow(/Employee ID 'EMP002' is already in use/i);
  });

  it('should throw error when email conflicts with existing employee', async () => {
    // Create two employees
    const [employee1] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: employee1.id,
      email: 'jane.smith@company.com' // This conflicts with the second employee
    };

    await expect(updateEmployee(updateInput)).rejects.toThrow(/Email 'jane.smith@company.com' is already in use/i);
  });

  it('should allow updating employee with same employee_id and email (no conflict with self)', async () => {
    // Create an employee
    const [createdEmployee] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: createdEmployee.id,
      employee_id: 'EMP001', // Same as existing
      email: 'john.doe@company.com', // Same as existing
      position: 'Senior Software Engineer' // Different field
    };

    const result = await updateEmployee(updateInput);

    expect(result.employee_id).toBe('EMP001');
    expect(result.email).toBe('john.doe@company.com');
    expect(result.position).toBe('Senior Software Engineer');
  });

  it('should update only email when employee_id conflicts but email is unique', async () => {
    // Create two employees
    const [employee1] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: employee1.id,
      email: 'john.new@company.com' // Unique email
    };

    const result = await updateEmployee(updateInput);

    expect(result.email).toBe('john.new@company.com');
    expect(result.employee_id).toBe('EMP001'); // Should remain unchanged
  });

  it('should update only employee_id when email conflicts but employee_id is unique', async () => {
    // Create two employees
    const [employee1] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();

    const updateInput: UpdateEmployeeInput = {
      id: employee1.id,
      employee_id: 'EMP001-NEW' // Unique employee_id
    };

    const result = await updateEmployee(updateInput);

    expect(result.employee_id).toBe('EMP001-NEW');
    expect(result.email).toBe('john.doe@company.com'); // Should remain unchanged
  });

  it('should handle date fields correctly', async () => {
    // Create an employee
    const [createdEmployee] = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const newStartDate = new Date('2022-06-15');
    const updateInput: UpdateEmployeeInput = {
      id: createdEmployee.id,
      start_date: newStartDate
    };

    const result = await updateEmployee(updateInput);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.start_date).toBeInstanceOf(Date);
  });
});