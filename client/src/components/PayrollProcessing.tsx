import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calculator, Calendar, Play, FileText, Clock, CheckCircle, Users, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PayrollPeriod, PayrollRecord, Employee, CreatePayrollPeriodInput, CreatePayrollRecordInput, PayrollRecordWithDetails } from '../../../server/src/schema';

export function PayrollProcessing() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
  const [payslipDialog, setPayslipDialog] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecordWithDetails | null>(null);

  // Form states
  const [periodForm, setPeriodForm] = useState<CreatePayrollPeriodInput>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period_start: new Date(),
    period_end: new Date()
  });

  // Load data
  const loadPayrollPeriods = useCallback(async () => {
    try {
      const result = await trpc.getPayrollPeriods.query();
      // STUB: Demo data
      const demoPeriods: PayrollPeriod[] = [
        {
          id: 1,
          year: 2024,
          month: 1,
          period_start: new Date('2024-01-01'),
          period_end: new Date('2024-01-31'),
          is_closed: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-02-01')
        },
        {
          id: 2,
          year: 2024,
          month: 2,
          period_start: new Date('2024-02-01'),
          period_end: new Date('2024-02-29'),
          is_closed: false,
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01')
        }
      ];
      setPayrollPeriods(result.length > 0 ? result : demoPeriods);
      if (demoPeriods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(demoPeriods[0]);
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
    }
  }, [selectedPeriod]);

  const loadEmployees = useCallback(async () => {
    try {
      const result = await trpc.getEmployees.query();
      // STUB: Demo data (using same as EmployeeManagement)
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
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  const loadPayrollRecords = useCallback(async (periodId?: number) => {
    if (!periodId) return;
    try {
      const result = await trpc.getPayrollRecords.query({ periodId });
      // STUB: Demo data
      const demoRecords: PayrollRecord[] = [
        {
          id: 1,
          employee_id: 1,
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
          employee_id: 2,
          payroll_period_id: 1,
          base_salary: 10000000,
          total_allowances: 2000000,
          total_deductions: 1200000,
          overtime_hours: null,
          overtime_amount: null,
          bonus_amount: 1000000,
          attendance_days: 22,
          gross_salary: 13000000,
          net_salary: 11800000,
          created_at: new Date('2024-01-31'),
          updated_at: new Date('2024-01-31')
        }
      ];
      setPayrollRecords(result.length > 0 ? result : (periodId === 1 ? demoRecords : []));
    } catch (error) {
      console.error('Failed to load payroll records:', error);
    }
  }, []);

  useEffect(() => {
    loadPayrollPeriods();
    loadEmployees();
  }, [loadPayrollPeriods, loadEmployees]);

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollRecords(selectedPeriod.id);
    }
  }, [selectedPeriod, loadPayrollRecords]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createPayrollPeriod.mutate(periodForm);
      const newPeriod: PayrollPeriod = {
        id: Date.now(),
        ...periodForm,
        is_closed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      setPayrollPeriods((prev: PayrollPeriod[]) => [...prev, newPeriod]);
      setCreatePeriodOpen(false);
    } catch (error) {
      console.error('Failed to create payroll period:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessBulkPayroll = async () => {
    if (!selectedPeriod) return;
    setIsLoading(true);
    try {
      await trpc.processBulkPayroll.mutate({ periodId: selectedPeriod.id });
      // Refresh records after processing
      loadPayrollRecords(selectedPeriod.id);
    } catch (error) {
      console.error('Failed to process bulk payroll:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    try {
      await trpc.closePayrollPeriod.mutate({ periodId: selectedPeriod.id });
      setPayrollPeriods((prev: PayrollPeriod[]) => 
        prev.map((p: PayrollPeriod) => 
          p.id === selectedPeriod.id 
            ? { ...p, is_closed: true, updated_at: new Date() }
            : p
        )
      );
      setSelectedPeriod({ ...selectedPeriod, is_closed: true });
    } catch (error) {
      console.error('Failed to close payroll period:', error);
    }
  };

  const viewPayslip = async (recordId: number) => {
    try {
      const result = await trpc.getPayrollRecordWithDetails.query({ recordId });
      // STUB: Create demo payslip data
      const employee = employees.find(e => e.id === payrollRecords.find(r => r.id === recordId)?.employee_id);
      const record = payrollRecords.find(r => r.id === recordId);
      if (employee && record && selectedPeriod) {
        const demoPayslip: PayrollRecordWithDetails = {
          record,
          employee,
          period: selectedPeriod,
          details: [
            { component: { id: 1, name: 'Gaji Pokok', type: 'base_salary', description: null, created_at: new Date(), updated_at: new Date() }, amount: record.base_salary },
            { component: { id: 2, name: 'Tunjangan Jabatan', type: 'allowance', description: null, created_at: new Date(), updated_at: new Date() }, amount: 1000000 },
            { component: { id: 3, name: 'Tunjangan Transport', type: 'allowance', description: null, created_at: new Date(), updated_at: new Date() }, amount: 500000 },
            { component: { id: 4, name: 'BPJS Kesehatan', type: 'deduction', description: null, created_at: new Date(), updated_at: new Date() }, amount: -400000 },
            { component: { id: 5, name: 'PPh 21', type: 'deduction', description: null, created_at: new Date(), updated_at: new Date() }, amount: -400000 }
          ]
        };
        setSelectedPayslip(demoPayslip);
        setPayslipDialog(true);
      }
    } catch (error) {
      console.error('Failed to load payslip details:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEmployeeName = (employeeId: number) => {
    return employees.find(e => e.id === employeeId)?.full_name || 'Unknown';
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-blue-600" />
              Proses Penggajian (Payroll)
            </CardTitle>
            <p className="text-gray-600 mt-1">Kelola periode payroll dan proses penggajian karyawan</p>
          </div>
          <Dialog open={createPeriodOpen} onOpenChange={setCreatePeriodOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Buat Periode Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Buat Periode Payroll Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePeriod} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Tahun</Label>
                    <Input
                      id="year"
                      type="number"
                      value={periodForm.year}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPeriodForm((prev: CreatePayrollPeriodInput) => ({ ...prev, year: parseInt(e.target.value) }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="month">Bulan</Label>
                    <Select
                      value={periodForm.month.toString()}
                      onValueChange={(value) =>
                        setPeriodForm((prev: CreatePayrollPeriodInput) => ({ ...prev, month: parseInt(value) }))
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
                </div>
                <div>
                  <Label htmlFor="period_start">Tanggal Mulai</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={periodForm.period_start.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPeriodForm((prev: CreatePayrollPeriodInput) => ({ ...prev, period_start: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="period_end">Tanggal Selesai</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={periodForm.period_end.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPeriodForm((prev: CreatePayrollPeriodInput) => ({ ...prev, period_end: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCreatePeriodOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Membuat...' : 'Buat Periode'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Period Selection */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Periode Payroll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payrollPeriods.map((period: PayrollPeriod) => (
              <div
                key={period.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPeriod?.id === period.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {monthNames[period.month - 1]} {period.year}
                    </p>
                    <p className="text-sm text-gray-600">
                      {period.period_start.toLocaleDateString('id-ID')} - {period.period_end.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge variant={period.is_closed ? 'destructive' : 'secondary'}>
                    {period.is_closed ? 'Ditutup' : 'Aktif'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPeriod && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Karyawan</p>
                        <p className="text-2xl font-bold">{employees.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Payroll</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(payrollRecords.reduce((sum, record) => sum + record.net_salary, 0))}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Periode {monthNames[selectedPeriod.month - 1]} {selectedPeriod.year}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {payrollRecords.length} dari {employees.length} karyawan telah diproses
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!selectedPeriod.is_closed && (
                        <>
                          <Button
                            onClick={handleProcessBulkPayroll}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isLoading ? 'Memproses...' : 'Proses Payroll'}
                          </Button>
                          {payrollRecords.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Tutup Periode
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tutup Periode Payroll</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menutup periode {monthNames[selectedPeriod.month - 1]} {selectedPeriod.year}?
                                    Setelah ditutup, periode ini tidak dapat diedit lagi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleClosePeriod}>
                                    Tutup Periode
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Payroll Records Table */}
      {selectedPeriod && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Daftar Gaji Karyawan - {monthNames[selectedPeriod.month - 1]} {selectedPeriod.year}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payrollRecords.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data payroll untuk periode ini</p>
                <Button 
                  onClick={handleProcessBulkPayroll}
                  disabled={isLoading || selectedPeriod.is_closed}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Proses Payroll Sekarang
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Gaji Pokok</TableHead>
                      <TableHead>Tunjangan</TableHead>
                      <TableHead>Potongan</TableHead>
                      <TableHead>Gaji Bruto</TableHead>
                      <TableHead>Gaji Bersih</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record: PayrollRecord) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employee_id)}
                        </TableCell>
                        <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(record.total_allowances)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(record.total_deductions)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(record.gross_salary)}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {formatCurrency(record.net_salary)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewPayslip(record.id)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Slip Gaji
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payslip Dialog */}
      <Dialog open={payslipDialog} onOpenChange={setPayslipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Slip Gaji - {selectedPayslip?.employee.full_name}</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Nama Karyawan</p>
                  <p className="font-semibold">{selectedPayslip.employee.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Karyawan</p>
                  <p className="font-semibold">{selectedPayslip.employee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jabatan</p>
                  <p className="font-semibold">{selectedPayslip.employee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departemen</p>
                  <p className="font-semibold">{selectedPayslip.employee.department}</p>
                </div>
              </div>

              {/* Salary Details */}
              <div className="space-y-2">
                <h4 className="font-semibold">Rincian Gaji</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Komponen</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPayslip.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{detail.component.name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              detail.component.type === 'base_salary' ? 'bg-blue-100 text-blue-800' :
                              detail.component.type === 'allowance' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {detail.component.type === 'base_salary' ? 'Gaji Pokok' :
                             detail.component.type === 'allowance' ? 'Tunjangan' : 'Potongan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={detail.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(Math.abs(detail.amount))}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Gaji Bruto:</span>
                  <span className="font-semibold">{formatCurrency(selectedPayslip.record.gross_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Potongan:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(selectedPayslip.record.total_deductions)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Gaji Bersih:</span>
                  <span className="text-blue-600">{formatCurrency(selectedPayslip.record.net_salary)}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setPayslipDialog(false)}>Tutup</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}