import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

interface ParkingTabProps {
  parkingPasses: ParkingPass[];
  onOpenParkingDialog: () => void;
  onDeletePass: (id: number) => void;
}

export default function ParkingTab({ parkingPasses, onOpenParkingDialog, onDeletePass }: ParkingTabProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Активен': 'default',
      'Истек': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Бесплатные парковочные пропуска</CardTitle>
            <CardDescription>Выдача и управление пропусками для парковок</CardDescription>
          </div>
          <Button onClick={onOpenParkingDialog} className="gap-2">
            <Icon name="Plus" size={18} />
            Выдать пропуск
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {parkingPasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="Car" size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Парковочные пропуска отсутствуют</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parkingPasses.map((pass) => (
              <div key={pass.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-lg">№ {pass.passNumber}</div>
                    {getStatusBadge(pass.status)}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => onDeletePass(pass.id)}
                    className="gap-1"
                  >
                    <Icon name="Trash2" size={14} />
                    Удалить
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Car" size={16} className="text-primary" />
                    <span><strong>ТС:</strong> {pass.licensePlate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="User" size={16} className="text-primary" />
                    <span><strong>Водитель:</strong> {pass.driverName}</span>
                  </div>
                  {pass.driverPhone && (
                    <div className="flex items-center gap-2">
                      <Icon name="Phone" size={16} className="text-primary" />
                      <span>{pass.driverPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon name="MapPin" size={16} className="text-primary" />
                    <span>{pass.parkingZones}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-primary" />
                    <span><strong>Действителен до:</strong> {new Date(pass.validUntil).toLocaleString('ru-RU')}</span>
                  </div>
                  {pass.notes && (
                    <div className="col-span-2 text-gray-600">
                      <strong>Примечания:</strong> {pass.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}