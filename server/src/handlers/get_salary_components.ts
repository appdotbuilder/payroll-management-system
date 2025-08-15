import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type SalaryComponent, type SalaryComponentType } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getSalaryComponents(type?: SalaryComponentType): Promise<SalaryComponent[]> {
  try {
    // Build query with conditional where clause
    const baseQuery = db.select().from(salaryComponentsTable);

    const results = type !== undefined
      ? await baseQuery
          .where(eq(salaryComponentsTable.type, type))
          .orderBy(
            asc(salaryComponentsTable.type),
            asc(salaryComponentsTable.name)
          )
          .execute()
      : await baseQuery
          .orderBy(
            asc(salaryComponentsTable.type),
            asc(salaryComponentsTable.name)
          )
          .execute();

    // Convert all results to proper types (no numeric fields in this table)
    return results;
  } catch (error) {
    console.error('Failed to get salary components:', error);
    throw error;
  }
}