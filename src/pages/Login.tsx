import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem('gibdd_auth', 'true');
        toast({
          title: 'Успешный вход',
          description: 'Добро пожаловать в систему ГИБДД',
        });
        navigate('/');
      } else {
        toast({
          title: 'Ошибка входа',
          description: 'Неверный логин или пароль',
          variant: 'destructive',
        });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
            <Icon name="Shield" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ГИБДД России</h1>
          <p className="text-gray-600">Система управления штрафами</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Авторизация</CardTitle>
            <CardDescription>
              Введите логин и пароль для входа в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <div className="relative">
                  <Icon name="User" size={18} className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Icon name="Lock" size={18} className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Вход...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" size={18} className="mr-2" />
                    Войти в систему
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2 font-medium">
                Тестовые данные для входа:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Логин:</strong> admin</p>
                <p><strong>Пароль:</strong> admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2024 ГИБДД России. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
