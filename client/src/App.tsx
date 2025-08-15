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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Card className="mb-6 card-enhanced border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-4xl font-bold flex items-center justify-center gap-4 text-shadow">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                💰
              </div>
              Sistem Manajemen Gaji Karyawan
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg mt-4 text-shadow">
              Platform lengkap untuk mengelola data karyawan, komponen gaji, proses payroll, dan laporan perusahaan
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50 p-1">
            <TabsTrigger 
              value="employees" 
              className="flex items-center gap-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Manajemen Karyawan</span>
              <span className="sm:hidden font-medium">Karyawan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salary-components" 
              className="flex items-center gap-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-green-50"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Komponen Gaji</span>
              <span className="sm:hidden font-medium">Gaji</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payroll" 
              className="flex items-center gap-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-50"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Proses Payroll</span>
              <span className="sm:hidden font-medium">Payroll</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-orange-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Laporan</span>
              <span className="sm:hidden font-medium">Reports</span>
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