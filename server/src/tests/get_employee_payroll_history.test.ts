import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, payrollPeriodsTable, payrollRecordsTable } from '../db/schema';
import { getEmployeePayrollHistory } from '../handlers/get_employee_payroll_history';

// Test data
const testEmployee = {
  employee_id: 'EMP001',
  full_name: 'John Doe',
  position: 'Software Engineer',
  department: 'IT',
  start_date: new Date('2023-01-01'),
  bank_account: '1234567890',
  email: 'john.doe@company.com',
  phone: '+1234567890'
};

const testPeriod1 = {
  year: 2024,
  month: 1,
  period_start: new Date('2024-01-01'),
  period_end: new Date('2024-01-31')
};

const testPeriod2 = {
  year: 2024,
  month: 2,
  period_start: new Date('2024-02-01'),
  period_end: new Date('2024-02-29')
};

const testPeriod3 = {
  year: 2023,
  month: 12,
  period_start: new Date('2023-12-01'),
  period_end: new Date('2023-12-31')
};

describe('getEmployeePayrollHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for employee with no payroll records', async () => {
    // Create employee only, no payroll records
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const result = await getEmployeePayrollHistory(employee.id);

    expect(result).toEqual([]);
  });

  it('should return payroll history ordered by period (most recent first)', async () => {
    // Create employee
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    // Create payroll periods
    const [period1] = await db.insert(payrollPeriodsTable)
      .values(testPeriod1)
      .returning()
      .execute();

    const [period2] = await db.insert(payrollPeriodsTable)
      .values(testPeriod2)
      .returning()
      .execute();

    const [period3] = await db.insert(payrollPeriodsTable)
      .values(testPeriod3)
      .returning()
      .execute();

    // Create payroll records in different order than expected result
    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employee.id,
          payroll_period_id: period3.id, // 2023-12 (oldest)
          base_salary: '5000.00',
          total_allowances: '500.00',
          total_deductions: '200.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '5300.00',
          net_salary: '5100.00'
        },
        {
          employee_id: employee.id,
          payroll_period_id: period1.id, // 2024-01 (middle)
          base_salary: '5500.00',
          total_allowances: '600.00',
          total_deductions: '250.00',
          overtime_hours: '10.50',
          overtime_amount: '300.00',
          bonus_amount: '1000.00',
          attendance_days: 21,
          gross_salary: '7400.00',
          net_salary: '7150.00'
        },
        {
          employee_id: employee.id,
          payroll_period_id: period2.id, // 2024-02 (newest)
          base_salary: '5500.00',
          total_allowances: '700.00',
          total_deductions: '300.00',
          overtime_hours: '5.25',
          overtime_amount: '150.00',
          bonus_amount: null,
          attendance_days: 20,
          gross_salary: '6050.00',
          net_salary: '5750.00'
        }
      ])
      .execute();

    const result = await getEmployeePayrollHistory(employee.id);

    expect(result).toHaveLength(3);

    // Verify ordering: 2024-02, 2024-01, 2023-12 (most recent first)
    expect(result[0].payroll_period_id).toEqual(period2.id);
    expect(result[1].payroll_period_id).toEqual(period1.id);
    expect(result[2].payroll_period_id).toEqual(period3.id);

    // Verify numeric conversions and field mapping
    expect(result[0].base_salary).toEqual(5500.00);
    expect(typeof result[0].base_salary).toBe('number');
    expect(result[0].total_allowances).toEqual(700.00);
    expect(result[0].total_deductions).toEqual(300.00);
    expect(result[0].overtime_hours).toEqual(5.25);
    expect(result[0].overtime_amount).toEqual(150.00);
    expect(result[0].bonus_amount).toBeNull();
    expect(result[0].gross_salary).toEqual(6050.00);
    expect(result[0].net_salary).toEqual(5750.00);

    // Verify null handling for nullable fields
    expect(result[2].overtime_hours).toBeNull();
    expect(result[2].overtime_amount).toBeNull();
    expect(result[2].bonus_amount).toBeNull();

    // Verify all required fields are present
    result.forEach(record => {
      expect(record.id).toBeDefined();
      expect(record.employee_id).toEqual(employee.id);
      expect(record.payroll_period_id).toBeDefined();
      expect(record.attendance_days).toBeDefined();
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return only records for specified employee', async () => {
    // Create two employees
    const [employee1] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    const [employee2] = await db.insert(employeesTable)
      .values({
        ...testEmployee,
        employee_id: 'EMP002',
        email: 'jane.doe@company.com'
      })
      .returning()
      .execute();

    // Create payroll period
    const [period] = await db.insert(payrollPeriodsTable)
      .values(testPeriod1)
      .returning()
      .execute();

    // Create payroll records for both employees
    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employee1.id,
          payroll_period_id: period.id,
          base_salary: '5000.00',
          total_allowances: '500.00',
          total_deductions: '200.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '5300.00',
          net_salary: '5100.00'
        },
        {
          employee_id: employee2.id,
          payroll_period_id: period.id,
          base_salary: '6000.00',
          total_allowances: '600.00',
          total_deductions: '300.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '6300.00',
          net_salary: '6000.00'
        }
      ])
      .execute();

    const result = await getEmployeePayrollHistory(employee1.id);

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual(employee1.id);
    expect(result[0].base_salary).toEqual(5000.00);
  });

  it('should handle employee with no records gracefully', async () => {
    // Test with non-existent employee ID
    const result = await getEmployeePayrollHistory(99999);

    expect(result).toEqual([]);
  });

  it('should maintain proper ordering within same year-month by creation date', async () => {
    // Create employee
    const [employee] = await db.insert(employeesTable)
      .values(testEmployee)
      .returning()
      .execute();

    // Create payroll period
    const [period] = await db.insert(payrollPeriodsTable)
      .values(testPeriod1)
      .returning()
      .execute();

    // Create multiple payroll records for same period (simulating corrections)
    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee.id,
        payroll_period_id: period.id,
        base_salary: '5000.00',
        total_allowances: '500.00',
        total_deductions: '200.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '5300.00',
        net_salary: '5100.00'
      })
      .execute();

    // Add a small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employee.id,
        payroll_period_id: period.id,
        base_salary: '5200.00', // Corrected record
        total_allowances: '500.00',
        total_deductions: '200.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '5500.00',
        net_salary: '5300.00'
      })
      .execute();

    const result = await getEmployeePayrollHistory(employee.id);

    expect(result).toHaveLength(2);
    
    // Most recent should be first (corrected record)
    expect(result[0].base_salary).toEqual(5200.00);
    expect(result[1].base_salary).toEqual(5000.00);
  });
});