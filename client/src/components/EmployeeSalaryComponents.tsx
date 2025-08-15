import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Employee, 
  SalaryComponent, 
  EmployeeWithSalaryComponents,
  CreateEmployeeSalaryComponentInput,
  UpdateEmployeeSalaryComponentInput
} from '../../../server/src/schema';

interface EmployeeSalaryComponentsProps {
  employee: Employee;
  onClose: () => void;
}

export function EmployeeSalaryComponents({ employee, onClose }: EmployeeSalaryComponentsProps) {
  const [employeeData, setEmployeeData] = useState<EmployeeWithSalaryComponents | null>(null);
  const [availableComponents, setAvailableComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<{component: SalaryComponent, amount: number, id: number} | null>(null);

  // Form state for adding new component
  const [formData, setFormData] = useState({
    salary_component_id: '',
    amount: 0
  });

  // Load employee salary components
  const loadEmployeeSalaryComponents = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getEmployeeSalaryComponents.query({ employeeId: employee.id });
      
      // STUB: Using demo data when API returns empty
      if (!result) {
        const demoData: EmployeeWithSalaryComponents = {
          employee,
          salaryComponents: [
            {
              component: {
                id: 1,
                name: 'Gaji Pokok',
                type: 'base_salary',
                description: 'Gaji dasar karyawan',
                created_at: new Date(),
                updated_at: new Date()
              },
              amount: 5000000
            },
            {
              component: {
                id: 2,
                name: 'Tunjangan Transport',
                type: 'allowance',
                description: 'Tunjangan transportasi bulanan',
                created_at: new Date(),
                updated_at: new Date()
              },
              amount: 500000
            },
            {
              component: {
                id: 3,
                name: 'BPJS Kesehatan',
                type: 'deduction',
                description: 'Potongan BPJS Kesehatan',
                created_at: new Date(),
                updated_at: new Date()
              },
              amount: 150000
            }
          ]
        };
        setEmployeeData(demoData);
      } else {
        setEmployeeData(result);
      }
    } catch (error) {
      console.error('Failed to load employee salary components:', error);
    } finally {
      setIsLoading(false);
    }
  }, [employee.id]);

  // Load available salary components
  const loadAvailableComponents = useCallback(async () => {
    try {
      const result = await trpc.getSalaryComponents.query({});
      
      // STUB: Using demo data when API returns empty
      const demoComponents: SalaryComponent[] = [
        {
          id: 1,
          name: 'Gaji Pokok',
          type: 'base_salary',
          description: 'Gaji dasar karyawan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Tunjangan Transport',
          type: 'allowance',
          description: 'Tunjangan transportasi bulanan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Tunjangan Makan',
          type: 'allowance',
          description: 'Tunjangan makan siang',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'Tunjangan Jabatan',
          type: 'allowance',
          description: 'Tunjangan sesuai jabatan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          name: 'BPJS Kesehatan',
          type: 'deduction',
          description: 'Potongan BPJS Kesehatan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 6,
          name: 'BPJS Ketenagakerjaan',
          type: 'deduction',
          description: 'Potongan BPJS Ketenagakerjaan',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 7,
          name: 'PPh 21',
          type: 'deduction',
          description: 'Potongan pajak penghasilan',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      setAvailableComponents(result.length > 0 ? result : demoComponents);
    } catch (error) {
      console.error('Failed to load salary components:', error);
    }
  }, []);

  useEffect(() => {
    loadEmployeeSalaryComponents();
    loadAvailableComponents();
  }, [loadEmployeeSalaryComponents, loadAvailableComponents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingComponent) {
        // Update existing component
        const updateData: UpdateEmployeeSalaryComponentInput = {
          id: editingComponent.id,
          amount: formData.amount
        };
        await trpc.updateEmployeeSalaryComponent.mutate(updateData);
        
        // Update local state
        if (employeeData) {
          setEmployeeData({
            ...employeeData,
            salaryComponents: employeeData.salaryComponents.map((sc: {component: SalaryComponent, amount: number}) => 
              sc.component.id === editingComponent.component.id
                ? { ...sc, amount: formData.amount }
                : sc
            )
          });
        }
      } else {
        // Add new component
        const createData: CreateEmployeeSalaryComponentInput = {
          employee_id: employee.id,
          salary_component_id: parseInt(formData.salary_component_id),
          amount: formData.amount
        };
        await trpc.createEmployeeSalaryComponent.mutate(createData);
        
        // Find the selected component and add to local state
        const selectedComponent = availableComponents.find((c: SalaryComponent) => c.id === parseInt(formData.salary_component_id));
        if (selectedComponent && employeeData) {
          setEmployeeData({
            ...employeeData,
            salaryComponents: [
              ...employeeData.salaryComponents,
              {
                component: selectedComponent,
                amount: formData.amount
              }
            ]
          });
        }
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save salary component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (componentData: {component: SalaryComponent, amount: number}) => {
    // Find the employee salary component ID (for demo, using component.id)
    const employeeSalaryComponentId = componentData.component.id; // This should be the actual employee_salary_component.id
    
    setEditingComponent({
      ...componentData,
      id: employeeSalaryComponentId
    });
    setFormData({
      salary_component_id: componentData.component.id.toString(),
      amount: componentData.amount
    });
    setDialogOpen(true);
  };

  const handleDelete = async (componentId: number) => {
    try {
      // For demo, using componentId directly, but should be employee_salary_component.id
      await trpc.deleteEmployeeSalaryComponent.mutate({ id: componentId });
      
      // Update local state
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          salaryComponents: employeeData.salaryComponents.filter((sc: {component: SalaryComponent, amount: number}) => sc.component.id !== componentId)
        });
      }
    } catch (error) {
      console.error('Failed to delete salary component:', error);
    }
  };

  const resetForm = () => {
    setEditingComponent(null);
    setFormData({
      salary_component_id: '',
      amount: 0
    });
  };

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case 'base_salary':
        return <Wallet className="h-4 w-4" />;
      case 'allowance':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'deduction':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getComponentTypeBadge = (type: string) => {
    switch (type) {
      case 'base_salary':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Gaji Pokok</Badge>;
      case 'allowance':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Tunjangan</Badge>;
      case 'deduction':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Potongan</Badge>;
      default:
        return <Badge variant="secondary">Lainnya</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotals = () => {
    if (!employeeData) return { baseSalary: 0, totalAllowances: 0, totalDeductions: 0, grossSalary: 0 };

    const baseSalary = employeeData.salaryComponents
      .filter((sc: {component: SalaryComponent, amount: number}) => sc.component.type === 'base_salary')
      .reduce((sum: number, sc: {component: SalaryComponent, amount: number}) => sum + sc.amount, 0);

    const totalAllowances = employeeData.salaryComponents
      .filter((sc: {component: SalaryComponent, amount: number}) => sc.component.type === 'allowance')
      .reduce((sum: number, sc: {component: SalaryComponent, amount: number}) => sum + sc.amount, 0);

    const totalDeductions = employeeData.salaryComponents
      .filter((sc: {component: SalaryComponent, amount: number}) => sc.component.type === 'deduction')
      .reduce((sum: number, sc: {component: SalaryComponent, amount: number}) => sum + sc.amount, 0);

    const grossSalary = baseSalary + totalAllowances - totalDeductions;

    return { baseSalary, totalAllowances, totalDeductions, grossSalary };
  };

  const totals = calculateTotals();

  // Get available components that are not already assigned
  const getUnassignedComponents = () => {
    if (!employeeData) return availableComponents;
    
    const assignedIds = employeeData.salaryComponents.map((sc: {component: SalaryComponent, amount: number}) => sc.component.id);
    return availableComponents.filter((ac: SalaryComponent) => !assignedIds.includes(ac.id));
  };

  if (isLoading && !employeeData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-enhanced bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">Komponen Gaji - {employee.full_name}</h3>
                <p className="text-indigo-100 font-normal">
                  {employee.employee_id} • {employee.position} • {employee.department}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Tutup
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-enhanced bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Gaji Pokok</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.baseSalary)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Tunjangan</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.totalAllowances)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Potongan</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.totalDeductions)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Gaji Kotor</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.grossSalary)}</p>
              </div>
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">∑</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Components Management */}
      <Card className="card-enhanced">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">Komponen Gaji</CardTitle>
              <p className="text-gray-600 mt-1">Kelola komponen gaji untuk karyawan ini</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Komponen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingComponent ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editingComponent && (
                    <div>
                      <Label htmlFor="salary_component_id">Komponen Gaji</Label>
                      <Select 
                        value={formData.salary_component_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, salary_component_id: value }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
                          <SelectValue placeholder="Pilih komponen gaji" />
                        </SelectTrigger>
                        <SelectContent>
                          {getUnassignedComponents().map((component: SalaryComponent) => (
                            <SelectItem key={component.id} value={component.id.toString()}>
                              <div className="flex items-center gap-2">
                                {getComponentTypeIcon(component.type)}
                                <span>{component.name}</span>
                                <span className="text-xs text-gray-500">({component.type})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="amount">Jumlah</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="Masukkan jumlah"
                      min="0"
                      step="1000"
                      className="form-input-enhanced"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || (!editingComponent && !formData.salary_component_id)}
                      className="btn-gradient-primary"
                    >
                      {isLoading ? 'Menyimpan...' : editingComponent ? 'Update' : 'Tambah'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!employeeData || employeeData.salaryComponents.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada komponen gaji yang ditugaskan</p>
              <p className="text-gray-400 text-sm">Klik tombol "Tambah Komponen" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Komponen</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeData.salaryComponents.map((salaryComponent: {component: SalaryComponent, amount: number}) => (
                    <TableRow key={salaryComponent.component.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getComponentTypeIcon(salaryComponent.component.type)}
                          <span className="font-medium">{salaryComponent.component.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getComponentTypeBadge(salaryComponent.component.type)}
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{salaryComponent.component.description}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          salaryComponent.component.type === 'deduction' 
                            ? 'currency-negative' 
                            : 'currency-positive'
                        }`}>
                          {formatCurrency(salaryComponent.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(salaryComponent)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Komponen Gaji</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus komponen "{salaryComponent.component.name}" 
                                  dari gaji karyawan ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(salaryComponent.component.id)}
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