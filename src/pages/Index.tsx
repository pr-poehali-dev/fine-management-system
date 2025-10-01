import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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

const API_URL = 'https://functions.poehali.dev/e4da8fe6-8316-4b83-8d3e-1d73beb1a0bd';

const COLORS = ['#0056b3', '#dc2626', '#10b981', '#f59e0b'];

export default function Index() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchFines();
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

  const openDeleteDialog = (id: number) => {
    setSelectedFineId(id);
    setDeleteDialogOpen(true);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Оплачен': 'default',
      'Не оплачен': 'destructive',
      'В обработке': 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
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

  const monthlyData = fines.reduce((acc, fine) => {
    const month = new Date(fine.violationDate).toLocaleString('ru-RU', { month: 'short' });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.amount += fine.amount;
      existing.count += 1;
    } else {
      acc.push({ month, amount: fine.amount, count: 1 });
    }
    return acc;
  }, [] as { month: string; amount: number; count: number }[]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-primary py-4 shadow-md mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-md">
                <Icon name="Shield" size={32} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  ГИБДД России
                </h1>
                <p className="text-blue-100 text-xs md:text-sm">Управление штрафами и нарушениями</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-white text-sm">
                <Icon name="Phone" size={16} />
                <span>8 (800) 000-00-00</span>
              </div>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white">
                    <Icon name="Menu" size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Icon name="Shield" size={24} className="text-primary" />
                      Меню
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500 uppercase">Статистика</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name="FileText" size={20} className="text-blue-600" />
                            <span className="text-sm font-medium">Всего штрафов</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">{stats.total}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name="AlertCircle" size={20} className="text-red-600" />
                            <span className="text-sm font-medium">Не оплачено</span>
                          </div>
                          <span className="text-lg font-bold text-red-600">{stats.unpaid}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name="CheckCircle" size={20} className="text-green-600" />
                            <span className="text-sm font-medium">Оплачено</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">{stats.paid}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name="Wallet" size={20} className="text-gray-700" />
                            <span className="text-sm font-medium">Общая сумма</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {stats.totalAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500 uppercase">Действия</h3>
                      <Button onClick={() => { exportToExcel(); setMobileMenuOpen(false); }} variant="outline" className="w-full justify-start gap-2">
                        <Icon name="Download" size={18} />
                        Экспорт в Excel
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500 uppercase">Контакты</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Phone" size={18} className="text-primary" />
                        <span>8 (800) 000-00-00</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Mail" size={18} className="text-primary" />
                        <span>info@gibdd.ru</span>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Icon name="FileText" size={16} />
                Всего штрафов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Icon name="AlertCircle" size={16} />
                Не оплачено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.unpaid}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Icon name="CheckCircle" size={16} />
                Оплачено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Icon name="Wallet" size={16} />
                Общая сумма
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalAmount.toLocaleString('ru-RU')} ₽
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" size={20} />
                Статистика по типам нарушений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={violationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0056b3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="PieChart" size={20} />
                Распределение по статусам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Database" size={20} />
                    База данных штрафов
                  </CardTitle>
                  <CardDescription>
                    Управление записями и удаление из базы
                  </CardDescription>
                </div>
                <Button onClick={exportToExcel} variant="outline" className="gap-2">
                  <Icon name="Download" size={16} />
                  Экспорт в Excel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="Search" size={20} className="text-gray-400" />
                  <Input
                    placeholder="Поиск по номеру, водителю, ТС..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Фильтр по статусу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {statusTypes.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Фильтр по типу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы нарушений</SelectItem>
                    {violationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-white font-semibold">Номер постановления</TableHead>
                    <TableHead className="text-white font-semibold">Водитель</TableHead>
                    <TableHead className="text-white font-semibold">ТС</TableHead>
                    <TableHead className="text-white font-semibold">Нарушение</TableHead>
                    <TableHead className="text-white font-semibold">Дата</TableHead>
                    <TableHead className="text-white font-semibold">Сумма</TableHead>
                    <TableHead className="text-white font-semibold">Статус</TableHead>
                    <TableHead className="text-white font-semibold">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine, index) => (
                    <TableRow key={fine.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}>
                      <TableCell className="font-mono text-sm font-medium">
                        {fine.violationNumber}
                      </TableCell>
                      <TableCell className="font-medium">{fine.driverName}</TableCell>
                      <TableCell className="font-bold text-blue-900">
                        {fine.licensePlate}
                      </TableCell>
                      <TableCell>{fine.violationType}</TableCell>
                      <TableCell>
                        {new Date(fine.violationDate).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell className="font-bold">
                        {fine.amount.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>{getStatusBadge(fine.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(fine.id)}
                          className="gap-1"
                        >
                          <Icon name="Trash2" size={14} />
                          Удалить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredFines.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Штрафы не найдены</p>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              Показано записей: {filteredFines.length} из {fines.length}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}