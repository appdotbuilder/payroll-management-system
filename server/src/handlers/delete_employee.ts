import { db } from '../db';
import { employeesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteEmployee(id: number): Promise<{ success: boolean }> {
  try {
    // First check if employee exists
    const existingEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .execute();

    if (existingEmployee.length === 0) {
      throw new Error(`Employee with id ${id} not found`);
    }

    // Delete the employee - cascade deletes will handle related records
    const result = await db.delete(employeesTable)
      .where(eq(employeesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Employee deletion failed:', error);
    throw error;
  }
}