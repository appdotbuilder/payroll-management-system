import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type CreateEmployeeInput, type Employee } from '../schema';

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  try {
    // Insert employee record
    const result = await db.insert(employeesTable)
      .values({
        employee_id: input.employee_id,
        full_name: input.full_name,
        position: input.position,
        department: input.department,
        start_date: input.start_date,
        bank_account: input.bank_account,
        email: input.email,
        phone: input.phone
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Employee creation failed:', error);
    throw error;
  }
}