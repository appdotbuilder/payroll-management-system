import { db } from '../db';
import { employeeSalaryComponentsTable, payrollDetailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteEmployeeSalaryComponent = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, verify that the employee salary component exists
    const existingComponent = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, id))
      .execute();

    if (existingComponent.length === 0) {
      throw new Error('Employee salary component not found');
    }

    // Delete related payroll details first (due to foreign key constraints)
    // This will remove the component from any existing payroll calculations
    await db.delete(payrollDetailsTable)
      .where(eq(payrollDetailsTable.salary_component_id, existingComponent[0].salary_component_id))
      .execute();

    // Now delete the employee salary component assignment
    await db.delete(employeeSalaryComponentsTable)
      .where(eq(employeeSalaryComponentsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Employee salary component deletion failed:', error);
    throw error;
  }
};