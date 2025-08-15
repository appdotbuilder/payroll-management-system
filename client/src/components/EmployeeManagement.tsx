import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, User, Mail, Phone, Building, Wallet, UserPlus, Users, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { EmployeeSalaryComponents } from './EmployeeSalaryComponents';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../../../server/src/schema';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    employee_id: '',
    full_name: '',
    position: '',
    department: '',
    start_date: new Date(),
    bank_account: '',
    email: '',
    phone: ''
  });

  // Load employees data
  const loadEmployees = useCallback(async () => {
    try {
      const result = await trpc.getEmployees.query();
      // STUB: Since backend returns empty array, using demo data
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
        },
        {
          id: 4,
          employee_id: 'EMP004',
          full_name: 'Dewi Lestari',
          position: 'Marketing Specialist',
          department: 'Marketing',
          start_date: new Date('2023-02-20'),
          bank_account: '2233445566',
          email: 'dewi.lestari@company.com',
          phone: '081234567893',
          created_at: new Date('2023-02-20'),
          updated_at: new Date('2023-02-20')
        },
        {
          id: 5,
          employee_id: 'EMP005',
          full_name: 'Andi Wijaya',
          position: 'Operations Manager',
          department: 'Operations',
          start_date: new Date('2022-12-01'),
          bank_account: '3344556677',
          email: 'andi.wijaya@company.com',
          phone: '081234567894',
          created_at: new Date('2022-12-01'),
          updated_at: new Date('2022-12-01')
        }
      ];
      const employeeData = result.length > 0 ? result : demoEmployees;
      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Filter employees based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee =>
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingEmployee) {
        const updateData: UpdateEmployeeInput = {
          id: editingEmployee.id,
          ...formData
        };
        await trpc.updateEmployee.mutate(updateData);
        // Update local state - in real app this would be the API response
        const updatedEmployees = employees.map((emp: Employee) => 
          emp.id === editingEmployee.id 
            ? { ...emp, ...formData, updated_at: new Date() }
            : emp
        );
        setEmployees(updatedEmployees);
      } else {
        const response = await trpc.createEmployee.mutate(formData);
        // Add to local state - in real app this would be the API response
        const newEmployee: Employee = {
          id: Date.now(), // STUB: using timestamp as ID
          ...formData,
          created_at: new Date(),
          updated_at: new Date()
        };
        setEmployees((prev: Employee[]) => [...prev, newEmployee]);
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      position: employee.position,
      department: employee.department,
      start_date: employee.start_date,
      bank_account: employee.bank_account,
      email: employee.email,
      phone: employee.phone
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteEmployee.mutate({ id });
      const updatedEmployees = employees.filter((emp: Employee) => emp.id !== id);
      setEmployees(updatedEmployees);
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      employee_id: '',
      full_name: '',
      position: '',
      department: '',
      start_date: new Date(),
      bank_account: '',
      email: '',
      phone: ''
    });
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'IT': 'bg-blue-100 text-blue-800 border-blue-200',
      'Human Resources': 'bg-green-100 text-green-800 border-green-200',
      'Finance': 'bg-purple-100 text-purple-800 border-purple-200',
      'Marketing': 'bg-orange-100 text-orange-800 border-orange-200',
      'Operations': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEmployeeInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getEmployeeStats = () => {
    const totalEmployees = employees.length;
    const departmentCounts = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalEmployees, departmentCounts };
  };

  const stats = getEmployeeStats();

  // If viewing salary components for a specific employee
  if (selectedEmployee) {
    return (
      <EmployeeSalaryComponents
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card className="card-enhanced bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <CardHeader className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-shadow">
                  Manajemen Karyawan
                </CardTitle>
                <p className="text-blue-100 mt-1 text-shadow">
                  Kelola data karyawan dan komponen gaji perusahaan
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-shadow">{stats.totalEmployees}</div>
                <div className="text-blue-100">Total Karyawan</div>
              </div>
              <div className="hidden lg:block h-8 w-px bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-shadow">{Object.keys(stats.departmentCounts).length}</div>
                <div className="text-blue-100">Departemen</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Add Section */}
      <Card className="card-enhanced bg-white/80 backdrop-blur-sm border border-gray-200/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari karyawan berdasarkan nama, ID, jabatan..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 form-input-enhanced bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-gradient-primary shadow-lg hover:shadow-xl">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Karyawan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employee_id" className="text-sm font-medium">ID Karyawan</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, employee_id: e.target.value }))
                        }
                        placeholder="EMP001"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-medium">Nama Lengkap</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, full_name: e.target.value }))
                        }
                        placeholder="Ahmad Budi Santoso"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position" className="text-sm font-medium">Jabatan</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, position: e.target.value }))
                        }
                        placeholder="Software Engineer"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="department" className="text-sm font-medium">Departemen</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, department: e.target.value }))
                        }
                        placeholder="IT"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-sm font-medium">Tanggal Mulai Kerja</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, start_date: new Date(e.target.value) }))
                        }
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account" className="text-sm font-medium">Nomor Rekening</Label>
                      <Input
                        id="bank_account"
                        value={formData.bank_account}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, bank_account: e.target.value }))
                        }
                        placeholder="1234567890"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="ahmad@company.com"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Nomor Telepon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateEmployeeInput) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="081234567890"
                        className="form-input-enhanced mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      className="hover:bg-gray-50"
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="btn-gradient-primary min-w-[100px]"
                    >
                      {isLoading ? 'Menyimpan...' : editingEmployee ? 'Update' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Employee Table */}
      <Card className="card-enhanced bg-white/90 backdrop-blur-sm border border-gray-200/50 overflow-hidden">
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16">
              {searchTerm ? (
                <>
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Tidak ada karyawan yang sesuai dengan pencarian</p>
                  <p className="text-gray-400 text-sm mt-2">Coba ubah kata kunci pencarian Anda</p>
                </>
              ) : (
                <>
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Belum ada data karyawan</p>
                  <p className="text-gray-400 text-sm mt-2">Mulai dengan menambahkan karyawan pertama</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Karyawan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jabatan & Departemen</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tanggal Mulai</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: Employee) => (
                    <TableRow 
                      key={employee.id} 
                      className="table-row-hover border-b border-gray-100/50 transition-all duration-200"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {getEmployeeInitials(employee.full_name)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{employee.full_name}</div>
                            <div className="text-sm text-gray-500 font-medium">{employee.employee_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{employee.position}</div>
                          <Badge className={`${getDepartmentColor(employee.department)} text-xs`}>
                            <Building className="h-3 w-3 mr-1" />
                            {employee.department}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-gray-900 font-medium">
                          {employee.start_date.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span>{employee.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                            title="Kelola Komponen Gaji"
                          >
                            <Wallet className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            title="Edit Karyawan"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">Hapus Karyawan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus karyawan <strong>{employee.full_name}</strong>? 
                                  <br />
                                  <br />
                                  Semua data gaji dan riwayat payroll yang terkait akan ikut terhapus. 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(employee.id)}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Summary */}
      {filteredEmployees.length > 0 && (
        <Card className="card-enhanced bg-gradient-to-r from-gray-50 to-white border border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Ringkasan Departemen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.entries(stats.departmentCounts).map(([department, count]) => (
                <div key={department} className="text-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 mt-1">{department}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}