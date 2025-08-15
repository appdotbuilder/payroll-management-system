import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  employeesTable, 
  salaryComponentsTable, 
  employeeSalaryComponentsTable,
  payrollPeriodsTable,
  payrollRecordsTable 
} from '../db/schema';
import { type GenerateReportInput } from '../schema';
import { generatePayrollReport } from '../handlers/generate_payroll_report';

describe('generatePayrollReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Setup test data helper
  const setupTestData = async () => {
    // Create employees in different departments
    const employees = await db.insert(employeesTable)
      .values([
        {
          employee_id: 'EMP001',
          full_name: 'John Doe',
          position: 'Developer',
          department: 'IT',
          start_date: new Date('2023-01-01'),
          bank_account: '1234567890',
          email: 'john.doe@company.com',
          phone: '+1234567890'
        },
        {
          employee_id: 'EMP002',
          full_name: 'Jane Smith',
          position: 'Manager',
          department: 'IT',
          start_date: new Date('2022-06-01'),
          bank_account: '0987654321',
          email: 'jane.smith@company.com',
          phone: '+0987654321'
        },
        {
          employee_id: 'EMP003',
          full_name: 'Bob Johnson',
          position: 'Accountant',
          department: 'Finance',
          start_date: new Date('2023-02-01'),
          bank_account: '1122334455',
          email: 'bob.johnson@company.com',
          phone: '+1122334455'
        }
      ])
      .returning()
      .execute();

    // Create salary components
    const salaryComponents = await db.insert(salaryComponentsTable)
      .values([
        { name: 'Base Salary', type: 'base_salary', description: 'Monthly base salary' },
        { name: 'Housing Allowance', type: 'allowance', description: 'Monthly housing allowance' },
        { name: 'Tax Deduction', type: 'deduction', description: 'Monthly tax deduction' }
      ])
      .returning()
      .execute();

    // Create employee salary components
    await db.insert(employeeSalaryComponentsTable)
      .values([
        // John Doe (IT)
        { employee_id: employees[0].id, salary_component_id: salaryComponents[0].id, amount: '5000.00' },
        { employee_id: employees[0].id, salary_component_id: salaryComponents[1].id, amount: '1000.00' },
        { employee_id: employees[0].id, salary_component_id: salaryComponents[2].id, amount: '500.00' },
        // Jane Smith (IT)
        { employee_id: employees[1].id, salary_component_id: salaryComponents[0].id, amount: '7000.00' },
        { employee_id: employees[1].id, salary_component_id: salaryComponents[1].id, amount: '1500.00' },
        { employee_id: employees[1].id, salary_component_id: salaryComponents[2].id, amount: '700.00' },
        // Bob Johnson (Finance)
        { employee_id: employees[2].id, salary_component_id: salaryComponents[0].id, amount: '4500.00' },
        { employee_id: employees[2].id, salary_component_id: salaryComponents[1].id, amount: '800.00' },
        { employee_id: employees[2].id, salary_component_id: salaryComponents[2].id, amount: '450.00' }
      ])
      .execute();

    // Create payroll periods
    const payrollPeriods = await db.insert(payrollPeriodsTable)
      .values([
        {
          year: 2024,
          month: 1,
          period_start: new Date('2024-01-01'),
          period_end: new Date('2024-01-31'),
          is_closed: true
        },
        {
          year: 2024,
          month: 2,
          period_start: new Date('2024-02-01'),
          period_end: new Date('2024-02-29'),
          is_closed: false
        }
      ])
      .returning()
      .execute();

    // Create payroll records for January 2024
    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employees[0].id,
          payroll_period_id: payrollPeriods[0].id,
          base_salary: '5000.00',
          total_allowances: '1000.00',
          total_deductions: '500.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '6000.00',
          net_salary: '5500.00'
        },
        {
          employee_id: employees[1].id,
          payroll_period_id: payrollPeriods[0].id,
          base_salary: '7000.00',
          total_allowances: '1500.00',
          total_deductions: '700.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '8500.00',
          net_salary: '7800.00'
        },
        {
          employee_id: employees[2].id,
          payroll_period_id: payrollPeriods[0].id,
          base_salary: '4500.00',
          total_allowances: '800.00',
          total_deductions: '450.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '5300.00',
          net_salary: '4850.00'
        }
      ])
      .execute();

    return { employees, salaryComponents, payrollPeriods };
  };

  it('should generate report for all departments', async () => {
    await setupTestData();

    const input: GenerateReportInput = {
      year: 2024,
      month: 1
    };

    const result = await generatePayrollReport(input);

    expect(result).toHaveLength(2); // IT and Finance departments
    
    // Find IT department report
    const itReport = result.find(r => r.department === 'IT');
    expect(itReport).toBeDefined();
    expect(itReport!.employee_count).toEqual(2);
    expect(itReport!.total_gross_salary).toEqual(14500); // 6000 + 8500
    expect(itReport!.total_net_salary).toEqual(13300); // 5500 + 7800
    expect(itReport!.total_allowances).toEqual(2500); // 1000 + 1500
    expect(itReport!.total_deductions).toEqual(1200); // 500 + 700

    // Find Finance department report
    const financeReport = result.find(r => r.department === 'Finance');
    expect(financeReport).toBeDefined();
    expect(financeReport!.employee_count).toEqual(1);
    expect(financeReport!.total_gross_salary).toEqual(5300);
    expect(financeReport!.total_net_salary).toEqual(4850);
    expect(financeReport!.total_allowances).toEqual(800);
    expect(financeReport!.total_deductions).toEqual(450);
  });

  it('should filter by specific department', async () => {
    await setupTestData();

    const input: GenerateReportInput = {
      year: 2024,
      month: 1,
      department: 'IT'
    };

    const result = await generatePayrollReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].department).toEqual('IT');
    expect(result[0].employee_count).toEqual(2);
    expect(result[0].total_gross_salary).toEqual(14500);
    expect(result[0].total_net_salary).toEqual(13300);
    expect(result[0].total_allowances).toEqual(2500);
    expect(result[0].total_deductions).toEqual(1200);
  });

  it('should return empty array when no payroll data exists for period', async () => {
    await setupTestData();

    const input: GenerateReportInput = {
      year: 2024,
      month: 3 // No payroll data for March
    };

    const result = await generatePayrollReport(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when department does not exist', async () => {
    await setupTestData();

    const input: GenerateReportInput = {
      year: 2024,
      month: 1,
      department: 'NonExistent'
    };

    const result = await generatePayrollReport(input);

    expect(result).toHaveLength(0);
  });

  it('should handle numeric calculations correctly', async () => {
    await setupTestData();

    const input: GenerateReportInput = {
      year: 2024,
      month: 1
    };

    const result = await generatePayrollReport(input);

    // Verify all numeric fields are numbers, not strings
    result.forEach(report => {
      expect(typeof report.employee_count).toBe('number');
      expect(typeof report.total_gross_salary).toBe('number');
      expect(typeof report.total_net_salary).toBe('number');
      expect(typeof report.total_allowances).toBe('number');
      expect(typeof report.total_deductions).toBe('number');
    });

    // Verify totals across all departments
    const totalGross = result.reduce((sum, r) => sum + r.total_gross_salary, 0);
    const totalNet = result.reduce((sum, r) => sum + r.total_net_salary, 0);
    const totalEmployees = result.reduce((sum, r) => sum + r.employee_count, 0);

    expect(totalGross).toEqual(19800); // 6000 + 8500 + 5300
    expect(totalNet).toEqual(18150); // 5500 + 7800 + 4850
    expect(totalEmployees).toEqual(3);
  });

  it('should handle periods with different years correctly', async () => {
    const { employees } = await setupTestData();

    // Create payroll period for different year
    const differentYearPeriod = await db.insert(payrollPeriodsTable)
      .values({
        year: 2023,
        month: 1,
        period_start: new Date('2023-01-01'),
        period_end: new Date('2023-01-31'),
        is_closed: true
      })
      .returning()
      .execute();

    // Create payroll record for 2023
    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employees[0].id,
        payroll_period_id: differentYearPeriod[0].id,
        base_salary: '3000.00',
        total_allowances: '500.00',
        total_deductions: '300.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '3500.00',
        net_salary: '3200.00'
      })
      .execute();

    // Query for 2024 data should not include 2023 record
    const result2024 = await generatePayrollReport({ year: 2024, month: 1 });
    const itReport2024 = result2024.find(r => r.department === 'IT');
    expect(itReport2024!.total_gross_salary).toEqual(14500); // Should not include 2023 data

    // Query for 2023 data should only include 2023 record
    const result2023 = await generatePayrollReport({ year: 2023, month: 1 });
    expect(result2023).toHaveLength(1);
    expect(result2023[0].department).toEqual('IT');
    expect(result2023[0].total_gross_salary).toEqual(3500);
  });
});