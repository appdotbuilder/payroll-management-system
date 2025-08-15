import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, salaryComponentsTable, employeeSalaryComponentsTable } from '../db/schema';
import { getEmployeeSalaryComponents } from '../handlers/get_employee_salary_components';

describe('getEmployeeSalaryComponents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent employee', async () => {
    const result = await getEmployeeSalaryComponents(999);
    expect(result).toBeNull();
  });

  it('should return employee with empty salary components array when no components assigned', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '1234567890',
        email: 'john@example.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    const result = await getEmployeeSalaryComponents(employee.id);

    expect(result).not.toBeNull();
    expect(result!.employee.id).toEqual(employee.id);
    expect(result!.employee.full_name).toEqual('John Doe');
    expect(result!.employee.position).toEqual('Developer');
    expect(result!.employee.department).toEqual('IT');
    expect(result!.salaryComponents).toEqual([]);
  });

  it('should return employee with single salary component', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'John Doe',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '1234567890',
        email: 'john@example.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create salary component
    const componentResult = await db.insert(salaryComponentsTable)
      .values({
        name: 'Base Salary',
        type: 'base_salary',
        description: 'Monthly base salary'
      })
      .returning()
      .execute();

    const component = componentResult[0];

    // Link employee to salary component
    await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee.id,
        salary_component_id: component.id,
        amount: '5000.00'
      })
      .execute();

    const result = await getEmployeeSalaryComponents(employee.id);

    expect(result).not.toBeNull();
    expect(result!.employee.id).toEqual(employee.id);
    expect(result!.employee.full_name).toEqual('John Doe');
    expect(result!.salaryComponents).toHaveLength(1);
    expect(result!.salaryComponents[0].component.name).toEqual('Base Salary');
    expect(result!.salaryComponents[0].component.type).toEqual('base_salary');
    expect(result!.salaryComponents[0].component.description).toEqual('Monthly base salary');
    expect(result!.salaryComponents[0].amount).toEqual(5000);
    expect(typeof result!.salaryComponents[0].amount).toBe('number');
  });

  it('should return employee with multiple salary components of different types', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'Jane Smith',
        position: 'Manager',
        department: 'HR',
        start_date: new Date('2022-06-15'),
        bank_account: '9876543210',
        email: 'jane@example.com',
        phone: '987-654-3210'
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create multiple salary components
    const componentsResult = await db.insert(salaryComponentsTable)
      .values([
        {
          name: 'Base Salary',
          type: 'base_salary',
          description: 'Monthly base salary'
        },
        {
          name: 'Housing Allowance',
          type: 'allowance',
          description: 'Monthly housing allowance'
        },
        {
          name: 'Tax Deduction',
          type: 'deduction',
          description: 'Income tax deduction'
        }
      ])
      .returning()
      .execute();

    // Link employee to all salary components with different amounts
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee.id,
          salary_component_id: componentsResult[0].id,
          amount: '6000.00'
        },
        {
          employee_id: employee.id,
          salary_component_id: componentsResult[1].id,
          amount: '1500.50'
        },
        {
          employee_id: employee.id,
          salary_component_id: componentsResult[2].id,
          amount: '800.25'
        }
      ])
      .execute();

    const result = await getEmployeeSalaryComponents(employee.id);

    expect(result).not.toBeNull();
    expect(result!.employee.id).toEqual(employee.id);
    expect(result!.employee.full_name).toEqual('Jane Smith');
    expect(result!.employee.position).toEqual('Manager');
    expect(result!.employee.department).toEqual('HR');
    expect(result!.salaryComponents).toHaveLength(3);

    // Check all salary components are present with correct amounts
    const baseSalary = result!.salaryComponents.find(sc => sc.component.type === 'base_salary');
    expect(baseSalary).toBeDefined();
    expect(baseSalary!.component.name).toEqual('Base Salary');
    expect(baseSalary!.amount).toEqual(6000);
    expect(typeof baseSalary!.amount).toBe('number');

    const allowance = result!.salaryComponents.find(sc => sc.component.type === 'allowance');
    expect(allowance).toBeDefined();
    expect(allowance!.component.name).toEqual('Housing Allowance');
    expect(allowance!.amount).toEqual(1500.5);
    expect(typeof allowance!.amount).toBe('number');

    const deduction = result!.salaryComponents.find(sc => sc.component.type === 'deduction');
    expect(deduction).toBeDefined();
    expect(deduction!.component.name).toEqual('Tax Deduction');
    expect(deduction!.amount).toEqual(800.25);
    expect(typeof deduction!.amount).toBe('number');
  });

  it('should handle decimal amounts correctly', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'Test Employee',
        position: 'Tester',
        department: 'QA',
        start_date: new Date('2023-01-01'),
        bank_account: '1111111111',
        email: 'test@example.com',
        phone: '111-111-1111'
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Create salary component
    const componentResult = await db.insert(salaryComponentsTable)
      .values({
        name: 'Performance Bonus',
        type: 'allowance',
        description: null
      })
      .returning()
      .execute();

    const component = componentResult[0];

    // Link employee to salary component with decimal amount
    await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee.id,
        salary_component_id: component.id,
        amount: '2500.75'
      })
      .execute();

    const result = await getEmployeeSalaryComponents(employee.id);

    expect(result).not.toBeNull();
    expect(result!.salaryComponents).toHaveLength(1);
    expect(result!.salaryComponents[0].amount).toEqual(2500.75);
    expect(typeof result!.salaryComponents[0].amount).toBe('number');
    expect(result!.salaryComponents[0].component.description).toBeNull();
  });

  it('should return correct employee when multiple employees exist', async () => {
    // Create multiple employees
    const employeesResult = await db.insert(employeesTable)
      .values([
        {
          employee_id: 'EMP001',
          full_name: 'Employee One',
          position: 'Developer',
          department: 'IT',
          start_date: new Date('2023-01-01'),
          bank_account: '1111111111',
          email: 'emp1@example.com',
          phone: '111-111-1111'
        },
        {
          employee_id: 'EMP002',
          full_name: 'Employee Two',
          position: 'Manager',
          department: 'HR',
          start_date: new Date('2023-02-01'),
          bank_account: '2222222222',
          email: 'emp2@example.com',
          phone: '222-222-2222'
        }
      ])
      .returning()
      .execute();

    // Create salary component
    const componentResult = await db.insert(salaryComponentsTable)
      .values({
        name: 'Base Salary',
        type: 'base_salary',
        description: 'Monthly salary'
      })
      .returning()
      .execute();

    const component = componentResult[0];

    // Link only second employee to salary component
    await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employeesResult[1].id,
        salary_component_id: component.id,
        amount: '7000.00'
      })
      .execute();

    const result = await getEmployeeSalaryComponents(employeesResult[1].id);

    expect(result).not.toBeNull();
    expect(result!.employee.id).toEqual(employeesResult[1].id);
    expect(result!.employee.full_name).toEqual('Employee Two');
    expect(result!.employee.position).toEqual('Manager');
    expect(result!.salaryComponents).toHaveLength(1);
    expect(result!.salaryComponents[0].amount).toEqual(7000);
  });
});