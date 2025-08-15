import { db } from '../db';
import { employeeSalaryComponentsTable } from '../db/schema';
import { type UpdateEmployeeSalaryComponentInput, type EmployeeSalaryComponent } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateEmployeeSalaryComponent(input: UpdateEmployeeSalaryComponentInput): Promise<EmployeeSalaryComponent> {
  try {
    // Update the employee salary component record with new amount and timestamp
    const result = await db.update(employeeSalaryComponentsTable)
      .set({
        amount: input.amount.toString(), // Convert number to string for numeric column
        updated_at: new Date()
      })
      .where(eq(employeeSalaryComponentsTable.id, input.id))
      .returning()
      .execute();

    // Check if record was found and updated
    if (result.length === 0) {
      throw new Error(`Employee salary component with id ${input.id} not found`);
    }

    const updated = result[0];
    
    // Convert numeric fields back to numbers before returning
    return {
      ...updated,
      amount: parseFloat(updated.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Employee salary component update failed:', error);
    throw error;
  }
}