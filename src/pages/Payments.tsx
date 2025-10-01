import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { differenceInDays } from 'date-fns';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default function Payments() {
  const [fines, setFines] = useState(() => {
    const saved = localStorage.getItem('fines');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  const unpaidFines = fines.filter((f: any) => f.status === 'Не оплачен');

  const getDiscount = (violationDate: string) => {
    const daysPassed = differenceInDays(new Date(), new Date(violationDate));
    return daysPassed <= 20 ? 50 : 0;
  };

  const calculatePaymentAmount = (fine: any) => {
    const discount = getDiscount(fine.violationDate);
    return fine.amount * (1 - discount / 100);
  };

  const handlePayment = () => {
    if (!selectedFine) return;

    const updatedFines = fines.map((f: any) =>
      f.id === selectedFine.id
        ? { ...f, status: 'Оплачен', paymentDate: new Date().toISOString() }
        : f
    );

    setFines(updatedFines);
    localStorage.setItem('fines', JSON.stringify(updatedFines));
    setIsPaymentDialogOpen(false);
    setSelectedFine(null);

    toast({
      title: 'Оплата успешна',
      description: 'Штраф оплачен. Постановление обновлено.',
    });
  };

  const generateReceipt = (fine: any) => {
    const discount = getDiscount(fine.violationDate);
    const amount = calculatePaymentAmount(fine);

    const receipt = `
КВИТАНЦИЯ НА ОПЛАТУ ШТРАФА
========================

Постановление: ${fine.violationNumber}
Водитель: ${fine.driverName}
ТС: ${fine.licensePlate}

Нарушение: ${fine.violationType}
Дата нарушения: ${new Date(fine.violationDate).toLocaleDateString('ru-RU')}
Место: ${fine.location}

Сумма штрафа: ${fine.amount.toLocaleString('ru-RU')} ₽
${discount > 0 ? `Скидка 50%: -${(fine.amount * 0.5).toLocaleString('ru-RU')} ₽` : ''}
К оплате: ${amount.toLocaleString('ru-RU')} ₽

Реквизиты для оплаты:
ИНН: 7700000000
КПП: 770001001
Получатель: ГИБДД России
Счет: 40101810000000010001

Дата формирования: ${new Date().toLocaleString('ru-RU')}
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Квитанция_${fine.violationNumber}.txt`;
    a.click();

    toast({
      title: 'Квитанция сохранена',
      description: 'Файл успешно загружен',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Оплата штрафов</h1>
        <p className="text-gray-600 mt-1">Онлайн оплата и формирование квитанций</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>К оплате</CardDescription>
            <CardTitle className="text-4xl">{unpaidFines.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">штрафов ожидают оплаты</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Общая сумма</CardDescription>
            <CardTitle className="text-4xl text-red-600">
              {(unpaidFines.reduce((sum: number, f: any) => sum + f.amount, 0) / 1000).toFixed(0)}К
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {unpaidFines.reduce((sum: number, f: any) => sum + f.amount, 0).toLocaleString('ru-RU')} ₽
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Со скидкой 50%</CardDescription>
            <CardTitle className="text-4xl text-green-600">
              {unpaidFines.filter((f: any) => getDiscount(f.violationDate) > 0).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">штрафов доступны со скидкой</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Неоплаченные штрафы</CardTitle>
          <CardDescription>Выберите штраф для оплаты</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Водитель / ТС</TableHead>
                <TableHead>Нарушение</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaidFines.map((fine: any) => {
                const discount = getDiscount(fine.violationDate);
                const amount = calculatePaymentAmount(fine);
                return (
                  <TableRow key={fine.id}>
                    <TableCell className="font-mono">{fine.violationNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{fine.driverName}</p>
                        <p className="text-sm text-gray-600">{fine.licensePlate}</p>
                      </div>
                    </TableCell>
                    <TableCell>{fine.violationType}</TableCell>
                    <TableCell>{new Date(fine.violationDate).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      {discount > 0 ? (
                        <div>
                          <p className="line-through text-gray-400">{fine.amount.toLocaleString('ru-RU')} ₽</p>
                          <p className="font-bold text-green-600">{amount.toLocaleString('ru-RU')} ₽</p>
                        </div>
                      ) : (
                        <p className="font-bold">{fine.amount.toLocaleString('ru-RU')} ₽</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {discount > 0 ? (
                        <Badge className="bg-green-600">-50%</Badge>
                      ) : (
                        <Badge variant="secondary">Нет</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedFine(fine);
                            setIsPaymentDialogOpen(true);
                          }}
                        >
                          <Icon name="CreditCard" size={16} className="mr-2" />
                          Оплатить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReceipt(fine)}
                        >
                          <Icon name="Download" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {unpaidFines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Нет неоплаченных штрафов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оплата штрафа</DialogTitle>
            <DialogDescription>Введите данные для оплаты</DialogDescription>
          </DialogHeader>
          {selectedFine && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Постановление:</span>
                  <span className="font-mono font-bold">{selectedFine.violationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Нарушение:</span>
                  <span className="font-medium">{selectedFine.violationType}</span>
                </div>
                {getDiscount(selectedFine.violationDate) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Скидка 50%:</span>
                    <span className="font-bold">
                      -{(selectedFine.amount * 0.5).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>К оплате:</span>
                  <span>{calculatePaymentAmount(selectedFine).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Номер карты</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Срок действия</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handlePayment}>
                  <Icon name="CreditCard" size={18} className="mr-2" />
                  Оплатить {calculatePaymentAmount(selectedFine).toLocaleString('ru-RU')} ₽
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}