import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, payrollPeriodsTable, payrollRecordsTable } from '../db/schema';
import { getPayrollRecords } from '../handlers/get_payroll_records';

describe('getPayrollRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payroll records exist', async () => {
    const result = await getPayrollRecords();
    expect(result).toEqual([]);
  });

  it('should fetch all payroll records ordered by employee name', async () => {
    // Create test employees
    const employeeResults = await db.insert(employeesTable)
      .values([
        {
          employee_id: 'EMP002',
          full_name: 'Bob Smith',
          position: 'Manager',
          department: 'HR',
          start_date: new Date('2023-01-01'),
          bank_account: '987654321',
          email: 'bob@test.com',
          phone: '555-0002'
        },
        {
          employee_id: 'EMP001',
          full_name: 'Alice Johnson',
          position: 'Developer',
          department: 'IT',
          start_date: new Date('2023-01-15'),
          bank_account: '123456789',
          email: 'alice@test.com',
          phone: '555-0001'
        }
      ])
      .returning()
      .execute();

    // Create test payroll period
    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      })
      .returning()
      .execute();

    // Create test payroll records
    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employeeResults[0].id, // Bob Smith
          payroll_period_id: periodResult[0].id,
          base_salary: '5000.00',
          total_allowances: '500.00',
          total_deductions: '200.00',
          overtime_hours: '10.50',
          overtime_amount: '150.75',
          bonus_amount: '1000.00',
          attendance_days: 22,
          gross_salary: '6650.75',
          net_salary: '6450.75'
        },
        {
          employee_id: employeeResults[1].id, // Alice Johnson
          payroll_period_id: periodResult[0].id,
          base_salary: '4000.00',
          total_allowances: '300.00',
          total_deductions: '150.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 21,
          gross_salary: '4300.00',
          net_salary: '4150.00'
        }
      ])
      .execute();

    const result = await getPayrollRecords();

    expect(result).toHaveLength(2);
    
    // Should be ordered by employee name (Alice first, then Bob)
    expect(result[0].employee_id).toBe(employeeResults[1].id); // Alice Johnson
    expect(result[1].employee_id).toBe(employeeResults[0].id); // Bob Smith

    // Verify numeric conversions for first record (Alice)
    expect(result[0].base_salary).toBe(4000.00);
    expect(typeof result[0].base_salary).toBe('number');
    expect(result[0].total_allowances).toBe(300.00);
    expect(result[0].total_deductions).toBe(150.00);
    expect(result[0].gross_salary).toBe(4300.00);
    expect(result[0].net_salary).toBe(4150.00);
    expect(result[0].overtime_hours).toBeNull();
    expect(result[0].overtime_amount).toBeNull();
    expect(result[0].bonus_amount).toBeNull();
    expect(result[0].attendance_days).toBe(21);

    // Verify numeric conversions for second record (Bob)
    expect(result[1].base_salary).toBe(5000.00);
    expect(result[1].total_allowances).toBe(500.00);
    expect(result[1].total_deductions).toBe(200.00);
    expect(result[1].overtime_hours).toBe(10.50);
    expect(typeof result[1].overtime_hours).toBe('number');
    expect(result[1].overtime_amount).toBe(150.75);
    expect(result[1].bonus_amount).toBe(1000.00);
    expect(result[1].attendance_days).toBe(22);
    expect(result[1].gross_salary).toBe(6650.75);
    expect(result[1].net_salary).toBe(6450.75);

    // Verify all records have required fields
    result.forEach(record => {
      expect(record.id).toBeDefined();
      expect(record.payroll_period_id).toBe(periodResult[0].id);
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter records by payroll period when periodId provided', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'Test Employee',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '123456789',
        email: 'test@test.com',
        phone: '555-0001'
      })
      .returning()
      .execute();

    // Create two payroll periods
    const periodResults = await db.insert(payrollPeriodsTable)
      .values([
        {
          year: 2024,
          month: 1,
          period_start: new Date('2024-01-01'),
          period_end: new Date('2024-01-31')
        },
        {
          year: 2024,
          month: 2,
          period_start: new Date('2024-02-01'),
          period_end: new Date('2024-02-29')
        }
      ])
      .returning()
      .execute();

    // Create payroll records for both periods
    await db.insert(payrollRecordsTable)
      .values([
        {
          employee_id: employeeResult[0].id,
          payroll_period_id: periodResults[0].id, // January
          base_salary: '4000.00',
          total_allowances: '300.00',
          total_deductions: '150.00',
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: '4300.00',
          net_salary: '4150.00'
        },
        {
          employee_id: employeeResult[0].id,
          payroll_period_id: periodResults[1].id, // February
          base_salary: '4000.00',
          total_allowances: '400.00',
          total_deductions: '200.00',
          overtime_hours: '5.00',
          overtime_amount: '75.00',
          bonus_amount: null,
          attendance_days: 20,
          gross_salary: '4475.00',
          net_salary: '4275.00'
        }
      ])
      .execute();

    // Fetch records for January period only
    const januaryRecords = await getPayrollRecords(periodResults[0].id);
    expect(januaryRecords).toHaveLength(1);
    expect(januaryRecords[0].payroll_period_id).toBe(periodResults[0].id);
    expect(januaryRecords[0].total_allowances).toBe(300.00);
    expect(januaryRecords[0].overtime_hours).toBeNull();

    // Fetch records for February period only
    const februaryRecords = await getPayrollRecords(periodResults[1].id);
    expect(februaryRecords).toHaveLength(1);
    expect(februaryRecords[0].payroll_period_id).toBe(periodResults[1].id);
    expect(februaryRecords[0].total_allowances).toBe(400.00);
    expect(februaryRecords[0].overtime_hours).toBe(5.00);
    expect(typeof februaryRecords[0].overtime_hours).toBe('number');

    // Fetch all records (no filter)
    const allRecords = await getPayrollRecords();
    expect(allRecords).toHaveLength(2);
  });

  it('should return empty array when filtering by non-existent period', async () => {
    // Create test employee and payroll record
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'Test Employee',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '123456789',
        email: 'test@test.com',
        phone: '555-0001'
      })
      .returning()
      .execute();

    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      })
      .returning()
      .execute();

    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employeeResult[0].id,
        payroll_period_id: periodResult[0].id,
        base_salary: '4000.00',
        total_allowances: '300.00',
        total_deductions: '150.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: 22,
        gross_salary: '4300.00',
        net_salary: '4150.00'
      })
      .execute();

    // Filter by non-existent period ID
    const result = await getPayrollRecords(99999);
    expect(result).toEqual([]);
  });

  it('should handle records with all null optional fields correctly', async () => {
    // Create test employee
    const employeeResult = await db.insert(employeesTable)
      .values({
        employee_id: 'EMP001',
        full_name: 'Test Employee',
        position: 'Developer',
        department: 'IT',
        start_date: new Date('2023-01-01'),
        bank_account: '123456789',
        email: 'test@test.com',
        phone: '555-0001'
      })
      .returning()
      .execute();

    const periodResult = await db.insert(payrollPeriodsTable)
      .values({
        year: 2024,
        month: 1,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31')
      })
      .returning()
      .execute();

    // Create record with all nullable fields as null
    await db.insert(payrollRecordsTable)
      .values({
        employee_id: employeeResult[0].id,
        payroll_period_id: periodResult[0].id,
        base_salary: '3000.00',
        total_allowances: '0.00',
        total_deductions: '0.00',
        overtime_hours: null,
        overtime_amount: null,
        bonus_amount: null,
        attendance_days: null,
        gross_salary: '3000.00',
        net_salary: '3000.00'
      })
      .execute();

    const result = await getPayrollRecords();

    expect(result).toHaveLength(1);
    expect(result[0].overtime_hours).toBeNull();
    expect(result[0].overtime_amount).toBeNull();
    expect(result[0].bonus_amount).toBeNull();
    expect(result[0].attendance_days).toBeNull();
    expect(result[0].base_salary).toBe(3000.00);
    expect(result[0].total_allowances).toBe(0.00);
    expect(result[0].total_deductions).toBe(0.00);
  });
});