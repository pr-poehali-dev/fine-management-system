import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface AddFineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  apiUrl: string;
}

interface FineFormData {
  fine_number: string;
  driver_id: string;
  vehicle_id: string;
  amount: string;
  discount_amount: string;
  violation_date: string;
  violation_type: string;
  violation_location: string;
  payment_deadline: string;
  discount_deadline: string;
  issuing_authority: string;
  article_code: string;
  description: string;
}

export default function AddFineDialog({ open, onOpenChange, onSuccess, apiUrl }: AddFineDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FineFormData>({
    fine_number: '',
    driver_id: '',
    vehicle_id: '',
    amount: '',
    discount_amount: '',
    violation_date: '',
    violation_type: '',
    violation_location: '',
    payment_deadline: '',
    discount_deadline: '',
    issuing_authority: 'ГИБДД',
    article_code: '',
    description: '',
  });

  const violationTypes = [
    'Превышение скорости',
    'Проезд на красный свет',
    'Парковка в неположенном месте',
    'Непристегнутый ремень',
    'Использование телефона за рулем',
    'Нарушение разметки',
    'Выезд на встречную полосу',
    'Другое',
  ];

  const handleSubmit = async () => {
    if (!formData.fine_number || !formData.driver_id || !formData.vehicle_id || !formData.amount || !formData.violation_date) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля: номер постановления, водитель, ТС, сумма, дата',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fine_number: formData.fine_number,
          driver_id: parseInt(formData.driver_id),
          vehicle_id: parseInt(formData.vehicle_id),
          amount: parseFloat(formData.amount),
          discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : parseFloat(formData.amount) * 0.5,
          violation_date: formData.violation_date,
          violation_type: formData.violation_type,
          violation_location: formData.violation_location,
          payment_deadline: formData.payment_deadline || new Date(new Date(formData.violation_date).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          discount_deadline: formData.discount_deadline || new Date(new Date(formData.violation_date).getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issuing_authority: formData.issuing_authority,
          article_code: formData.article_code,
          description: formData.description,
          status: 'Неоплачен',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Штраф добавлен в базу данных',
        });
        
        setFormData({
          fine_number: '',
          driver_id: '',
          vehicle_id: '',
          amount: '',
          discount_amount: '',
          violation_date: '',
          violation_type: '',
          violation_location: '',
          payment_deadline: '',
          discount_deadline: '',
          issuing_authority: 'ГИБДД',
          article_code: '',
          description: '',
        });
        
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось добавить штраф',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить штраф',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Plus" size={24} className="text-blue-600" />
            Добавить новый штраф
          </DialogTitle>
          <DialogDescription>
            Заполните данные о нарушении. Поля со звездочкой (*) обязательны для заполнения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fine_number">Номер постановления *</Label>
              <Input
                id="fine_number"
                value={formData.fine_number}
                onChange={(e) => setFormData({ ...formData, fine_number: e.target.value })}
                placeholder="18810123456789012345"
              />
            </div>

            <div>
              <Label htmlFor="article_code">Статья КоАП</Label>
              <Input
                id="article_code"
                value={formData.article_code}
                onChange={(e) => setFormData({ ...formData, article_code: e.target.value })}
                placeholder="12.9.2"
              />
            </div>

            <div>
              <Label htmlFor="driver_id">ID Водителя *</Label>
              <Input
                id="driver_id"
                type="number"
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                placeholder="1"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_id">ID Транспорта *</Label>
              <Input
                id="vehicle_id"
                type="number"
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                placeholder="1"
              />
            </div>

            <div>
              <Label htmlFor="violation_type">Тип нарушения</Label>
              <Select
                value={formData.violation_type}
                onValueChange={(value) => setFormData({ ...formData, violation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {violationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="violation_date">Дата нарушения *</Label>
              <Input
                id="violation_date"
                type="date"
                value={formData.violation_date}
                onChange={(e) => setFormData({ ...formData, violation_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="amount">Сумма штрафа (₽) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
              />
            </div>

            <div>
              <Label htmlFor="discount_amount">Сумма со скидкой (₽)</Label>
              <Input
                id="discount_amount"
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                placeholder="2500"
              />
              <p className="text-xs text-gray-500 mt-1">По умолчанию 50% от суммы</p>
            </div>

            <div>
              <Label htmlFor="payment_deadline">Срок оплаты</Label>
              <Input
                id="payment_deadline"
                type="date"
                value={formData.payment_deadline}
                onChange={(e) => setFormData({ ...formData, payment_deadline: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">По умолчанию +60 дней</p>
            </div>

            <div>
              <Label htmlFor="discount_deadline">Срок скидки</Label>
              <Input
                id="discount_deadline"
                type="date"
                value={formData.discount_deadline}
                onChange={(e) => setFormData({ ...formData, discount_deadline: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">По умолчанию +20 дней</p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="violation_location">Место нарушения</Label>
              <Input
                id="violation_location"
                value={formData.violation_location}
                onChange={(e) => setFormData({ ...formData, violation_location: e.target.value })}
                placeholder="г. Москва, ул. Тверская, д. 1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="issuing_authority">Орган выдавший</Label>
              <Input
                id="issuing_authority"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дополнительная информация о нарушении"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить штраф
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
