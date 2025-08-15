import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type UpdateSalaryComponentInput, type SalaryComponent } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSalaryComponent = async (input: UpdateSalaryComponentInput): Promise<SalaryComponent> => {
  try {
    // Check if the component exists
    const existingComponent = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, input.id))
      .execute();

    if (existingComponent.length === 0) {
      throw new Error(`Salary component with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof salaryComponentsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the salary component
    const result = await db.update(salaryComponentsTable)
      .set(updateData)
      .where(eq(salaryComponentsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Salary component update failed:', error);
    throw error;
  }
};