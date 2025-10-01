import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const GIBDD_API_URL = 'https://functions.poehali.dev/1b7c745a-4443-4ad7-89fa-14fdd174a2d5';

interface GibddFine {
  uinNumber: string;
  violationType: string;
  violationDate: string;
  amount: number;
  discount: boolean;
  discountAmount: number;
  status: string;
  location: string;
  canPay: boolean;
}

interface GibddResponse {
  success: boolean;
  licenseNumber: string;
  stsNumber: string;
  foundFines: number;
  totalAmount: number;
  totalWithDiscount: number;
  fines: GibddFine[];
  checkedAt: string;
  source: string;
}

export default function GibddCheckDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stsNumber, setStsNumber] = useState('');
  const [result, setResult] = useState<GibddResponse | null>(null);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!licenseNumber || !stsNumber) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(GIBDD_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseNumber,
          stsNumber,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.foundFines === 0) {
        toast({
          title: 'Проверка завершена',
          description: 'Штрафы не найдены',
        });
      } else {
        toast({
          title: 'Найдены штрафы',
          description: `Обнаружено штрафов: ${data.foundFines}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить штрафы',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLicenseNumber('');
    setStsNumber('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon name="Search" size={18} />
          Проверить через API ГИБДД
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Shield" size={24} className="text-primary" />
            Проверка штрафов через API ГИБДД
          </DialogTitle>
          <DialogDescription>
            Введите номер водительского удостоверения и СТС для проверки штрафов
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">Номер ВУ</Label>
              <Input
                id="license"
                placeholder="7712345678"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sts">Номер СТС</Label>
              <Input
                id="sts"
                placeholder="77АВ123456"
                value={stsNumber}
                onChange={(e) => setStsNumber(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCheck} disabled={loading} className="flex-1">
              {loading ? (
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
            {result && (
              <Button onClick={handleReset} variant="outline">
                Сбросить
              </Button>
            )}
          </div>

          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Номер ВУ:</p>
                    <p className="font-semibold">{result.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Номер СТС:</p>
                    <p className="font-semibold">{result.stsNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Найдено штрафов:</p>
                    <p className="font-bold text-red-600 text-lg">{result.foundFines}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Общая сумма:</p>
                    <p className="font-bold text-lg">
                      {result.totalAmount.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  {result.totalWithDiscount < result.totalAmount && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Со скидкой 50%:</p>
                      <p className="font-bold text-green-600 text-lg">
                        {result.totalWithDiscount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {result.fines.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Детали штрафов:</h3>
                  {result.fines.map((fine) => (
                    <div key={fine.uinNumber} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name="AlertCircle" size={20} className="text-red-600" />
                          <span className="font-semibold">{fine.violationType}</span>
                        </div>
                        <Badge variant="destructive">{fine.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">УИН:</p>
                          <p className="font-mono">{fine.uinNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Дата:</p>
                          <p>{new Date(fine.violationDate).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Место:</p>
                          <p>{fine.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Сумма:</p>
                          <p className="font-bold">
                            {fine.amount.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      </div>
                      {fine.discount && (
                        <div className="bg-green-50 p-2 rounded flex items-center gap-2 text-sm">
                          <Icon name="CheckCircle" size={16} className="text-green-600" />
                          <span className="text-green-700">
                            Доступна скидка 50%: {fine.discountAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 text-center">
                Проверено: {new Date(result.checkedAt).toLocaleString('ru-RU')}
                <br />
                {result.source}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
