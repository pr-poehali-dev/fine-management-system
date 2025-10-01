import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardNav from '@/components/dashboard/DashboardNav';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  birthDate: string;
  phone: string;
  address: string;
  violations: number;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('drivers');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Иванов Иван Иванович',
        licenseNumber: '77 АА 123456',
        birthDate: '1985-06-15',
        phone: '+7 (999) 123-45-67',
        address: 'г. Москва, ул. Ленина, д. 10',
        violations: 3
      },
      {
        id: '2',
        name: 'Петров Петр Петрович',
        licenseNumber: '99 ВВ 654321',
        birthDate: '1990-03-20',
        phone: '+7 (999) 765-43-21',
        address: 'г. Санкт-Петербург, пр. Невский, д. 25',
        violations: 1
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    birthDate: '',
    phone: '',
    address: ''
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveDrivers = (newDrivers: Driver[]) => {
    setDrivers(newDrivers);
    localStorage.setItem('drivers', JSON.stringify(newDrivers));
  };

  const handleAddDriver = () => {
    const newDriver: Driver = {
      id: Date.now().toString(),
      ...formData,
      violations: 0
    };
    saveDrivers([...drivers, newDriver]);
    setFormData({ name: '', licenseNumber: '', birthDate: '', phone: '', address: '' });
    setIsAddDialogOpen(false);
    toast({
      title: 'Водитель добавлен',
      description: 'Новый водитель успешно добавлен в базу',
    });
  };

  const handleDeleteDriver = (id: string) => {
    saveDrivers(drivers.filter(d => d.id !== id));
    toast({
      title: 'Водитель удален',
      description: 'Водитель удален из базы данных',
    });
  };

  const getDriverFines = (driverName: string) => {
    const fines = JSON.parse(localStorage.getItem('fines') || '[]');
    return fines.filter((f: any) => f.driverName === driverName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">База водителей</h1>
          <p className="text-gray-600 mt-1">Управление водителями и их историей нарушений</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Добавить водителя
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый водитель</DialogTitle>
              <DialogDescription>Заполните данные водителя</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">ФИО</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNumber">Номер ВУ</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="77 АА 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Дата рождения</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="г. Москва, ул. Ленина, д. 10"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddDriver}>Добавить</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Список водителей</CardTitle>
            <div className="w-80">
              <div className="relative">
                <Icon name="Search" size={18} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Поиск по имени или номеру ВУ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Номер ВУ</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Нарушения</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{new Date(driver.birthDate).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell>
                    <Badge variant={driver.violations > 0 ? 'destructive' : 'secondary'}>
                      {driver.violations}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDriver(driver)}
                          >
                            <Icon name="Eye" size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Информация о водителе</DialogTitle>
                          </DialogHeader>
                          {selectedDriver && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-600">ФИО</Label>
                                  <p className="font-medium">{selectedDriver.name}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Номер ВУ</Label>
                                  <p className="font-medium">{selectedDriver.licenseNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Телефон</Label>
                                  <p className="font-medium">{selectedDriver.phone}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Дата рождения</Label>
                                  <p className="font-medium">
                                    {new Date(selectedDriver.birthDate).toLocaleDateString('ru-RU')}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-gray-600">Адрес</Label>
                                  <p className="font-medium">{selectedDriver.address}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-3">История штрафов</h3>
                                <div className="space-y-2">
                                  {getDriverFines(selectedDriver.name).map((fine: any) => (
                                    <div
                                      key={fine.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div>
                                        <p className="font-medium">{fine.violationType}</p>
                                        <p className="text-sm text-gray-600">
                                          {new Date(fine.violationDate).toLocaleDateString('ru-RU')} • {fine.location}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold">{fine.amount.toLocaleString('ru-RU')} ₽</p>
                                        <Badge variant={fine.status === 'Оплачен' ? 'secondary' : 'destructive'}>
                                          {fine.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  {getDriverFines(selectedDriver.name).length === 0 && (
                                    <p className="text-gray-500 text-center py-4">Нет штрафов</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDriver(driver.id)}
                      >
                        <Icon name="Trash2" size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}