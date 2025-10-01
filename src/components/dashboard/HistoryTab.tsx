import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DeletedFine {
  id: number;
  violationNumber: string;
  driverName: string;
  licensePlate: string;
  amount: number;
  deletedBy: string;
  deletedAt: string;
  reason: string;
}

interface HistoryTabProps {
  deletedHistory: DeletedFine[];
}

export default function HistoryTab({ deletedHistory }: HistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>История удаленных штрафов</CardTitle>
        <CardDescription>Список всех удаленных записей из базы данных</CardDescription>
      </CardHeader>
      <CardContent>
        {deletedHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="History" size={48} className="mx-auto mb-4 text-gray-300" />
            <p>История удалений пуста</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deletedHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{item.violationNumber}</div>
                  <Badge variant="destructive">Удалено</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Водитель:</strong> {item.driverName}</div>
                  <div><strong>ТС:</strong> {item.licensePlate}</div>
                  <div><strong>Сумма:</strong> {item.amount} ₽</div>
                  <div><strong>Удалил:</strong> {item.deletedBy}</div>
                  <div className="col-span-2">
                    <strong>Дата удаления:</strong> {new Date(item.deletedAt).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
