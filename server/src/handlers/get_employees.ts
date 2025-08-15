import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type Employee } from '../schema';
import { desc } from 'drizzle-orm';

export async function getEmployees(): Promise<Employee[]> {
  try {
    // Fetch all employees ordered by created_at descending (most recent first)
    const result = await db.select()
      .from(employeesTable)
      .orderBy(desc(employeesTable.created_at))
      .execute();

    // Return the employees (no numeric conversions needed for this table)
    return result;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error;
  }
}