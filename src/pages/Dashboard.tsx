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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Icon from '@/components/ui/icon';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
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
  fine_number: string;
  driver_id: number;
  vehicle_id: number;
  amount: number;
  discount_amount: number;
  violation_date: string;
  violation_type: string;
  violation_location: string;
  payment_deadline: string;
  status: string;
  discount_deadline: string;
  issuing_authority: string;
  article_code: string;
  description: string;
  driver_name?: string;
  license_plate?: string;
  violationNumber?: string;
  driverName?: string;
  violationType?: string;
  violationDate?: string;
  location?: string;
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

const FINES_API_URL = 'https://functions.poehali.dev/01bce009-aa74-42ea-86d0-482816a6f06f';
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
  const [addFineDialogOpen, setAddFineDialogOpen] = useState(false);
  const [newFineData, setNewFineData] = useState({
    fine_number: '',
    driver_id: '',
    vehicle_id: '',
    amount: '',
    violation_date: '',
    violation_type: '',
    violation_location: '',
    payment_deadline: '',
    discount_deadline: '',
    issuing_authority: '',
    article_code: '',
    description: '',
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddFine = async () => {
    try {
      const amount = parseFloat(newFineData.amount);
      const discount_amount = amount * 0.5;

      const response = await fetch(FINES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFineData,
          driver_id: parseInt(newFineData.driver_id) || null,
          vehicle_id: parseInt(newFineData.vehicle_id) || null,
          amount,
          discount_amount,
          status: 'Неоплачен',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Штраф добавлен в базу данных',
        });
        setAddFineDialogOpen(false);
        setNewFineData({
          fine_number: '',
          driver_id: '',
          vehicle_id: '',
          amount: '',
          violation_date: '',
          violation_type: '',
          violation_location: '',
          payment_deadline: '',
          discount_deadline: '',
          issuing_authority: '',
          article_code: '',
          description: '',
        });
        fetchFines();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить штраф',
        variant: 'destructive',
      });
    }
  };

  const fetchFines = async () => {
    try {
      const response = await fetch(FINES_API_URL);
      const data = await response.json();
      
      const mappedFines = data.fines.map((f: any) => ({
        ...f,
        violationNumber: f.fine_number,
        driverName: f.driver_name || 'Не указан',
        licensePlate: f.license_plate || 'Не указан',
        violationType: f.violation_type,
        violationDate: f.violation_date,
        location: f.violation_location,
      }));
      
      setFines(mappedFines);
      setFilteredFines(mappedFines);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные из базы',
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
    let filtered = fines.filter((fine) => fine.status !== 'Удален');
    
    filtered = filtered.filter(
      (fine) =>
        (fine.violationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()))
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
      const response = await fetch(FINES_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedFineId, 
          status: 'Удален'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Штраф помечен как удаленный',
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
        fetch(FINES_API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'Удален' }),
        })
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
      'Номер постановления': fine.violationNumber || fine.fine_number,
      'Водитель': fine.driverName || 'Неизвестен',
      'ТС': fine.licensePlate || 'Неизвестен',
      'Нарушение': fine.violationType || fine.violation_type,
      'Дата': new Date(fine.violationDate || fine.violation_date).toLocaleDateString('ru-RU'),
      'Сумма (₽)': fine.amount,
      'Статус': fine.status,
      'Место': fine.location || fine.violation_location,
      'Описание': fine.description || '-',
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
    doc.text(`N ${fine.violationNumber || fine.fine_number}`, 105, 40, { align: 'center' } as any);
    
    doc.setFontSize(10);
    doc.text(`Voditel': ${fine.driverName || 'Неизвестен'}`, 20, 60);
    doc.text(`Transportnoe sredstvo: ${fine.licensePlate || 'Неизвестен'}`, 20, 70);
    doc.text(`Narushenie: ${fine.violationType || fine.violation_type}`, 20, 80);
    doc.text(`Data narusheniya: ${new Date(fine.violationDate || fine.violation_date).toLocaleDateString('ru-RU')}`, 20, 90);
    doc.text(`Mesto narusheniya: ${fine.location || fine.violation_location}`, 20, 100);
    doc.text(`Summa shtrafa: ${fine.amount.toLocaleString('ru-RU')} rub`, 20, 110);
    doc.text(`Status: ${fine.status}`, 20, 120);
    doc.text(`Opisanie: ${fine.description || '-'}`, 20, 130);
    
    doc.setFontSize(8);
    doc.text(`Data pechati: ${new Date().toLocaleString('ru-RU')}`, 20, 280);
    
    doc.save(`Postanovlenie_${fine.violationNumber || fine.fine_number}.pdf`);
    
    toast({
      title: 'PDF создан',
      description: 'Постановление сохранено',
    });
  };

  const stats = {
    total: fines.filter((f) => f.status !== 'Удален').length,
    unpaid: fines.filter((f) => f.status === 'Неоплачен').length,
    paid: fines.filter((f) => f.status === 'Оплачен').length,
    totalAmount: fines.filter((f) => f.status !== 'Удален').reduce((acc, f) => acc + f.amount, 0),
  };

  const activeFines = fines.filter((f) => f.status !== 'Удален');
  const violationTypes = Array.from(new Set(activeFines.map((f) => f.violationType || f.violation_type)));
  const statusTypes = Array.from(new Set(activeFines.map((f) => f.status)));

  const violationChartData = violationTypes.map((type) => ({
    name: type,
    count: activeFines.filter((f) => (f.violationType || f.violation_type) === type).length,
  }));

  const statusChartData = statusTypes.map((status) => ({
    name: status,
    value: activeFines.filter((f) => f.status === status).length,
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
      <DashboardNav />
      
      <DashboardHeader
        stats={stats}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onExportExcel={exportToExcel}
        onOpenVinDialog={() => setVinDialogOpen(true)}
        onOpenParkingDialog={() => setParkingDialogOpen(true)}
        onOpenAddFineDialog={() => setAddFineDialogOpen(true)}
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

      <Dialog open={addFineDialogOpen} onOpenChange={setAddFineDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить новый штраф</DialogTitle>
            <DialogDescription>Заполните данные о новом штрафе ГИБДД</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fine_number">Номер постановления</Label>
                <Input
                  id="fine_number"
                  value={newFineData.fine_number}
                  onChange={(e) => setNewFineData({ ...newFineData, fine_number: e.target.value })}
                  placeholder="18810177230408123456"
                />
              </div>
              <div>
                <Label htmlFor="amount">Сумма штрафа (₽)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newFineData.amount}
                  onChange={(e) => setNewFineData({ ...newFineData, amount: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="driver_id">ID водителя</Label>
                <Input
                  id="driver_id"
                  type="number"
                  value={newFineData.driver_id}
                  onChange={(e) => setNewFineData({ ...newFineData, driver_id: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_id">ID транспорта</Label>
                <Input
                  id="vehicle_id"
                  type="number"
                  value={newFineData.vehicle_id}
                  onChange={(e) => setNewFineData({ ...newFineData, vehicle_id: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="violation_date">Дата нарушения</Label>
                <Input
                  id="violation_date"
                  type="date"
                  value={newFineData.violation_date}
                  onChange={(e) => setNewFineData({ ...newFineData, violation_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="violation_type">Тип нарушения</Label>
                <Input
                  id="violation_type"
                  value={newFineData.violation_type}
                  onChange={(e) => setNewFineData({ ...newFineData, violation_type: e.target.value })}
                  placeholder="Превышение скорости"
                />
              </div>
              <div>
                <Label htmlFor="payment_deadline">Срок оплаты</Label>
                <Input
                  id="payment_deadline"
                  type="date"
                  value={newFineData.payment_deadline}
                  onChange={(e) => setNewFineData({ ...newFineData, payment_deadline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="discount_deadline">Срок оплаты со скидкой</Label>
                <Input
                  id="discount_deadline"
                  type="date"
                  value={newFineData.discount_deadline}
                  onChange={(e) => setNewFineData({ ...newFineData, discount_deadline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="article_code">Статья КоАП</Label>
                <Input
                  id="article_code"
                  value={newFineData.article_code}
                  onChange={(e) => setNewFineData({ ...newFineData, article_code: e.target.value })}
                  placeholder="12.9 ч.2"
                />
              </div>
              <div>
                <Label htmlFor="issuing_authority">Орган выдачи</Label>
                <Input
                  id="issuing_authority"
                  value={newFineData.issuing_authority}
                  onChange={(e) => setNewFineData({ ...newFineData, issuing_authority: e.target.value })}
                  placeholder="ГИБДД МВД России"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="violation_location">Место нарушения</Label>
                <Input
                  id="violation_location"
                  value={newFineData.violation_location}
                  onChange={(e) => setNewFineData({ ...newFineData, violation_location: e.target.value })}
                  placeholder="г. Москва, ул. Тверская, д. 1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={newFineData.description}
                  onChange={(e) => setNewFineData({ ...newFineData, description: e.target.value })}
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddFineDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddFine}>
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить штраф
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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