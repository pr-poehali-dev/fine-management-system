import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface DriverStats {
  name: string;
  totalFines: number;
  unpaidFines: number;
  totalAmount: number;
  unpaidAmount: number;
  vehicles: string[];
  fines: Fine[];
}

interface DriversTabProps {
  fines: Fine[];
}

export default function DriversTab({ fines }: DriversTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverStats | null>(null);

  const driverStats = fines.reduce((acc, fine) => {
    if (!acc[fine.driverName]) {
      acc[fine.driverName] = {
        name: fine.driverName,
        totalFines: 0,
        unpaidFines: 0,
        totalAmount: 0,
        unpaidAmount: 0,
        vehicles: new Set<string>(),
        fines: [],
      };
    }

    const driver = acc[fine.driverName];
    driver.totalFines++;
    driver.totalAmount += fine.amount;
    driver.vehicles.add(fine.licensePlate);
    driver.fines.push(fine);

    if (fine.status === 'Не оплачен') {
      driver.unpaidFines++;
      driver.unpaidAmount += fine.amount;
    }

    return acc;
  }, {} as Record<string, DriverStats & { vehicles: Set<string> }>);

  const drivers = Object.values(driverStats)
    .map((d) => ({ ...d, vehicles: Array.from(d.vehicles) }))
    .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getDriverStatus = (driver: DriverStats) => {
    if (driver.unpaidFines === 0) return { text: 'Чист', variant: 'default' as const };
    if (driver.unpaidFines <= 2) return { text: 'Есть штрафы', variant: 'secondary' as const };
    return { text: 'Нарушитель', variant: 'destructive' as const };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                Карточки водителей
              </CardTitle>
              <CardDescription>
                Статистика по каждому водителю и история нарушений
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Search" size={20} className="text-gray-400" />
              <Input
                placeholder="Поиск водителя..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Водители не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver) => {
                const status = getDriverStatus(driver);
                return (
                  <div
                    key={driver.name}
                    className="border rounded-lg p-4 bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-full p-3">
                          <Icon name="User" size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{driver.name}</h3>
                          <p className="text-sm text-gray-600">
                            {driver.vehicles.length} ТС
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Всего штрафов:</span>
                        <span className="font-bold">{driver.totalFines}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Не оплачено:</span>
                        <span className="font-bold text-red-600">{driver.unpaidFines}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Общая сумма:</span>
                        <span className="font-bold">{driver.totalAmount.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      {driver.unpaidAmount > 0 && (
                        <div className="flex items-center justify-between text-sm bg-red-50 p-2 rounded">
                          <span className="text-red-700 font-medium">К оплате:</span>
                          <span className="font-bold text-red-700">
                            {driver.unpaidAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-500">Транспорт:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {driver.vehicles.map((vehicle) => (
                          <Badge key={vehicle} variant="outline" className="text-xs">
                            {vehicle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2">
                <Icon name="User" size={20} className="text-white" />
              </div>
              {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Всего штрафов</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedDriver.totalFines}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Не оплачено</div>
                  <div className="text-2xl font-bold text-red-600">{selectedDriver.unpaidFines}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Общая сумма</div>
                  <div className="text-xl font-bold">{selectedDriver.totalAmount.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">К оплате</div>
                  <div className="text-xl font-bold text-orange-600">
                    {selectedDriver.unpaidAmount.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Car" size={18} />
                  Транспортные средства ({selectedDriver.vehicles.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDriver.vehicles.map((vehicle) => (
                    <Badge key={vehicle} variant="outline" className="text-sm py-1 px-3">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="FileText" size={18} />
                  История штрафов ({selectedDriver.fines.length})
                </h3>
                <div className="space-y-3">
                  {selectedDriver.fines.map((fine) => (
                    <div key={fine.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-sm font-bold">{fine.violationNumber}</div>
                        <Badge variant={fine.status === 'Оплачен' ? 'default' : 'destructive'}>
                          {fine.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">ТС:</span>{' '}
                          <span className="font-bold">{fine.licensePlate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Сумма:</span>{' '}
                          <span className="font-bold">{fine.amount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Нарушение:</span> {fine.violationType}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Дата:</span>{' '}
                          {new Date(fine.violationDate).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Место:</span> {fine.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
