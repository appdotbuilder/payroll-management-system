import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SalaryComponent, CreateSalaryComponentInput, UpdateSalaryComponentInput, SalaryComponentType } from '../../../server/src/schema';

export function SalaryComponentManagement() {
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<SalaryComponent[]>([]);
  const [activeFilter, setActiveFilter] = useState<SalaryComponentType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSalaryComponentInput>({
    name: '',
    type: 'base_salary',
    description: null
  });

  // Load salary components data
  const loadComponents = useCallback(async () => {
    try {
      const result = await trpc.getSalaryComponents.query({});
      // STUB: Since backend returns empty array, using demo data
      const demoComponents: SalaryComponent[] = [
        {
          id: 1,
          name: 'Gaji Pokok',
          type: 'base_salary',
          description: 'Gaji dasar berdasarkan jabatan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 2,
          name: 'Tunjangan Jabatan',
          type: 'allowance',
          description: 'Tunjangan berdasarkan tingkat jabatan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 3,
          name: 'Tunjangan Transportasi',
          type: 'allowance',
          description: 'Tunjangan transport harian karyawan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 4,
          name: 'Tunjangan Makan',
          type: 'allowance',
          description: 'Tunjangan makan harian karyawan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 5,
          name: 'BPJS Kesehatan',
          type: 'deduction',
          description: 'Potongan iuran BPJS Kesehatan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 6,
          name: 'BPJS Ketenagakerjaan',
          type: 'deduction',
          description: 'Potongan iuran BPJS Ketenagakerjaan',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        },
        {
          id: 7,
          name: 'PPh 21',
          type: 'deduction',
          description: 'Potongan Pajak Penghasilan Pasal 21',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01')
        }
      ];
      setComponents(result.length > 0 ? result : demoComponents);
    } catch (error) {
      console.error('Failed to load salary components:', error);
    }
  }, []);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  // Filter components based on active filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredComponents(components);
    } else {
      setFilteredComponents(components.filter((comp: SalaryComponent) => comp.type === activeFilter));
    }
  }, [components, activeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingComponent) {
        const updateData: UpdateSalaryComponentInput = {
          id: editingComponent.id,
          ...formData
        };
        await trpc.updateSalaryComponent.mutate(updateData);
        // Update local state
        setComponents((prev: SalaryComponent[]) => 
          prev.map((comp: SalaryComponent) => 
            comp.id === editingComponent.id 
              ? { ...comp, ...formData, updated_at: new Date() }
              : comp
          )
        );
      } else {
        await trpc.createSalaryComponent.mutate(formData);
        // Add to local state
        const newComponent: SalaryComponent = {
          id: Date.now(), // STUB: using timestamp as ID
          ...formData,
          created_at: new Date(),
          updated_at: new Date()
        };
        setComponents((prev: SalaryComponent[]) => [...prev, newComponent]);
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save salary component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (component: SalaryComponent) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      type: component.type,
      description: component.description
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteSalaryComponent.mutate({ id });
      setComponents((prev: SalaryComponent[]) => prev.filter((comp: SalaryComponent) => comp.id !== id));
    } catch (error) {
      console.error('Failed to delete salary component:', error);
    }
  };

  const resetForm = () => {
    setEditingComponent(null);
    setFormData({
      name: '',
      type: 'base_salary',
      description: null
    });
  };

  const getComponentIcon = (type: SalaryComponentType) => {
    switch (type) {
      case 'base_salary':
        return <DollarSign className="h-4 w-4" />;
      case 'allowance':
        return <TrendingUp className="h-4 w-4" />;
      case 'deduction':
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getComponentColor = (type: SalaryComponentType) => {
    switch (type) {
      case 'base_salary':
        return 'bg-blue-100 text-blue-800';
      case 'allowance':
        return 'bg-green-100 text-green-800';
      case 'deduction':
        return 'bg-red-100 text-red-800';
    }
  };

  const getComponentLabel = (type: SalaryComponentType) => {
    switch (type) {
      case 'base_salary':
        return 'Gaji Pokok';
      case 'allowance':
        return 'Tunjangan';
      case 'deduction':
        return 'Potongan';
    }
  };

  const getComponentCounts = () => {
    return {
      all: components.length,
      base_salary: components.filter(c => c.type === 'base_salary').length,
      allowance: components.filter(c => c.type === 'allowance').length,
      deduction: components.filter(c => c.type === 'deduction').length
    };
  };

  const counts = getComponentCounts();

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="h-6 w-6 text-blue-600" />
              Manajemen Komponen Gaji
            </CardTitle>
            <p className="text-gray-600 mt-1">Kelola gaji pokok, tunjangan, dan potongan</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Komponen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingComponent ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Komponen</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateSalaryComponentInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Tunjangan Transportasi"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Jenis Komponen</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: SalaryComponentType) =>
                      setFormData((prev: CreateSalaryComponentInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base_salary">Gaji Pokok</SelectItem>
                      <SelectItem value="allowance">Tunjangan</SelectItem>
                      <SelectItem value="deduction">Potongan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateSalaryComponentInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Deskripsi komponen gaji..."
                    rows={3}
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : editingComponent ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as SalaryComponentType | 'all')}>
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-transparent h-auto">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Wallet className="h-4 w-4" />
                Semua ({counts.all})
              </TabsTrigger>
              <TabsTrigger 
                value="base_salary"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <DollarSign className="h-4 w-4" />
                Gaji Pokok ({counts.base_salary})
              </TabsTrigger>
              <TabsTrigger 
                value="allowance"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600"
              >
                <TrendingUp className="h-4 w-4" />
                Tunjangan ({counts.allowance})
              </TabsTrigger>
              <TabsTrigger 
                value="deduction"
                className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:border-b-2 data-[state=active]:border-red-600"
              >
                <TrendingDown className="h-4 w-4" />
                Potongan ({counts.deduction})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeFilter === 'all' 
                  ? 'Belum ada komponen gaji' 
                  : `Belum ada komponen ${getComponentLabel(activeFilter as SalaryComponentType).toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Nama Komponen</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((component: SalaryComponent) => (
                    <TableRow key={component.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getComponentColor(component.type)}`}>
                            {getComponentIcon(component.type)}
                          </div>
                          <span className="font-medium">{component.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getComponentColor(component.type)}>
                          {getComponentLabel(component.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-600 truncate">
                          {component.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell>{component.created_at.toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(component)}
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
                                <AlertDialogTitle>Hapus Komponen Gaji</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus komponen "{component.name}"? 
                                  Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi perhitungan gaji.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(component.id)}
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