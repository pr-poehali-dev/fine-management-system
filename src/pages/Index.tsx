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

export default function Index() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [filteredFines, setFilteredFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState<number | null>(null);
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
    const filtered = fines.filter(
      (fine) =>
        fine.violationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFines(filtered);
  }, [searchTerm, fines]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Shield" size={32} className="text-blue-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              УРМ CRM ГИБДД
            </h1>
          </div>
          <p className="text-gray-600">Система управления штрафами и нарушениями</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Всего штрафов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Не оплачено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.unpaid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Оплачено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
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

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>База данных штрафов</CardTitle>
                <CardDescription>
                  Управление записями и удаление из базы
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Search" size={20} className="text-gray-400" />
                <Input
                  placeholder="Поиск по номеру, водителю, ТС..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-700 hover:bg-blue-700">
                    <TableHead className="text-white">Номер постановления</TableHead>
                    <TableHead className="text-white">Водитель</TableHead>
                    <TableHead className="text-white">ТС</TableHead>
                    <TableHead className="text-white">Нарушение</TableHead>
                    <TableHead className="text-white">Дата</TableHead>
                    <TableHead className="text-white">Сумма</TableHead>
                    <TableHead className="text-white">Статус</TableHead>
                    <TableHead className="text-white">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {fine.violationNumber}
                      </TableCell>
                      <TableCell>{fine.driverName}</TableCell>
                      <TableCell className="font-semibold">
                        {fine.licensePlate}
                      </TableCell>
                      <TableCell>{fine.violationType}</TableCell>
                      <TableCell>
                        {new Date(fine.violationDate).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fine.amount.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>{getStatusBadge(fine.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(fine.id)}
                        >
                          <Icon name="Trash2" size={16} className="mr-1" />
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
                Штрафы не найдены
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту запись из базы данных? Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
