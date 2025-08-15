import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type UpdateEmployeeInput, type Employee } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateEmployee = async (input: UpdateEmployeeInput): Promise<Employee> => {
  try {
    // First, check if the employee exists
    const existingEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.id))
      .execute();

    if (existingEmployee.length === 0) {
      throw new Error(`Employee with id ${input.id} not found`);
    }

    // Check for unique constraint violations if employee_id or email are being updated
    if (input.employee_id || input.email) {
      const conditions = [];
      
      if (input.employee_id) {
        conditions.push(eq(employeesTable.employee_id, input.employee_id));
      }
      
      if (input.email) {
        conditions.push(eq(employeesTable.email, input.email));
      }

      // Check for conflicts with other employees (not the current one)
      const conflictingEmployees = await db.select()
        .from(employeesTable)
        .where(
          and(
            ne(employeesTable.id, input.id),
            conditions.length === 1 ? conditions[0] : and(...conditions)
          )
        )
        .execute();

      if (conflictingEmployees.length > 0) {
        const conflictingEmployee = conflictingEmployees[0];
        if (input.employee_id && conflictingEmployee.employee_id === input.employee_id) {
          throw new Error(`Employee ID '${input.employee_id}' is already in use`);
        }
        if (input.email && conflictingEmployee.email === input.email) {
          throw new Error(`Email '${input.email}' is already in use`);
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.employee_id !== undefined) updateData.employee_id = input.employee_id;
    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.department !== undefined) updateData.department = input.department;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.bank_account !== undefined) updateData.bank_account = input.bank_account;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;

    // Update the employee record
    const result = await db.update(employeesTable)
      .set(updateData)
      .where(eq(employeesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Employee update failed:', error);
    throw error;
  }
};