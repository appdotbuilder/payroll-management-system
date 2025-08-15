import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  employeesTable,
  salaryComponentsTable,
  employeeSalaryComponentsTable,
  payrollPeriodsTable,
  payrollRecordsTable,
  payrollDetailsTable
} from '../db/schema';
import { getPayrollRecordWithDetails } from '../handlers/get_payroll_record_with_details';

describe('getPayrollRecordWithDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent payroll record', async () => {
    const result = await getPayrollRecordWithDetails(999);
    expect(result).toBeNull();
  });

  it('should fetch complete payroll record with all details', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable).values({
      employee_id: 'EMP001',
      full_name: 'John Doe',
      position: 'Software Engineer',
      department: 'IT',
      start_date: new Date('2024-01-01'),
      bank_account: '1234567890',
      email: 'john.doe@company.com',
      phone: '+1234567890'
    }).returning().execute();
    
    const employee = employeeResult[0];

    // Create salary components
    const baseSalaryResult = await db.insert(salaryComponentsTable).values({
      name: 'Base Salary',
      type: 'base_salary',
      description: 'Monthly base salary'
    }).returning().execute();
    
    const allowanceResult = await db.insert(salaryComponentsTable).values({
      name: 'Housing Allowance',
      type: 'allowance',
      description: 'Monthly housing allowance'
    }).returning().execute();
    
    const deductionResult = await db.insert(salaryComponentsTable).values({
      name: 'Tax Deduction',
      type: 'deduction',
      description: 'Monthly tax deduction'
    }).returning().execute();

    const baseSalaryComponent = baseSalaryResult[0];
    const allowanceComponent = allowanceResult[0];
    const deductionComponent = deductionResult[0];

    // Create employee salary components
    await db.insert(employeeSalaryComponentsTable).values([
      {
        employee_id: employee.id,
        salary_component_id: baseSalaryComponent.id,
        amount: '5000.00'
      },
      {
        employee_id: employee.id,
        salary_component_id: allowanceComponent.id,
        amount: '1000.00'
      },
      {
        employee_id: employee.id,
        salary_component_id: deductionComponent.id,
        amount: '500.00'
      }
    ]).execute();

    // Create payroll period
    const periodResult = await db.insert(payrollPeriodsTable).values({
      year: 2024,
      month: 3,
      period_start: new Date('2024-03-01'),
      period_end: new Date('2024-03-31')
    }).returning().execute();
    
    const period = periodResult[0];

    // Create payroll record
    const payrollResult = await db.insert(payrollRecordsTable).values({
      employee_id: employee.id,
      payroll_period_id: period.id,
      base_salary: '5000.00',
      total_allowances: '1000.00',
      total_deductions: '500.00',
      overtime_hours: '8.50',
      overtime_amount: '425.00',
      bonus_amount: '200.00',
      attendance_days: 22,
      gross_salary: '6625.00',
      net_salary: '6125.00'
    }).returning().execute();
    
    const payrollRecord = payrollResult[0];

    // Create payroll details
    await db.insert(payrollDetailsTable).values([
      {
        payroll_record_id: payrollRecord.id,
        salary_component_id: baseSalaryComponent.id,
        amount: '5000.00'
      },
      {
        payroll_record_id: payrollRecord.id,
        salary_component_id: allowanceComponent.id,
        amount: '1000.00'
      },
      {
        payroll_record_id: payrollRecord.id,
        salary_component_id: deductionComponent.id,
        amount: '500.00'
      }
    ]).execute();

    // Test the handler
    const result = await getPayrollRecordWithDetails(payrollRecord.id);

    expect(result).not.toBeNull();
    expect(result!.record.id).toBe(payrollRecord.id);
    expect(result!.record.employee_id).toBe(employee.id);
    
    // Test numeric field conversions
    expect(typeof result!.record.base_salary).toBe('number');
    expect(result!.record.base_salary).toBe(5000);
    expect(result!.record.total_allowances).toBe(1000);
    expect(result!.record.total_deductions).toBe(500);
    expect(result!.record.overtime_hours).toBe(8.5);
    expect(result!.record.overtime_amount).toBe(425);
    expect(result!.record.bonus_amount).toBe(200);
    expect(result!.record.gross_salary).toBe(6625);
    expect(result!.record.net_salary).toBe(6125);
    expect(result!.record.attendance_days).toBe(22);
    
    // Test employee data
    expect(result!.employee.id).toBe(employee.id);
    expect(result!.employee.employee_id).toBe('EMP001');
    expect(result!.employee.full_name).toBe('John Doe');
    expect(result!.employee.position).toBe('Software Engineer');
    expect(result!.employee.department).toBe('IT');
    
    // Test period data
    expect(result!.period.id).toBe(period.id);
    expect(result!.period.year).toBe(2024);
    expect(result!.period.month).toBe(3);
    
    // Test details array
    expect(result!.details).toHaveLength(3);
    
    const baseSalaryDetail = result!.details.find(d => d.component.name === 'Base Salary');
    expect(baseSalaryDetail).toBeDefined();
    expect(baseSalaryDetail!.component.type).toBe('base_salary');
    expect(typeof baseSalaryDetail!.amount).toBe('number');
    expect(baseSalaryDetail!.amount).toBe(5000);
    
    const allowanceDetail = result!.details.find(d => d.component.name === 'Housing Allowance');
    expect(allowanceDetail).toBeDefined();
    expect(allowanceDetail!.component.type).toBe('allowance');
    expect(allowanceDetail!.amount).toBe(1000);
    
    const deductionDetail = result!.details.find(d => d.component.name === 'Tax Deduction');
    expect(deductionDetail).toBeDefined();
    expect(deductionDetail!.component.type).toBe('deduction');
    expect(deductionDetail!.amount).toBe(500);
  });

  it('should handle payroll record with no details', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable).values({
      employee_id: 'EMP002',
      full_name: 'Jane Smith',
      position: 'Manager',
      department: 'HR',
      start_date: new Date('2024-01-01'),
      bank_account: '9876543210',
      email: 'jane.smith@company.com',
      phone: '+9876543210'
    }).returning().execute();
    
    const employee = employeeResult[0];

    // Create payroll period
    const periodResult = await db.insert(payrollPeriodsTable).values({
      year: 2024,
      month: 4,
      period_start: new Date('2024-04-01'),
      period_end: new Date('2024-04-30')
    }).returning().execute();
    
    const period = periodResult[0];

    // Create payroll record without details
    const payrollResult = await db.insert(payrollRecordsTable).values({
      employee_id: employee.id,
      payroll_period_id: period.id,
      base_salary: '3000.00',
      total_allowances: '0.00',
      total_deductions: '0.00',
      overtime_hours: null,
      overtime_amount: null,
      bonus_amount: null,
      attendance_days: null,
      gross_salary: '3000.00',
      net_salary: '3000.00'
    }).returning().execute();
    
    const payrollRecord = payrollResult[0];

    // Test the handler
    const result = await getPayrollRecordWithDetails(payrollRecord.id);

    expect(result).not.toBeNull();
    expect(result!.record.id).toBe(payrollRecord.id);
    expect(result!.record.base_salary).toBe(3000);
    expect(result!.record.overtime_hours).toBeNull();
    expect(result!.record.overtime_amount).toBeNull();
    expect(result!.record.bonus_amount).toBeNull();
    expect(result!.record.attendance_days).toBeNull();
    expect(result!.employee.full_name).toBe('Jane Smith');
    expect(result!.period.month).toBe(4);
    expect(result!.details).toHaveLength(0);
  });

  it('should handle payroll record with nullable numeric fields', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable).values({
      employee_id: 'EMP003',
      full_name: 'Bob Wilson',
      position: 'Analyst',
      department: 'Finance',
      start_date: new Date('2024-01-01'),
      bank_account: '5555555555',
      email: 'bob.wilson@company.com',
      phone: '+5555555555'
    }).returning().execute();
    
    const employee = employeeResult[0];

    // Create payroll period
    const periodResult = await db.insert(payrollPeriodsTable).values({
      year: 2024,
      month: 5,
      period_start: new Date('2024-05-01'),
      period_end: new Date('2024-05-31')
    }).returning().execute();
    
    const period = periodResult[0];

    // Create payroll record with some null numeric fields
    const payrollResult = await db.insert(payrollRecordsTable).values({
      employee_id: employee.id,
      payroll_period_id: period.id,
      base_salary: '4000.00',
      total_allowances: '500.00',
      total_deductions: '200.00',
      overtime_hours: '2.5',
      overtime_amount: '125.00',
      bonus_amount: null, // This is null
      attendance_days: 20,
      gross_salary: '4625.00',
      net_salary: '4425.00'
    }).returning().execute();
    
    const payrollRecord = payrollResult[0];

    // Test the handler
    const result = await getPayrollRecordWithDetails(payrollRecord.id);

    expect(result).not.toBeNull();
    expect(result!.record.overtime_hours).toBe(2.5);
    expect(result!.record.overtime_amount).toBe(125);
    expect(result!.record.bonus_amount).toBeNull();
    expect(result!.record.attendance_days).toBe(20);
  });
});