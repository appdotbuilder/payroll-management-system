import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  employeesTable, 
  payrollPeriodsTable, 
  payrollRecordsTable,
  payrollDetailsTable,
  salaryComponentsTable,
  employeeSalaryComponentsTable
} from '../db/schema';
import { processBulkPayroll } from '../handlers/process_bulk_payroll';
import { eq, and } from 'drizzle-orm';
import { type CreateEmployeeInput, type CreatePayrollPeriodInput, type CreateSalaryComponentInput } from '../schema';

// Test data
const testEmployee1: CreateEmployeeInput = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'Engineering',
  start_date: new Date('2023-01-01'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1234567890'
};

const testEmployee2: CreateEmployeeInput = {
  employee_id: 'EMP002',
  full_name: 'Jane Smith',
  position: 'Senior Developer',
  department: 'Engineering',
  start_date: new Date('2023-02-01'),
  bank_account: '0987654321',
  email: 'jane.smith@company.com',
  phone: '+0987654321'
};

const testPeriod: CreatePayrollPeriodInput = {
  year: 2024,
  month: 1,
  period_start: new Date('2024-01-01'),
  period_end: new Date('2024-01-31')
};

const baseSalaryComponent: CreateSalaryComponentInput = {
  name: 'Base Salary',
  type: 'base_salary',
  description: 'Monthly base salary'
};

const allowanceComponent: CreateSalaryComponentInput = {
  name: 'Transport Allowance',
  type: 'allowance',
  description: 'Monthly transport allowance'
};

const deductionComponent: CreateSalaryComponentInput = {
  name: 'Health Insurance',
  type: 'deduction',
  description: 'Health insurance premium'
};

describe('processBulkPayroll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process payroll for all eligible employees', async () => {
    // Create employees
    const employee1Result = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();
    const employee1 = employee1Result[0];

    const employee2Result = await db.insert(employeesTable)
      .values(testEmployee2)
      .returning()
      .execute();
    const employee2 = employee2Result[0];

    // Create payroll period
    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    // Create salary components
    const baseSalaryResult = await db.insert(salaryComponentsTable)
      .values(baseSalaryComponent)
      .returning()
      .execute();
    const baseSalary = baseSalaryResult[0];

    const allowanceResult = await db.insert(salaryComponentsTable)
      .values(allowanceComponent)
      .returning()
      .execute();
    const allowance = allowanceResult[0];

    const deductionResult = await db.insert(salaryComponentsTable)
      .values(deductionComponent)
      .returning()
      .execute();
    const deduction = deductionResult[0];

    // Assign salary components to employees
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee1.id,
          salary_component_id: baseSalary.id,
          amount: '5000.00'
        },
        {
          employee_id: employee1.id,
          salary_component_id: allowance.id,
          amount: '500.00'
        },
        {
          employee_id: employee1.id,
          salary_component_id: deduction.id,
          amount: '200.00'
        },
        {
          employee_id: employee2.id,
          salary_component_id: baseSalary.id,
          amount: '6000.00'
        },
        {
          employee_id: employee2.id,
          salary_component_id: allowance.id,
          amount: '600.00'
        },
        {
          employee_id: employee2.id,
          salary_component_id: deduction.id,
          amount: '250.00'
        }
      ])
      .execute();

    // Process bulk payroll
    const result = await processBulkPayroll(period.id);

    // Should process payroll for both employees
    expect(result).toHaveLength(2);

    // Verify payroll calculations for employee 1
    const employee1Payroll = result.find(r => r.employee_id === employee1.id);
    expect(employee1Payroll).toBeDefined();
    expect(employee1Payroll!.base_salary).toEqual(5000);
    expect(employee1Payroll!.total_allowances).toEqual(500);
    expect(employee1Payroll!.total_deductions).toEqual(200);
    expect(employee1Payroll!.gross_salary).toEqual(5500);
    expect(employee1Payroll!.net_salary).toEqual(5300);
    expect(employee1Payroll!.payroll_period_id).toEqual(period.id);

    // Verify payroll calculations for employee 2
    const employee2Payroll = result.find(r => r.employee_id === employee2.id);
    expect(employee2Payroll).toBeDefined();
    expect(employee2Payroll!.base_salary).toEqual(6000);
    expect(employee2Payroll!.total_allowances).toEqual(600);
    expect(employee2Payroll!.total_deductions).toEqual(250);
    expect(employee2Payroll!.gross_salary).toEqual(6600);
    expect(employee2Payroll!.net_salary).toEqual(6350);
    expect(employee2Payroll!.payroll_period_id).toEqual(period.id);

    // Verify records are saved to database
    const dbRecords = await db.select()
      .from(payrollRecordsTable)
      .where(eq(payrollRecordsTable.payroll_period_id, period.id))
      .execute();

    expect(dbRecords).toHaveLength(2);
  });

  it('should create payroll details for each salary component', async () => {
    // Create employee and components
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    const baseSalaryResult = await db.insert(salaryComponentsTable)
      .values(baseSalaryComponent)
      .returning()
      .execute();
    const baseSalary = baseSalaryResult[0];

    const allowanceResult = await db.insert(salaryComponentsTable)
      .values(allowanceComponent)
      .returning()
      .execute();
    const allowance = allowanceResult[0];

    // Assign salary components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee.id,
          salary_component_id: baseSalary.id,
          amount: '5000.00'
        },
        {
          employee_id: employee.id,
          salary_component_id: allowance.id,
          amount: '500.00'
        }
      ])
      .execute();

    // Process payroll
    const result = await processBulkPayroll(period.id);
    const payrollRecord = result[0];

    // Verify payroll details were created
    const details = await db.select()
      .from(payrollDetailsTable)
      .where(eq(payrollDetailsTable.payroll_record_id, payrollRecord.id))
      .execute();

    expect(details).toHaveLength(2);

    // Verify detail amounts
    const baseSalaryDetail = details.find(d => d.salary_component_id === baseSalary.id);
    const allowanceDetail = details.find(d => d.salary_component_id === allowance.id);

    expect(baseSalaryDetail).toBeDefined();
    expect(parseFloat(baseSalaryDetail!.amount)).toEqual(5000);

    expect(allowanceDetail).toBeDefined();
    expect(parseFloat(allowanceDetail!.amount)).toEqual(500);
  });

  it('should skip employees who already have payroll records for the period', async () => {
    // Create employee and period
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    // Create existing payroll record
    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee.id,
        payroll_period_id: period.id,
        base_salary: '5000.00',
        total_allowances: '500.00',
        total_deductions: '200.00',
        gross_salary: '5500.00',
        net_salary: '5300.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: null
      })
      .execute();

    // Process bulk payroll
    const result = await processBulkPayroll(period.id);

    // Should not process any employees (employee already has record)
    expect(result).toHaveLength(0);
  });

  it('should handle employees with only base salary', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    // Create only base salary component
    const baseSalaryResult = await db.insert(salaryComponentsTable)
      .values(baseSalaryComponent)
      .returning()
      .execute();
    const baseSalary = baseSalaryResult[0];

    await db.insert(employeeSalaryComponentsTable)
      .values({
        employee_id: employee.id,
        salary_component_id: baseSalary.id,
        amount: '5000.00'
      })
      .execute();

    // Process payroll
    const result = await processBulkPayroll(period.id);

    expect(result).toHaveLength(1);
    expect(result[0].base_salary).toEqual(5000);
    expect(result[0].total_allowances).toEqual(0);
    expect(result[0].total_deductions).toEqual(0);
    expect(result[0].gross_salary).toEqual(5000);
    expect(result[0].net_salary).toEqual(5000);
  });

  it('should handle employees with no salary components', async () => {
    // Create employee with no salary components
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();

    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    // Process payroll
    const result = await processBulkPayroll(period.id);

    expect(result).toHaveLength(1);
    expect(result[0].base_salary).toEqual(0);
    expect(result[0].total_allowances).toEqual(0);
    expect(result[0].total_deductions).toEqual(0);
    expect(result[0].gross_salary).toEqual(0);
    expect(result[0].net_salary).toEqual(0);
  });

  it('should throw error if payroll period does not exist', async () => {
    expect(processBulkPayroll(999)).rejects.toThrow(/period not found/i);
  });

  it('should throw error if payroll period is closed', async () => {
    // Create closed period
    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        ...testPeriod,
        is_closed: true
      })
      .returning()
      .execute();
    const period = periodResult[0];

    expect(processBulkPayroll(period.id)).rejects.toThrow(/closed period/i);
  });

  it('should return empty array if no eligible employees exist', async () => {
    // Create period but no employees
    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    const result = await processBulkPayroll(period.id);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple salary components of same type correctly', async () => {
    // Create employee
    const employeeResult = await db.insert(employeesTable)
      .values(testEmployee1)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const periodResult = await db.insert(payrollPeriodsTable)
      .values(testPeriod)
      .returning()
      .execute();
    const period = periodResult[0];

    // Create multiple allowance components
    const transportAllowanceResult = await db.insert(salaryComponentsTable)
      .values({
        name: 'Transport Allowance',
        type: 'allowance',
        description: 'Transport allowance'
      })
      .returning()
      .execute();

    const mealAllowanceResult = await db.insert(salaryComponentsTable)
      .values({
        name: 'Meal Allowance',
        type: 'allowance',
        description: 'Meal allowance'
      })
      .returning()
      .execute();

    const baseSalaryResult = await db.insert(salaryComponentsTable)
      .values(baseSalaryComponent)
      .returning()
      .execute();

    // Assign multiple components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        {
          employee_id: employee.id,
          salary_component_id: baseSalaryResult[0].id,
          amount: '5000.00'
        },
        {
          employee_id: employee.id,
          salary_component_id: transportAllowanceResult[0].id,
          amount: '300.00'
        },
        {
          employee_id: employee.id,
          salary_component_id: mealAllowanceResult[0].id,
          amount: '200.00'
        }
      ])
      .execute();

    // Process payroll
    const result = await processBulkPayroll(period.id);

    expect(result).toHaveLength(1);
    expect(result[0].base_salary).toEqual(5000);
    expect(result[0].total_allowances).toEqual(500); // 300 + 200
    expect(result[0].total_deductions).toEqual(0);
    expect(result[0].gross_salary).toEqual(5500);
    expect(result[0].net_salary).toEqual(5500);
  });
});