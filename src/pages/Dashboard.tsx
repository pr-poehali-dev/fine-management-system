import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Icon from '@/components/ui/icon';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import ChartsSection from '@/components/dashboard/ChartsSection';
import FinesTable from '@/components/dashboard/FinesTable';
import HistoryTab from '@/components/dashboard/HistoryTab';
import ParkingTab from '@/components/dashboard/ParkingTab';
import VinCheckDialog from '@/components/dashboard/VinCheckDialog';
import ParkingPassDialog from '@/components/dashboard/ParkingPassDialog';
import DriversTab from '@/components/dashboard/DriversTab';

interface Fine {
  id: number;
  violationNumber: string;
  driverName: string;
  licensePlate: string;
  violationType: string;
  violationDate: string;
  amount: number;
  status: string;
  location: string;
  description: string;
}

interface DeletedFine extends Fine {
  deletedBy: string;
  deletedAt: string;
  reason: string;
}

interface ParkingPass {
  id: number;
  passNumber: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  validFrom: string;
  validUntil: string;
  parkingZones: string;
  status: string;
  issuedBy: string;
  issuedAt: string;
  notes: string;
}

const API_URL = 'https://functions.poehali.dev/e4da8fe6-8316-4b83-8d3e-1d73beb1a0bd';
const EXTENDED_API_URL = 'https://functions.poehali.dev/869845df-0ee4-4954-8a12-9b892d8d91df';

export default function Dashboard() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  const [deletedHistory, setDeletedHistory] = useState<DeletedFine[]>([]);
  const [parkingPasses, setParkingPasses] = useState<ParkingPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState<number | null>(null);
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const [selectedFineIds, setSelectedFineIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vinDialogOpen, setVinDialogOpen] = useState(false);
  const [parkingDialogOpen, setParkingDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchFines = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setFines(data.fines);
      setFilteredFines(data.fines);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedHistory = async () => {
    try {
      const response = await fetch(`${EXTENDED_API_URL}?action=history`);
      const data = await response.json();
      setDeletedHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch deleted history', error);
    }
  };

  const fetchParkingPasses = async () => {
    try {
      const response = await fetch(`${EXTENDED_API_URL}?action=parking`);
      const data = await response.json();
      setParkingPasses(data.passes || []);
    } catch (error) {
      console.error('Failed to fetch parking passes', error);
    }
  };

  useEffect(() => {
    fetchFines();
    fetchDeletedHistory();
    fetchParkingPasses();
  }, []);

  useEffect(() => {
    let filtered = fines.filter(
      (fine) =>
        fine.violationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((fine) => fine.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((fine) => fine.violationType === typeFilter);
    }

    setFilteredFines(filtered);
  }, [searchTerm, fines, statusFilter, typeFilter]);

  const handleLogout = () => {
    localStorage.removeItem('gibdd_auth');
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из системы',
    });
    navigate('/login');
  };

  const handleDelete = async () => {
    if (!selectedFineId) return;

    try {
      const response = await fetch(`${API_URL}?id=${selectedFineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Штраф удален из базы данных',
        });
        fetchFines();
        fetchDeletedHistory();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить штраф',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFineId(null);
    }
  };

  const handleDeleteParking = async (id: number) => {
    try {
      const response = await fetch(`${EXTENDED_API_URL}?action=parking&id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Парковочный пропуск удален',
        });
        fetchParkingPasses();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пропуск',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (id: number) => {
    setSelectedFineId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMultiple = (ids: number[]) => {
    setSelectedFineIds(ids);
    setDeleteMultipleDialogOpen(true);
  };

  const confirmDeleteMultiple = async () => {
    try {
      const deletePromises = selectedFineIds.map(id =>
        fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      toast({
        title: 'Успешно',
        description: `Удалено штрафов: ${selectedFineIds.length}`,
      });
      fetchFines();
      fetchDeletedHistory();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить штрафы',
        variant: 'destructive',
      });
    } finally {
      setDeleteMultipleDialogOpen(false);
      setSelectedFineIds([]);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredFines.map((fine) => ({
      'Номер постановления': fine.violationNumber,
      'Водитель': fine.driverName,
      'ТС': fine.licensePlate,
      'Нарушение': fine.violationType,
      'Дата': new Date(fine.violationDate).toLocaleDateString('ru-RU'),
      'Сумма (₽)': fine.amount,
      'Статус': fine.status,
      'Место': fine.location,
      'Описание': fine.description,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Штрафы');
    XLSX.writeFile(wb, `Штрафы_ГИБДД_${new Date().toLocaleDateString('ru-RU')}.xlsx`);

    toast({
      title: 'Экспорт завершен',
      description: 'Файл успешно сохранен',
    });
  };

  const printFine = (fine: Fine) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('POSTANOVLENIE', 105, 20, { align: 'center' } as any);
    doc.text('po delu ob administrativnom pravonarushenii', 105, 28, { align: 'center' } as any);
    
    doc.setFontSize(12);
    doc.text(`N ${fine.violationNumber}`, 105, 40, { align: 'center' } as any);
    
    doc.setFontSize(10);
    doc.text(`Voditel': ${fine.driverName}`, 20, 60);
    doc.text(`Transportnoe sredstvo: ${fine.licensePlate}`, 20, 70);
    doc.text(`Narushenie: ${fine.violationType}`, 20, 80);
    doc.text(`Data narusheniya: ${new Date(fine.violationDate).toLocaleDateString('ru-RU')}`, 20, 90);
    doc.text(`Mesto narusheniya: ${fine.location}`, 20, 100);
    doc.text(`Summa shtrafa: ${fine.amount.toLocaleString('ru-RU')} rub`, 20, 110);
    doc.text(`Status: ${fine.status}`, 20, 120);
    doc.text(`Opisanie: ${fine.description || '-'}`, 20, 130);
    
    doc.setFontSize(8);
    doc.text(`Data pechati: ${new Date().toLocaleString('ru-RU')}`, 20, 280);
    doc.text('GIBDD Rossii', 20, 285);
    
    doc.save(`Postanovlenie_${fine.violationNumber}.pdf`);
    
    toast({
      title: 'PDF создан',
      description: 'Постановление сохранено',
    });
  };

  const stats = {
    total: fines.length,
    unpaid: fines.filter((f) => f.status === 'Не оплачен').length,
    paid: fines.filter((f) => f.status === 'Оплачен').length,
    totalAmount: fines.reduce((acc, f) => acc + f.amount, 0),
  };

  const violationTypes = Array.from(new Set(fines.map((f) => f.violationType)));
  const statusTypes = Array.from(new Set(fines.map((f) => f.status)));

  const violationChartData = violationTypes.map((type) => ({
    name: type,
    count: fines.filter((f) => f.violationType === type).length,
  }));

  const statusChartData = statusTypes.map((status) => ({
    name: status,
    value: fines.filter((f) => f.status === status).length,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardHeader
        stats={stats}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onExportExcel={exportToExcel}
        onOpenVinDialog={() => setVinDialogOpen(true)}
        onOpenParkingDialog={() => setParkingDialogOpen(true)}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 pb-8">
        <StatsCards stats={stats} />
        <ChartsSection violationChartData={violationChartData} statusChartData={statusChartData} />

        <Tabs defaultValue="fines" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fines">
              <Icon name="Database" size={16} className="mr-2" />
              Штрафы
            </TabsTrigger>
            <TabsTrigger value="drivers">
              <Icon name="Users" size={16} className="mr-2" />
              Водители
            </TabsTrigger>
            <TabsTrigger value="history">
              <Icon name="History" size={16} className="mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="parking">
              <Icon name="Car" size={16} className="mr-2" />
              Парковки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fines">
            <FinesTable
              filteredFines={filteredFines}
              totalFines={fines.length}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              violationTypes={violationTypes}
              statusTypes={statusTypes}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onTypeFilterChange={setTypeFilter}
              onPrintFine={printFine}
              onDeleteFine={openDeleteDialog}
              onDeleteMultiple={handleDeleteMultiple}
              onOpenVinDialog={() => setVinDialogOpen(true)}
              onExportExcel={exportToExcel}
            />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversTab fines={fines} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab deletedHistory={deletedHistory} />
          </TabsContent>

          <TabsContent value="parking">
            <ParkingTab
              parkingPasses={parkingPasses}
              onOpenParkingDialog={() => setParkingDialogOpen(true)}
              onDeletePass={handleDeleteParking}
            />
          </TabsContent>
        </Tabs>
      </div>

      <VinCheckDialog apiUrl={EXTENDED_API_URL} />

      <ParkingPassDialog
        open={parkingDialogOpen}
        onOpenChange={setParkingDialogOpen}
        apiUrl={EXTENDED_API_URL}
        onSuccess={fetchParkingPasses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
              Подтверждение удаления
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту запись из базы данных ГИБДД? Это действие
              нельзя отменить. Восстановление данных будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить безвозвратно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteMultipleDialogOpen} onOpenChange={setDeleteMultipleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
              Массовое удаление штрафов
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedFineIds.length} {selectedFineIds.length === 1 ? 'штраф' : 'штрафа(ов)'} из базы данных ГИБДД? 
              Это действие нельзя отменить. Восстановление данных будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMultiple}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить все ({selectedFineIds.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}