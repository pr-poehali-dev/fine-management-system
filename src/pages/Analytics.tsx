import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Analytics() {
  const fines = JSON.parse(localStorage.getItem('fines') || '[]');

  const totalFines = fines.length;
  const totalAmount = fines.reduce((sum: number, f: any) => sum + f.amount, 0);
  const paidFines = fines.filter((f: any) => f.status === 'Оплачен').length;
  const unpaidAmount = fines
    .filter((f: any) => f.status === 'Не оплачен')
    .reduce((sum: number, f: any) => sum + f.amount, 0);

  const violationStats = fines.reduce((acc: any, f: any) => {
    acc[f.violationType] = (acc[f.violationType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(violationStats).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return format(date, 'dd.MM', { locale: ru });
  });

  const dailyFines = last30Days.map(date => {
    const count = fines.filter((f: any) => {
      const fineDate = format(new Date(f.violationDate), 'dd.MM', { locale: ru });
      return fineDate === date;
    }).length;
    return { date, count };
  });

  const monthlyRevenue = last30Days.map(date => {
    const revenue = fines
      .filter((f: any) => {
        const fineDate = format(new Date(f.violationDate), 'dd.MM', { locale: ru });
        return fineDate === date && f.status === 'Оплачен';
      })
      .reduce((sum: number, f: any) => sum + f.amount, 0);
    return { date, revenue: revenue / 1000 };
  });

  const topViolators = Object.entries(
    fines.reduce((acc: any, f: any) => {
      const key = `${f.driverName} (${f.licensePlate})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="text-gray-600 mt-1">Статистика и отчеты по штрафам</p>
        </div>
        <Button>
          <Icon name="Download" size={18} className="mr-2" />
          Экспорт отчета
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего штрафов</CardDescription>
            <CardTitle className="text-4xl">{totalFines}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <Icon name="TrendingUp" size={16} className="mr-1" />
              <span>+12% за месяц</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Общая сумма</CardDescription>
            <CardTitle className="text-4xl">{(totalAmount / 1000).toFixed(0)}К</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{totalAmount.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Оплачено</CardDescription>
            <CardTitle className="text-4xl">{paidFines}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {((paidFines / totalFines) * 100).toFixed(1)}% от всех
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Не оплачено</CardDescription>
            <CardTitle className="text-4xl text-red-600">
              {(unpaidAmount / 1000).toFixed(0)}К
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{unpaidAmount.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Динамика штрафов за 30 дней</CardTitle>
            <CardDescription>Количество новых штрафов по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyFines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выручка от штрафов</CardTitle>
            <CardDescription>Оплаченные штрафы в тыс. ₽</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Виды нарушений</CardTitle>
            <CardDescription>Распределение по типам</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ нарушителей</CardTitle>
            <CardDescription>5 водителей с наибольшим количеством штрафов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topViolators.map((violator, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{violator.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{violator.count}</span>
                    <Icon name="AlertTriangle" size={16} className="text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}