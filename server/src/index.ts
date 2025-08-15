import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createEmployeeInputSchema,
  updateEmployeeInputSchema,
  createSalaryComponentInputSchema,
  updateSalaryComponentInputSchema,
  createEmployeeSalaryComponentInputSchema,
  updateEmployeeSalaryComponentInputSchema,
  createPayrollPeriodInputSchema,
  createPayrollRecordInputSchema,
  updatePayrollRecordInputSchema,
  generateReportInputSchema,
  salaryComponentTypeSchema,
} from './schema';

// Import handlers
import { createEmployee } from './handlers/create_employee';
import { getEmployees } from './handlers/get_employees';
import { getEmployeeById } from './handlers/get_employee_by_id';
import { updateEmployee } from './handlers/update_employee';
import { deleteEmployee } from './handlers/delete_employee';
import { createSalaryComponent } from './handlers/create_salary_component';
import { getSalaryComponents } from './handlers/get_salary_components';
import { updateSalaryComponent } from './handlers/update_salary_component';
import { deleteSalaryComponent } from './handlers/delete_salary_component';
import { createEmployeeSalaryComponent } from './handlers/create_employee_salary_component';
import { getEmployeeSalaryComponents } from './handlers/get_employee_salary_components';
import { updateEmployeeSalaryComponent } from './handlers/update_employee_salary_component';
import { deleteEmployeeSalaryComponent } from './handlers/delete_employee_salary_component';
import { createPayrollPeriod } from './handlers/create_payroll_period';
import { getPayrollPeriods } from './handlers/get_payroll_periods';
import { closePayrollPeriod } from './handlers/close_payroll_period';
import { createPayrollRecord } from './handlers/create_payroll_record';
import { getPayrollRecords } from './handlers/get_payroll_records';
import { getPayrollRecordWithDetails } from './handlers/get_payroll_record_with_details';
import { updatePayrollRecord } from './handlers/update_payroll_record';
import { generatePayrollReport } from './handlers/generate_payroll_report';
import { processBulkPayroll } from './handlers/process_bulk_payroll';
import { getEmployeePayrollHistory } from './handlers/get_employee_payroll_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Employee management routes
  createEmployee: publicProcedure
    .input(createEmployeeInputSchema)
    .mutation(({ input }) => createEmployee(input)),

  getEmployees: publicProcedure
    .query(() => getEmployees()),

  getEmployeeById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getEmployeeById(input.id)),

  updateEmployee: publicProcedure
    .input(updateEmployeeInputSchema)
    .mutation(({ input }) => updateEmployee(input)),

  deleteEmployee: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteEmployee(input.id)),

  // Salary component management routes
  createSalaryComponent: publicProcedure
    .input(createSalaryComponentInputSchema)
    .mutation(({ input }) => createSalaryComponent(input)),

  getSalaryComponents: publicProcedure
    .input(z.object({ type: salaryComponentTypeSchema.optional() }))
    .query(({ input }) => getSalaryComponents(input.type)),

  updateSalaryComponent: publicProcedure
    .input(updateSalaryComponentInputSchema)
    .mutation(({ input }) => updateSalaryComponent(input)),

  deleteSalaryComponent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSalaryComponent(input.id)),

  // Employee salary component assignment routes
  createEmployeeSalaryComponent: publicProcedure
    .input(createEmployeeSalaryComponentInputSchema)
    .mutation(({ input }) => createEmployeeSalaryComponent(input)),

  getEmployeeSalaryComponents: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getEmployeeSalaryComponents(input.employeeId)),

  updateEmployeeSalaryComponent: publicProcedure
    .input(updateEmployeeSalaryComponentInputSchema)
    .mutation(({ input }) => updateEmployeeSalaryComponent(input)),

  deleteEmployeeSalaryComponent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteEmployeeSalaryComponent(input.id)),

  // Payroll period management routes
  createPayrollPeriod: publicProcedure
    .input(createPayrollPeriodInputSchema)
    .mutation(({ input }) => createPayrollPeriod(input)),

  getPayrollPeriods: publicProcedure
    .query(() => getPayrollPeriods()),

  closePayrollPeriod: publicProcedure
    .input(z.object({ periodId: z.number() }))
    .mutation(({ input }) => closePayrollPeriod(input.periodId)),

  // Payroll processing routes
  createPayrollRecord: publicProcedure
    .input(createPayrollRecordInputSchema)
    .mutation(({ input }) => createPayrollRecord(input)),

  getPayrollRecords: publicProcedure
    .input(z.object({ periodId: z.number().optional() }))
    .query(({ input }) => getPayrollRecords(input.periodId)),

  getPayrollRecordWithDetails: publicProcedure
    .input(z.object({ recordId: z.number() }))
    .query(({ input }) => getPayrollRecordWithDetails(input.recordId)),

  updatePayrollRecord: publicProcedure
    .input(updatePayrollRecordInputSchema)
    .mutation(({ input }) => updatePayrollRecord(input)),

  processBulkPayroll: publicProcedure
    .input(z.object({ periodId: z.number() }))
    .mutation(({ input }) => processBulkPayroll(input.periodId)),

  getEmployeePayrollHistory: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getEmployeePayrollHistory(input.employeeId)),

  // Reporting routes
  generatePayrollReport: publicProcedure
    .input(generateReportInputSchema)
    .query(({ input }) => generatePayrollReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Employee Salary Management TRPC server listening at port: ${port}`);
}

start();