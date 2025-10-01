import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';
import DashboardNav from '@/components/dashboard/DashboardNav';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const fines = JSON.parse(localStorage.getItem('fines') || '[]');
    const notifs: Notification[] = [];

    fines.forEach((fine: any) => {
      if (fine.status === 'Не оплачен') {
        const daysPassed = differenceInDays(new Date(), new Date(fine.violationDate));
        
        if (daysPassed <= 20) {
          notifs.push({
            id: `discount-${fine.id}`,
            type: 'success',
            title: 'Доступна скидка 50%',
            message: `Штраф ${fine.violationNumber} (${fine.violationType}) можно оплатить со скидкой. Осталось ${20 - daysPassed} дней.`,
            date: new Date().toISOString(),
            read: false
          });
        }

        if (daysPassed > 60) {
          notifs.push({
            id: `overdue-${fine.id}`,
            type: 'warning',
            title: 'Просроченный штраф',
            message: `Штраф ${fine.violationNumber} (${fine.violationType}) не оплачен более 60 дней. Возможны дополнительные санкции.`,
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    return notifs;
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    discountReminders: true,
    paymentReminders: true,
    newFinesAlert: true
  });

  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast({
      title: 'Все уведомления прочитаны',
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast({
      title: 'Уведомление удалено',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <Icon name="AlertTriangle" size={20} className="text-orange-500" />;
      case 'success':
        return <Icon name="CheckCircle2" size={20} className="text-green-500" />;
      default:
        return <Icon name="Info" size={20} className="text-blue-500" />;
    }
  };

  const updateSetting = (key: string, value: boolean) => {
    setSettings({ ...settings, [key]: value });
    toast({
      title: 'Настройки обновлены',
      description: 'Изменения сохранены',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} непрочитанных уведомлений` : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <Icon name="CheckCheck" size={18} className="mr-2" />
            Отметить все как прочитанные
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Bell" size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Нет уведомлений</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={notification.read ? 'bg-gray-50' : 'border-l-4 border-l-blue-500'}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="default" className="bg-blue-600">Новое</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.date).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Icon name="Check" size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Настройки уведомлений</CardTitle>
              <CardDescription>Управление способами получения уведомлений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Способы доставки</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon name="Mail" size={18} />
                        <span>Email</span>
                      </div>
                    </Label>
                    <Switch
                      id="email"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon name="MessageSquare" size={18} />
                        <span>SMS</span>
                      </div>
                    </Label>
                    <Switch
                      id="sms"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon name="Bell" size={18} />
                        <span>Push-уведомления</span>
                      </div>
                    </Label>
                    <Switch
                      id="push"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Типы уведомлений</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discount" className="cursor-pointer">
                      Скидки на штрафы
                    </Label>
                    <Switch
                      id="discount"
                      checked={settings.discountReminders}
                      onCheckedChange={(checked) => updateSetting('discountReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment" className="cursor-pointer">
                      Напоминания об оплате
                    </Label>
                    <Switch
                      id="payment"
                      checked={settings.paymentReminders}
                      onCheckedChange={(checked) => updateSetting('paymentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newFines" className="cursor-pointer">
                      Новые штрафы
                    </Label>
                    <Switch
                      id="newFines"
                      checked={settings.newFinesAlert}
                      onCheckedChange={(checked) => updateSetting('newFinesAlert', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}