import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface StatsCardsProps {
  stats: {
    total: number;
    unpaid: number;
    paid: number;
    totalAmount: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon name="FileText" size={16} />
            Всего штрафов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            Не оплачено
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{stats.unpaid}</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon name="CheckCircle" size={16} />
            Оплачено
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{stats.paid}</div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon name="Wallet" size={16} />
            Общая сумма
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalAmount.toLocaleString('ru-RU')} ₽
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
