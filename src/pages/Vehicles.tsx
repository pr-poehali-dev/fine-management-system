import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardNav from '@/components/dashboard/DashboardNav';

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  owner: string;
  violations: number;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('vehicles');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        licensePlate: 'А123БВ777',
        brand: 'Toyota',
        model: 'Camry',
        year: '2020',
        color: 'Черный',
        owner: 'Иванов Иван Иванович',
        violations: 3
      },
      {
        id: '2',
        licensePlate: 'В456ГД199',
        brand: 'BMW',
        model: 'X5',
        year: '2019',
        color: 'Белый',
        owner: 'Петров Петр Петрович',
        violations: 1
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    owner: '',
    vin: ''
  });

  const VEHICLE_CHECK_API = 'https://functions.poehali.dev/963eab3a-4c70-4443-9ba8-295a8917117e';

  const checkVehicle = async () => {
    if (!formData.licensePlate) {
      toast({
        title: 'Ошибка',
        description: 'Введите госномер',
        variant: 'destructive'
      });
      return;
    }

    setChecking(true);
    setCheckResult(null);

    try {
      const response = await fetch(`${VEHICLE_CHECK_API}?license_plate=${formData.licensePlate}`);
      const data = await response.json();
      setCheckResult(data);

      if (data.found) {
        setFormData({
          ...formData,
          brand: data.brand || '',
          model: data.model || '',
          year: data.year?.toString() || '',
          color: data.color || '',
          vin: data.vin || ''
        });
        toast({
          title: 'ТС найдено в базе',
          description: `${data.brand} ${data.model}, ${data.year}`,
        });
      } else {
        toast({
          title: 'ТС не найдено',
          description: 'Заполните данные вручную',
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка проверки',
        description: 'Не удалось проверить ТС',
        variant: 'destructive'
      });
    } finally {
      setChecking(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveVehicles = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    localStorage.setItem('vehicles', JSON.stringify(newVehicles));
  };

  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      ...formData,
      violations: 0
    };
    saveVehicles([...vehicles, newVehicle]);
    setFormData({ licensePlate: '', brand: '', model: '', year: '', color: '', owner: '', vin: '' });
    setIsAddDialogOpen(false);
    setCheckResult(null);
    toast({
      title: 'Автомобиль добавлен',
      description: 'Новое ТС успешно добавлено в реестр',
    });
  };

  const handleDeleteVehicle = (id: string) => {
    saveVehicles(vehicles.filter(v => v.id !== id));
    toast({
      title: 'Автомобиль удален',
      description: 'ТС удалено из реестра',
    });
  };

  const getVehicleFines = (licensePlate: string) => {
    const fines = JSON.parse(localStorage.getItem('fines') || '[]');
    return fines.filter((f: any) => f.licensePlate === licensePlate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Реестр транспортных средств</h1>
          <p className="text-gray-600 mt-1">Управление автомобилями и историей штрафов</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить ТС
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новое транспортное средство</DialogTitle>
              <DialogDescription>Заполните данные автомобиля</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {checkResult && checkResult.found && (
                <Alert className="bg-green-50 border-green-200">
                  <Icon name="CheckCircle2" size={18} className="text-green-600" />
                  <AlertDescription className="ml-2">
                    ТС найдено в базе! Данные автоматически заполнены.
                    {checkResult.fines && checkResult.fines.count > 0 && (
                      <span className="block text-red-600 mt-1">
                        Внимание: {checkResult.fines.count} штрафов на сумму {checkResult.fines.unpaid_amount} ₽
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="licensePlate">Госномер</Label>
                  <div className="flex gap-2">
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                      placeholder="А123БВ777"
                    />
                    <Button 
                      type="button" 
                      onClick={checkVehicle}
                      disabled={checking || !formData.licensePlate}
                    >
                      {checking ? (
                        <>
                          <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                          Проверка...
                        </>
                      ) : (
                        <>
                          <Icon name="Search" size={18} className="mr-2" />
                          Проверить
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="brand">Марка</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Модель</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Год выпуска</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Цвет</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Черный"
                  />
                </div>
                <div>
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                    placeholder="XTA..."
                    maxLength={17}
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Владелец</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setCheckResult(null);
                  setFormData({ licensePlate: '', brand: '', model: '', year: '', color: '', owner: '', vin: '' });
                }}>
                  Отмена
                </Button>
                <Button onClick={handleAddVehicle}>Добавить</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Список транспортных средств</CardTitle>
            <div className="w-80">
              <div className="relative">
                <Icon name="Search" size={18} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Поиск по номеру, марке или владельцу..."
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
                <TableHead>Госномер</TableHead>
                <TableHead>Марка и модель</TableHead>
                <TableHead>Год</TableHead>
                <TableHead>Цвет</TableHead>
                <TableHead>Владелец</TableHead>
                <TableHead>Штрафы</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-mono font-bold">{vehicle.licensePlate}</TableCell>
                  <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.color}</TableCell>
                  <TableCell>{vehicle.owner}</TableCell>
                  <TableCell>
                    <Badge variant={vehicle.violations > 0 ? 'destructive' : 'secondary'}>
                      {vehicle.violations}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <Icon name="Eye" size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Информация о транспортном средстве</DialogTitle>
                          </DialogHeader>
                          {selectedVehicle && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-600">Госномер</Label>
                                  <p className="font-mono font-bold text-lg">{selectedVehicle.licensePlate}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Марка и модель</Label>
                                  <p className="font-medium">{selectedVehicle.brand} {selectedVehicle.model}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Год выпуска</Label>
                                  <p className="font-medium">{selectedVehicle.year}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-600">Цвет</Label>
                                  <p className="font-medium">{selectedVehicle.color}</p>
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-gray-600">Владелец</Label>
                                  <p className="font-medium">{selectedVehicle.owner}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-3">История штрафов</h3>
                                <div className="space-y-2">
                                  {getVehicleFines(selectedVehicle.licensePlate).map((fine: any) => (
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
                                  {getVehicleFines(selectedVehicle.licensePlate).length === 0 && (
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
                        onClick={() => handleDeleteVehicle(vehicle.id)}
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