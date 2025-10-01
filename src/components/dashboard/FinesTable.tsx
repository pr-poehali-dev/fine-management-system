import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GibddCheckDialog from '@/components/GibddCheckDialog';

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

interface FinesTableProps {
  filteredFines: Fine[];
  totalFines: number;
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  violationTypes: string[];
  statusTypes: string[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onPrintFine: (fine: Fine) => void;
  onDeleteFine: (id: number) => void;
  onOpenVinDialog: () => void;
  onExportExcel: () => void;
}

export default function FinesTable({
  filteredFines,
  totalFines,
  searchTerm,
  statusFilter,
  typeFilter,
  violationTypes,
  statusTypes,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onPrintFine,
  onDeleteFine,
  onOpenVinDialog,
  onExportExcel,
}: FinesTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Оплачен': 'default',
      'Не оплачен': 'destructive',
      'В обработке': 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
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
            <div className="flex flex-wrap gap-2">
              <GibddCheckDialog />
              <Button onClick={onOpenVinDialog} variant="outline" className="gap-2">
                <Icon name="Search" size={18} />
                VIN-проверка
              </Button>
              <Button onClick={onExportExcel} variant="outline" className="gap-2">
                <Icon name="Download" size={16} />
                Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Icon name="Search" size={20} className="text-gray-400" />
              <Input
                placeholder="Поиск по номеру, водителю, ТС..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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

            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
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
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintFine(fine)}
                        className="gap-1"
                      >
                        <Icon name="Printer" size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteFine(fine.id)}
                        className="gap-1"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
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
          Показано записей: {filteredFines.length} из {totalFines}
        </div>
      </CardContent>
    </Card>
  );
}
