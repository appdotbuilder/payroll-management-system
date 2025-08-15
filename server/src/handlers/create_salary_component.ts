import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type CreateSalaryComponentInput, type SalaryComponent } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createSalaryComponent = async (input: CreateSalaryComponentInput): Promise<SalaryComponent> => {
  try {
    // Check for name uniqueness within the same type
    const existingComponent = await db.select()
      .from(salaryComponentsTable)
      .where(
        and(
          eq(salaryComponentsTable.name, input.name),
          eq(salaryComponentsTable.type, input.type)
        )
      )
      .limit(1)
      .execute();

    if (existingComponent.length > 0) {
      throw new Error(`Salary component with name '${input.name}' already exists for type '${input.type}'`);
    }

    // Insert salary component record
    const result = await db.insert(salaryComponentsTable)
      .values({
        name: input.name,
        type: input.type,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Salary component creation failed:', error);
    throw error;
  }
};