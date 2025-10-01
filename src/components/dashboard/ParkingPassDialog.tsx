import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ParkingFormData {
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  validUntil: string;
  parkingZones: string;
  notes: string;
}

interface ParkingPassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiUrl: string;
  onSuccess: () => void;
}

export default function ParkingPassDialog({ open, onOpenChange, apiUrl, onSuccess }: ParkingPassDialogProps) {
  const [formData, setFormData] = useState<ParkingFormData>({
    licensePlate: '',
    driverName: '',
    driverPhone: '',
    validUntil: '',
    parkingZones: 'Все зоны',
    notes: ''
  });
  const { toast } = useToast();

  const createParkingPass = async () => {
    if (!formData.licensePlate || !formData.driverName || !formData.validUntil) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}?action=parking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Пропуск создан',
          description: `№ ${data.passNumber}`,
        });
        onOpenChange(false);
        setFormData({
          licensePlate: '',
          driverName: '',
          driverPhone: '',
          validUntil: '',
          parkingZones: 'Все зоны',
          notes: ''
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать пропуск',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Выдача парковочного пропуска</DialogTitle>
          <DialogDescription>
            Заполните данные для создания бесплатного парковочного пропуска
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Гос. номер *</Label>
            <Input
              placeholder="А123ВВ777"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            />
          </div>
          <div>
            <Label>ФИО водителя *</Label>
            <Input
              placeholder="Иванов Иван Иванович"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
            />
          </div>
          <div>
            <Label>Телефон</Label>
            <Input
              placeholder="+7 (999) 123-45-67"
              value={formData.driverPhone}
              onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
            />
          </div>
          <div>
            <Label>Действителен до *</Label>
            <Input
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>
          <div>
            <Label>Зоны парковки</Label>
            <Select value={formData.parkingZones} onValueChange={(value) => setFormData({ ...formData, parkingZones: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все зоны">Все зоны</SelectItem>
                <SelectItem value="Центр">Только центр</SelectItem>
                <SelectItem value="МКАД">Только МКАД</SelectItem>
                <SelectItem value="Парки">Парки и скверы</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Примечания</Label>
            <Input
              placeholder="Дополнительная информация"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <Button onClick={createParkingPass} className="w-full">
            Создать пропуск
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
