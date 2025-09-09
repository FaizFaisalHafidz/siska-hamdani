import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail, ShoppingBag } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function CustomerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    router.post('/customer/login', {
      ...form,
      remember: rememberMe
    }, {
      onFinish: () => setIsLoading(false),
      onError: () => setIsLoading(false)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Head title="Masuk - Hamdani Stationery" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJtMzYgMzQgNi0ydjJsLTYgMiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hamdani Stationery
            </h1>
            <p className="text-gray-600 text-sm mt-1">Masuk ke akun pelanggan</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Selamat Datang</CardTitle>
              <CardDescription className="text-gray-600">
                Masuk ke akun Anda untuk melanjutkan belanja
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="contoh@email.com"
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Masukkan password"
                      required
                      className="h-11 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Ingat saya
                    </Label>
                  </div>
                  <Link 
                    href="/customer/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Masuk...
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>

              {/* Register Link */}
              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <Link 
                    href="/customer/register" 
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              </div>

              {/* Admin Login */}
              <div className="text-center mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href="/login" 
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Masuk sebagai Admin/Kasir
                </Link>
              </div>

              {/* Back to Shop */}
              <div className="text-center mt-3">
                <Link 
                  href="/shop" 
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Kembali ke toko
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
