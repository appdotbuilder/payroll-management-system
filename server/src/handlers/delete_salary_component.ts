import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteSalaryComponent(id: number): Promise<{ success: boolean }> {
  try {
    // First, verify that the salary component exists
    const existing = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Salary component with id ${id} not found`);
    }

    // Delete the salary component
    // This will cascade delete related employee salary components and payroll details
    // due to the foreign key constraints with onDelete: 'cascade'
    await db.delete(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Salary component deletion failed:', error);
    throw error;
  }
}