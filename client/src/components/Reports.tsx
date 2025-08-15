import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, TrendingUp, Users, DollarSign, Building, Calendar, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PayrollReportSummary, GenerateReportInput, Employee, PayrollRecord } from '../../../server/src/schema';

export function Reports() {
  const [reportData, setReportData] = useState<PayrollReportSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Report form state
  const [reportForm, setReportForm] = useState<GenerateReportInput>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: undefined
  });

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const result = await trpc.getEmployees.query();
      // STUB: Demo data (using same as other components)
      const demoEmployees: Employee[] = [
        {
          id: 1,
          employee_id: 'EMP001',
          full_name: 'Ahmad Budi Santoso',
          position: 'Software Engineer',
          department: 'IT',
          start_date: new Date('2023-01-15'),
          bank_account: '1234567890',
          email: 'ahmad.budi@company.com',
          phone: '081234567890',
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2023-01-15')
        },
        {
          id: 2,
          employee_id: 'EMP002',
          full_name: 'Siti Nurhaliza',
          position: 'HR Manager',
          department: 'Human Resources',
          start_date: new Date('2022-06-01'),
          bank_account: '0987654321',
          email: 'siti.nurhaliza@company.com',
          phone: '081234567891',
          created_at: new Date('2022-06-01'),
          updated_at: new Date('2022-06-01')
        },
        {
          id: 3,
          employee_id: 'EMP003',
          full_name: 'Rizki Pratama',
          position: 'Accountant',
          department: 'Finance',
          start_date: new Date('2023-03-10'),
          bank_account: '1122334455',
          email: 'rizki.pratama@company.com',
          phone: '081234567892',
          created_at: new Date('2023-03-10'),
          updated_at: new Date('2023-03-10')
        }
      ];
      setEmployees(result.length > 0 ? result : demoEmployees);
      if (demoEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(demoEmployees[0]);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.generatePayrollReport.query(reportForm);
      // STUB: Demo report data
      const demoReport: PayrollReportSummary[] = [
        {
          department: 'IT',
          employee_count: 1,
          total_gross_salary: 10000000,
          total_net_salary: 9200000,
          total_allowances: 1500000,
          total_deductions: 800000
        },
        {
          department: 'Human Resources', 
          employee_count: 1,
          total_gross_salary: 13000000,
          total_net_salary: 11800000,
          total_allowances: 2000000,
          total_deductions: 1200000
        },
        {
          department: 'Finance',
          employee_count: 1,
          total_gross_salary: 9500000,
          total_net_salary: 8700000,
          total_allowances: 1200000,
          total_deductions: 800000
        }
      ];
      
      // Filter by department if specified
      let filteredReport = demoReport;
      if (reportForm.department) {
        filteredReport = demoReport.filter(r => r.department === reportForm.department);
      }
      
      setReportData(result.length > 0 ? result : filteredReport);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeHistory = async (employeeId: number) => {
    try {
      const result = await trpc.getEmployeePayrollHistory.query({ employeeId });
      // STUB: Demo payroll history
      const demoHistory: PayrollRecord[] = [
        {
          id: 1,
          employee_id: employeeId,
          payroll_period_id: 1,
          base_salary: 8000000,
          total_allowances: 1500000,
          total_deductions: 800000,
          overtime_hours: 10,
          overtime_amount: 500000,
          bonus_amount: null,
          attendance_days: 22,
          gross_salary: 10000000,
          net_salary: 9200000,
          created_at: new Date('2024-01-31'),
          updated_at: new Date('2024-01-31')
        },
        {
          id: 2,
          employee_id: employeeId,
          payroll_period_id: 2,
          base_salary: 8000000,
          total_allowances: 1500000,
          total_deductions: 850000,
          overtime_hours: 5,
          overtime_amount: 250000,
          bonus_amount: 1000000,
          attendance_days: 20,
          gross_salary: 10750000,
          net_salary: 9900000,
          created_at: new Date('2024-02-29'),
          updated_at: new Date('2024-02-29')
        }
      ];
      setPayrollHistory(result.length > 0 ? result : demoHistory);
    } catch (error) {
      console.error('Failed to load payroll history:', error);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeHistory(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const departments = [...new Set(employees.map(e => e.department))];

  const getTotalSummary = () => {
    return reportData.reduce(
      (acc, dept) => ({
        employee_count: acc.employee_count + dept.employee_count,
        total_gross_salary: acc.total_gross_salary + dept.total_gross_salary,
        total_net_salary: acc.total_net_salary + dept.total_net_salary,
        total_allowances: acc.total_allowances + dept.total_allowances,
        total_deductions: acc.total_deductions + dept.total_deductions
      }),
      {
        employee_count: 0,
        total_gross_salary: 0,
        total_net_salary: 0,
        total_allowances: 0,
        total_deductions: 0
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Laporan Penggajian
          </CardTitle>
          <p className="text-gray-600">Generate laporan ringkasan payroll dan riwayat karyawan</p>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger 
            value="summary" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Laporan Ringkasan
          </TabsTrigger>
          <TabsTrigger 
            value="employee-history" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Riwayat Karyawan
          </TabsTrigger>
        </TabsList>

        {/* Summary Report Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Report Generation Form */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Generate Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="report-year">Tahun</Label>
                  <Input
                    id="report-year"
                    type="number"
                    value={reportForm.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setReportForm((prev: GenerateReportInput) => ({ ...prev, year: parseInt(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="report-month">Bulan</Label>
                  <Select
                    value={reportForm.month.toString()}
                    onValueChange={(value) =>
                      setReportForm((prev: GenerateReportInput) => ({ ...prev, month: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-department">Departemen (Opsional)</Label>
                  <Select
                    value={reportForm.department || 'all'}
                    onValueChange={(value) =>
                      setReportForm((prev: GenerateReportInput) => ({ 
                        ...prev, 
                        department: value === 'all' ? undefined : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Departemen</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateReport}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Generating...' : 'Generate Laporan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {reportData.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const summary = getTotalSummary();
                  return (
                    <>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100">Total Karyawan</p>
                              <p className="text-2xl font-bold">{summary.employee_count}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100">Gaji Bruto</p>
                              <p className="text-xl font-bold">{formatCurrency(summary.total_gross_salary)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100">Gaji Bersih</p>
                              <p className="text-xl font-bold">{formatCurrency(summary.total_net_salary)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100">Total Potongan</p>
                              <p className="text-xl font-bold">{formatCurrency(summary.total_deductions)}</p>
                            </div>
                            <Building className="h-8 w-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Report Table */}
              <Card className="bg-white shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Laporan Payroll {monthNames[reportForm.month - 1]} {reportForm.year}
                    {reportForm.department && ` - ${reportForm.department}`}
                  </CardTitle>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Departemen</TableHead>
                          <TableHead>Jumlah Karyawan</TableHead>
                          <TableHead>Total Tunjangan</TableHead>
                          <TableHead>Total Potongan</TableHead>
                          <TableHead>Gaji Bruto</TableHead>
                          <TableHead>Gaji Bersih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((dept: PayrollReportSummary, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{dept.department}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{dept.employee_count} orang</Badge>
                            </TableCell>
                            <TableCell className="text-green-600 font-semibold">
                              {formatCurrency(dept.total_allowances)}
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              {formatCurrency(dept.total_deductions)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(dept.total_gross_salary)}
                            </TableCell>
                            <TableCell className="font-bold text-blue-600">
                              {formatCurrency(dept.total_net_salary)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {reportData.length > 1 && (() => {
                          const summary = getTotalSummary();
                          return (
                            <TableRow className="bg-blue-50 font-bold border-t-2">
                              <TableCell>TOTAL</TableCell>
                              <TableCell>
                                <Badge className="bg-blue-600">{summary.employee_count} orang</Badge>
                              </TableCell>
                              <TableCell className="text-green-700">
                                {formatCurrency(summary.total_allowances)}
                              </TableCell>
                              <TableCell className="text-red-700">
                                {formatCurrency(summary.total_deductions)}
                              </TableCell>
                              <TableCell>{formatCurrency(summary.total_gross_salary)}</TableCell>
                              <TableCell className="text-blue-700">
                                {formatCurrency(summary.total_net_salary)}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Employee History Tab */}
        <TabsContent value="employee-history" className="space-y-6">
          {/* Employee Selection */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Pilih Karyawan</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEmployee?.id.toString() || ''}
                onValueChange={(value) => {
                  const employee = employees.find(e => e.id === parseInt(value));
                  setSelectedEmployee(employee || null);
                }}
              >
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: Employee) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.full_name} ({emp.employee_id}) - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Employee Info and History */}
          {selectedEmployee && (
            <>
              {/* Employee Info Card */}
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle>Informasi Karyawan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-semibold">{selectedEmployee.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID Karyawan</p>
                      <p className="font-semibold">{selectedEmployee.employee_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jabatan</p>
                      <p className="font-semibold">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Departemen</p>
                      <Badge className="bg-blue-100 text-blue-800">{selectedEmployee.department}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll History */}
              <Card className="bg-white shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Riwayat Penggajian</CardTitle>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Riwayat
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {payrollHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada riwayat penggajian</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Periode</TableHead>
                            <TableHead>Gaji Pokok</TableHead>
                            <TableHead>Tunjangan</TableHead>
                            <TableHead>Potongan</TableHead>
                            <TableHead>Lembur</TableHead>
                            <TableHead>Bonus</TableHead>
                            <TableHead>Gaji Bruto</TableHead>
                            <TableHead>Gaji Bersih</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payrollHistory.map((record: PayrollRecord) => (
                            <TableRow key={record.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  {record.created_at.toLocaleDateString('id-ID', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                              <TableCell className="text-green-600">
                                {formatCurrency(record.total_allowances)}
                              </TableCell>
                              <TableCell className="text-red-600">
                                {formatCurrency(record.total_deductions)}
                              </TableCell>
                              <TableCell>
                                {record.overtime_amount ? formatCurrency(record.overtime_amount) : '-'}
                              </TableCell>
                              <TableCell>
                                {record.bonus_amount ? formatCurrency(record.bonus_amount) : '-'}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(record.gross_salary)}
                              </TableCell>
                              <TableCell className="font-bold text-blue-600">
                                {formatCurrency(record.net_salary)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}