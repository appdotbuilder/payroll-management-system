import { db } from '../db';
import { employeesTable, salaryComponentsTable, employeeSalaryComponentsTable } from '../db/schema';
import { type CreateEmployeeSalaryComponentInput, type EmployeeSalaryComponent } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createEmployeeSalaryComponent(input: CreateEmployeeSalaryComponentInput): Promise<EmployeeSalaryComponent> {
  try {
    // Validate that employee exists
    const employee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error(`Employee with id ${input.employee_id} not found`);
    }

    // Validate that salary component exists
    const salaryComponent = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, input.salary_component_id))
      .execute();

    if (salaryComponent.length === 0) {
      throw new Error(`Salary component with id ${input.salary_component_id} not found`);
    }

    // Check for duplicate assignment
    const existingAssignment = await db.select()
      .from(employeeSalaryComponentsTable)
      .where(and(
        eq(employeeSalaryComponentsTable.employee_id, input.employee_id),
        eq(employeeSalaryComponentsTable.salary_component_id, input.salary_component_id)
      ))
      .execute();

    if (existingAssignment.length > 0) {
      throw new Error(`Salary component ${input.salary_component_id} is already assigned to employee ${input.employee_id}`);
    }

    // Create the employee salary component assignment
    const result = await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: input.employee_id,
        salary_component_id: input.salary_component_id,
        amount: input.amount.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const employeeSalaryComponent = result[0];
    return {
      ...employeeSalaryComponent,
      amount: parseFloat(employeeSalaryComponent.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Employee salary component creation failed:', error);
    throw error;
  }
}