import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeManagement } from './components/EmployeeManagement';
import { SalaryComponentManagement } from './components/SalaryComponentManagement';
import { PayrollProcessing } from './components/PayrollProcessing';
import { Reports } from './components/Reports';
import { Users, Wallet, Calculator, FileText } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              💰 Sistem Manajemen Gaji Karyawan
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Kelola data karyawan, komponen gaji, proses payroll, dan laporan dengan mudah
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-md">
            <TabsTrigger 
              value="employees" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manajemen Karyawan</span>
              <span className="sm:hidden">Karyawan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salary-components" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Komponen Gaji</span>
              <span className="sm:hidden">Gaji</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payroll" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Proses Payroll</span>
              <span className="sm:hidden">Payroll</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="salary-components">
            <SalaryComponentManagement />
          </TabsContent>

          <TabsContent value="payroll">
            <PayrollProcessing />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;