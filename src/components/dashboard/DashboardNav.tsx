import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export default function DashboardNav() {
  const location = useLocation();
  const fines = JSON.parse(localStorage.getItem('fines') || '[]');
  const unpaidCount = fines.filter((f: any) => f.status === 'Не оплачен').length;

  const navItems = [
    { path: '/', label: 'Главная', icon: 'LayoutDashboard' },
    { path: '/analytics', label: 'Аналитика', icon: 'BarChart3' },
    { path: '/drivers', label: 'Водители', icon: 'Users' },
    { path: '/vehicles', label: 'Транспорт', icon: 'Car' },
    { path: '/payments', label: 'Оплата', icon: 'CreditCard', badge: unpaidCount },
    { path: '/notifications', label: 'Уведомления', icon: 'Bell' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Icon name="Shield" size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl">ГИБДД</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  size="sm"
                  className="relative"
                >
                  <Icon name={item.icon as any} size={18} className="mr-2" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 bg-red-600">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('gibdd_auth');
              window.location.href = '/login';
            }}
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выход
          </Button>
        </div>

        <div className="md:hidden pb-3 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap relative"
              >
                <Icon name={item.icon as any} size={16} className="mr-1.5" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge className="ml-1.5 px-1 py-0 h-4 min-w-4 text-xs bg-red-600">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
