import { db } from '../db';
import { employeesTable, employeeSalaryComponentsTable, salaryComponentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type EmployeeWithSalaryComponents } from '../schema';

export async function getEmployeeSalaryComponents(employeeId: number): Promise<EmployeeWithSalaryComponents | null> {
  try {
    // First, get the employee
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .execute();

    if (employees.length === 0) {
      return null;
    }

    const employee = employees[0];

    // Get all salary components for this employee with join
    const salaryComponentsResult = await db.select()
      .from(employeeSalaryComponentsTable)
      .innerJoin(
        salaryComponentsTable,
        eq(employeeSalaryComponentsTable.salary_component_id, salaryComponentsTable.id)
      )
      .where(eq(employeeSalaryComponentsTable.employee_id, employeeId))
      .execute();

    // Map the joined results to the expected format
    const salaryComponents = salaryComponentsResult.map(result => ({
      component: result.salary_components,
      amount: parseFloat(result.employee_salary_components.amount) // Convert numeric to number
    }));

    return {
      employee,
      salaryComponents
    };
  } catch (error) {
    console.error('Failed to get employee salary components:', error);
    throw error;
  }
}