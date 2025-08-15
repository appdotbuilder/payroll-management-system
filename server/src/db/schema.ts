import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const salaryComponentTypeEnum = pgEnum('salary_component_type', ['base_salary', 'allowance', 'deduction']);

// Employees table
export const employeesTable = pgTable('employees', {
  id: serial('id').primaryKey(),
  employee_id: text('employee_id').notNull().unique(),
  full_name: text('full_name').notNull(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  start_date: timestamp('start_date').notNull(),
  bank_account: text('bank_account').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Salary components table (base salary, allowances, deductions)
export const salaryComponentsTable = pgTable('salary_components', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: salaryComponentTypeEnum('type').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Employee salary components table (mapping employees to their salary components with amounts)
export const employeeSalaryComponentsTable = pgTable('employee_salary_components', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => employeesTable.id, { onDelete: 'cascade' }),
  salary_component_id: integer('salary_component_id').notNull().references(() => salaryComponentsTable.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll periods table
export const payrollPeriodsTable = pgTable('payroll_periods', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  period_start: timestamp('period_start').notNull(),
  period_end: timestamp('period_end').notNull(),
  is_closed: boolean('is_closed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll records table (main payroll calculation results)
export const payrollRecordsTable = pgTable('payroll_records', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => employeesTable.id, { onDelete: 'cascade' }),
  payroll_period_id: integer('payroll_period_id').notNull().references(() => payrollPeriodsTable.id, { onDelete: 'cascade' }),
  base_salary: numeric('base_salary', { precision: 15, scale: 2 }).notNull(),
  total_allowances: numeric('total_allowances', { precision: 15, scale: 2 }).notNull(),
  total_deductions: numeric('total_deductions', { precision: 15, scale: 2 }).notNull(),
  overtime_hours: numeric('overtime_hours', { precision: 8, scale: 2 }), // Nullable
  overtime_amount: numeric('overtime_amount', { precision: 15, scale: 2 }), // Nullable
  bonus_amount: numeric('bonus_amount', { precision: 15, scale: 2 }), // Nullable
  attendance_days: integer('attendance_days'), // Nullable
  gross_salary: numeric('gross_salary', { precision: 15, scale: 2 }).notNull(),
  net_salary: numeric('net_salary', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll details table (breakdown of each salary component in payroll)
export const payrollDetailsTable = pgTable('payroll_details', {
  id: serial('id').primaryKey(),
  payroll_record_id: integer('payroll_record_id').notNull().references(() => payrollRecordsTable.id, { onDelete: 'cascade' }),
  salary_component_id: integer('salary_component_id').notNull().references(() => salaryComponentsTable.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const employeesRelations = relations(employeesTable, ({ many }) => ({
  salaryComponents: many(employeeSalaryComponentsTable),
  payrollRecords: many(payrollRecordsTable),
}));

export const salaryComponentsRelations = relations(salaryComponentsTable, ({ many }) => ({
  employeeComponents: many(employeeSalaryComponentsTable),
  payrollDetails: many(payrollDetailsTable),
}));

export const employeeSalaryComponentsRelations = relations(employeeSalaryComponentsTable, ({ one }) => ({
  employee: one(employeesTable, {
    fields: [employeeSalaryComponentsTable.employee_id],
    references: [employeesTable.id],
  }),
  salaryComponent: one(salaryComponentsTable, {
    fields: [employeeSalaryComponentsTable.salary_component_id],
    references: [salaryComponentsTable.id],
  }),
}));

export const payrollPeriodsRelations = relations(payrollPeriodsTable, ({ many }) => ({
  payrollRecords: many(payrollRecordsTable),
}));

export const payrollRecordsRelations = relations(payrollRecordsTable, ({ one, many }) => ({
  employee: one(employeesTable, {
    fields: [payrollRecordsTable.employee_id],
    references: [employeesTable.id],
  }),
  period: one(payrollPeriodsTable, {
    fields: [payrollRecordsTable.payroll_period_id],
    references: [payrollPeriodsTable.id],
  }),
  details: many(payrollDetailsTable),
}));

export const payrollDetailsRelations = relations(payrollDetailsTable, ({ one }) => ({
  payrollRecord: one(payrollRecordsTable, {
    fields: [payrollDetailsTable.payroll_record_id],
    references: [payrollRecordsTable.id],
  }),
  salaryComponent: one(salaryComponentsTable, {
    fields: [payrollDetailsTable.salary_component_id],
    references: [salaryComponentsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Employee = typeof employeesTable.$inferSelect;
export type NewEmployee = typeof employeesTable.$inferInsert;
export type SalaryComponent = typeof salaryComponentsTable.$inferSelect;
export type NewSalaryComponent = typeof salaryComponentsTable.$inferInsert;
export type EmployeeSalaryComponent = typeof employeeSalaryComponentsTable.$inferSelect;
export type NewEmployeeSalaryComponent = typeof employeeSalaryComponentsTable.$inferInsert;
export type PayrollPeriod = typeof payrollPeriodsTable.$inferSelect;
export type NewPayrollPeriod = typeof payrollPeriodsTable.$inferInsert;
export type PayrollRecord = typeof payrollRecordsTable.$inferSelect;
export type NewPayrollRecord = typeof payrollRecordsTable.$inferInsert;
export type PayrollDetail = typeof payrollDetailsTable.$inferSelect;
export type NewPayrollDetail = typeof payrollDetailsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  employees: employeesTable,
  salaryComponents: salaryComponentsTable,
  employeeSalaryComponents: employeeSalaryComponentsTable,
  payrollPeriods: payrollPeriodsTable,
  payrollRecords: payrollRecordsTable,
  payrollDetails: payrollDetailsTable,
};