import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface DashboardHeaderProps {
  stats: {
    total: number;
    unpaid: number;
    paid: number;
    totalAmount: number;
  };
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onExportExcel: () => void;
  onOpenVinDialog: () => void;
  onOpenParkingDialog: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  stats,
  mobileMenuOpen,
  setMobileMenuOpen,
  onExportExcel,
  onOpenVinDialog,
  onOpenParkingDialog,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <div className="bg-primary py-4 shadow-md mb-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-md">
              <Icon name="Shield" size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                ГИБДД России
              </h1>
              <p className="text-blue-100 text-xs md:text-sm">Управление штрафами и нарушениями</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-white text-sm">
              <Icon name="Phone" size={16} />
              <span>8 (800) 000-00-00</span>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Icon name="Menu" size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Icon name="Shield" size={24} className="text-primary" />
                    Главное меню
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase">Статистика</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" size={20} className="text-blue-600" />
                          <span className="text-sm font-medium">Всего штрафов</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="AlertCircle" size={20} className="text-red-600" />
                          <span className="text-sm font-medium">Не оплачено</span>
                        </div>
                        <span className="text-lg font-bold text-red-600">{stats.unpaid}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle" size={20} className="text-green-600" />
                          <span className="text-sm font-medium">Оплачено</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{stats.paid}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="Wallet" size={20} className="text-gray-700" />
                          <span className="text-sm font-medium">Общая сумма</span>
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          {stats.totalAmount.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase">Действия</h3>
                    <Button onClick={() => { onExportExcel(); setMobileMenuOpen(false); }} variant="outline" className="w-full justify-start gap-2">
                      <Icon name="Download" size={18} />
                      Экспорт в Excel
                    </Button>
                    <Button onClick={() => { onOpenVinDialog(); setMobileMenuOpen(false); }} variant="outline" className="w-full justify-start gap-2">
                      <Icon name="Search" size={18} />
                      Проверка по VIN
                    </Button>
                    <Button onClick={() => { onOpenParkingDialog(); setMobileMenuOpen(false); }} variant="outline" className="w-full justify-start gap-2">
                      <Icon name="Car" size={18} />
                      Выдать парковку
                    </Button>
                    <Button onClick={onLogout} variant="destructive" className="w-full justify-start gap-2">
                      <Icon name="LogOut" size={18} />
                      Выйти из системы
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase">Контакты</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Phone" size={18} className="text-primary" />
                      <span>8 (800) 000-00-00</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Mail" size={18} className="text-primary" />
                      <span>info@gibdd.ru</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
