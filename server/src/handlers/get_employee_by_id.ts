import { db } from '../db';
import { employeesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Employee } from '../schema';

export async function getEmployeeById(id: number): Promise<Employee | null> {
  try {
    const result = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) result
    return result[0];
  } catch (error) {
    console.error('Failed to get employee by ID:', error);
    throw error;
  }
}