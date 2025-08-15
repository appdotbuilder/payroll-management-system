import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../../../server/src/schema';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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
        }
      ];
      setEmployees(result.length > 0 ? result : demoEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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
        setEmployees((prev: Employee[]) => 
          prev.map((emp: Employee) => 
            emp.id === editingEmployee.id 
              ? { ...emp, ...formData, updated_at: new Date() }
              : emp
          )
        );
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
      setEmployees((prev: Employee[]) => prev.filter((emp: Employee) => emp.id !== id));
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
      'IT': 'bg-blue-100 text-blue-800',
      'Human Resources': 'bg-green-100 text-green-800',
      'Finance': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-orange-100 text-orange-800',
      'Operations': 'bg-gray-100 text-gray-800'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-blue-600" />
              Manajemen Karyawan
            </CardTitle>
            <p className="text-gray-600 mt-1">Kelola data karyawan perusahaan</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Karyawan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_id">ID Karyawan</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, employee_id: e.target.value }))
                      }
                      placeholder="EMP001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Ahmad Budi Santoso"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Jabatan</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, position: e.target.value }))
                      }
                      placeholder="Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Departemen</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, department: e.target.value }))
                      }
                      placeholder="IT"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Tanggal Mulai Kerja</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, start_date: new Date(e.target.value) }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_account">Nomor Rekening</Label>
                    <Input
                      id="bank_account"
                      value={formData.bank_account}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, bank_account: e.target.value }))
                      }
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="ahmad@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEmployeeInput) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="081234567890"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : editingEmployee ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Employee Table */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada data karyawan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>ID Karyawan</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: Employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          {employee.full_name}
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge className={getDepartmentColor(employee.department)}>
                          {employee.department}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.start_date.toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Karyawan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus karyawan {employee.full_name}? 
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
    </div>
  );
}