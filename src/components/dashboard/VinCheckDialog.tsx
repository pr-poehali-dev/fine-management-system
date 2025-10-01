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
  DialogTrigger,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface VehicleInfo {
  found: boolean;
  vinCode?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  ownerName?: string;
  registrationDate?: string;
  lastInspection?: string;
  insuranceValidUntil?: string;
  message?: string;
}

interface VinCheckDialogProps {
  apiUrl: string;
}

export default function VinCheckDialog({ apiUrl }: VinCheckDialogProps) {
  const [open, setOpen] = useState(false);
  const [vinCode, setVinCode] = useState('');
  const [vinResult, setVinResult] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkVin = async () => {
    if (!vinCode) {
      toast({
        title: 'Ошибка',
        description: 'Введите VIN код',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}?action=vin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vinCode }),
      });
      const data = await response.json();
      setVinResult(data);
      
      if (data.found) {
        toast({
          title: 'Автомобиль найден',
          description: `${data.brand} ${data.model} (${data.year})`,
        });
      } else {
        toast({
          title: 'Не найдено',
          description: 'Автомобиль не найден в базе',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить VIN',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon name="Search" size={18} />
          VIN-проверка
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Проверка по VIN коду</DialogTitle>
          <DialogDescription>
            Введите VIN код автомобиля для получения информации
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>VIN код</Label>
            <Input
              placeholder="XTA21703050123456"
              value={vinCode}
              onChange={(e) => setVinCode(e.target.value)}
            />
          </div>
          <Button onClick={checkVin} disabled={loading} className="w-full">
            {loading ? 'Проверка...' : 'Проверить'}
          </Button>
          {vinResult && vinResult.found && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Марка:</strong> {vinResult.brand}</div>
                <div><strong>Модель:</strong> {vinResult.model}</div>
                <div><strong>Год:</strong> {vinResult.year}</div>
                <div><strong>Цвет:</strong> {vinResult.color}</div>
                <div className="col-span-2"><strong>Владелец:</strong> {vinResult.ownerName}</div>
                <div className="col-span-2"><strong>ГРЗ:</strong> {vinResult.licensePlate}</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
