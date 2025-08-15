import { z } from 'zod';

// Employee schema
export const employeeSchema = z.object({
  id: z.number(),
  employee_id: z.string(),
  full_name: z.string(),
  position: z.string(),
  department: z.string(),
  start_date: z.coerce.date(),
  bank_account: z.string(),
  email: z.string().email(),
  phone: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Employee = z.infer<typeof employeeSchema>;

// Input schema for creating employees
export const createEmployeeInputSchema = z.object({
  employee_id: z.string(),
  full_name: z.string(),
  position: z.string(),
  department: z.string(),
  start_date: z.coerce.date(),
  bank_account: z.string(),
  email: z.string().email(),
  phone: z.string()
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

// Input schema for updating employees
export const updateEmployeeInputSchema = z.object({
  id: z.number(),
  employee_id: z.string().optional(),
  full_name: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  start_date: z.coerce.date().optional(),
  bank_account: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;

// Salary component type enum
export const salaryComponentTypeSchema = z.enum(['base_salary', 'allowance', 'deduction']);
export type SalaryComponentType = z.infer<typeof salaryComponentTypeSchema>;

// Salary component schema
export const salaryComponentSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: salaryComponentTypeSchema,
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SalaryComponent = z.infer<typeof salaryComponentSchema>;

// Input schema for creating salary components
export const createSalaryComponentInputSchema = z.object({
  name: z.string(),
  type: salaryComponentTypeSchema,
  description: z.string().nullable()
});

export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentInputSchema>;

// Input schema for updating salary components
export const updateSalaryComponentInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: salaryComponentTypeSchema.optional(),
  description: z.string().nullable().optional()
});

export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentInputSchema>;

// Employee salary component schema
export const employeeSalaryComponentSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  salary_component_id: z.number(),
  amount: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type EmployeeSalaryComponent = z.infer<typeof employeeSalaryComponentSchema>;

// Input schema for creating employee salary components
export const createEmployeeSalaryComponentInputSchema = z.object({
  employee_id: z.number(),
  salary_component_id: z.number(),
  amount: z.number().positive()
});

export type CreateEmployeeSalaryComponentInput = z.infer<typeof createEmployeeSalaryComponentInputSchema>;

// Input schema for updating employee salary components
export const updateEmployeeSalaryComponentInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive()
});

export type UpdateEmployeeSalaryComponentInput = z.infer<typeof updateEmployeeSalaryComponentInputSchema>;

// Payroll period schema
export const payrollPeriodSchema = z.object({
  id: z.number(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
  is_closed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PayrollPeriod = z.infer<typeof payrollPeriodSchema>;

// Input schema for creating payroll periods
export const createPayrollPeriodInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  period_start: z.coerce.date(),
  period_end: z.coerce.date()
});

export type CreatePayrollPeriodInput = z.infer<typeof createPayrollPeriodInputSchema>;

// Payroll record schema
export const payrollRecordSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  payroll_period_id: z.number(),
  base_salary: z.number(),
  total_allowances: z.number(),
  total_deductions: z.number(),
  overtime_hours: z.number().nullable(),
  overtime_amount: z.number().nullable(),
  bonus_amount: z.number().nullable(),
  attendance_days: z.number().int().nullable(),
  gross_salary: z.number(),
  net_salary: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PayrollRecord = z.infer<typeof payrollRecordSchema>;

// Input schema for creating payroll records
export const createPayrollRecordInputSchema = z.object({
  employee_id: z.number(),
  payroll_period_id: z.number(),
  overtime_hours: z.number().nullable(),
  overtime_amount: z.number().nullable(),
  bonus_amount: z.number().nullable(),
  attendance_days: z.number().int().nullable()
});

export type CreatePayrollRecordInput = z.infer<typeof createPayrollRecordInputSchema>;

// Input schema for updating payroll records
export const updatePayrollRecordInputSchema = z.object({
  id: z.number(),
  overtime_hours: z.number().nullable().optional(),
  overtime_amount: z.number().nullable().optional(),
  bonus_amount: z.number().nullable().optional(),
  attendance_days: z.number().int().nullable().optional()
});

export type UpdatePayrollRecordInput = z.infer<typeof updatePayrollRecordInputSchema>;

// Payroll detail schema (for storing individual salary component calculations)
export const payrollDetailSchema = z.object({
  id: z.number(),
  payroll_record_id: z.number(),
  salary_component_id: z.number(),
  amount: z.number(),
  created_at: z.coerce.date()
});

export type PayrollDetail = z.infer<typeof payrollDetailSchema>;

// Payroll report summary schema
export const payrollReportSummarySchema = z.object({
  department: z.string(),
  employee_count: z.number().int(),
  total_gross_salary: z.number(),
  total_net_salary: z.number(),
  total_allowances: z.number(),
  total_deductions: z.number()
});

export type PayrollReportSummary = z.infer<typeof payrollReportSummarySchema>;

// Input schema for generating reports
export const generateReportInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  department: z.string().optional()
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;

// Employee with salary components schema (for detailed views)
export const employeeWithSalaryComponentsSchema = z.object({
  employee: employeeSchema,
  salaryComponents: z.array(z.object({
    component: salaryComponentSchema,
    amount: z.number()
  }))
});

export type EmployeeWithSalaryComponents = z.infer<typeof employeeWithSalaryComponentsSchema>;

// Payroll record with details schema (for payslips)
export const payrollRecordWithDetailsSchema = z.object({
  record: payrollRecordSchema,
  employee: employeeSchema,
  period: payrollPeriodSchema,
  details: z.array(z.object({
    component: salaryComponentSchema,
    amount: z.number()
  }))
});

export type PayrollRecordWithDetails = z.infer<typeof payrollRecordWithDetailsSchema>;