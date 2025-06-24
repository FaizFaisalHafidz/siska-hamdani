import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, Lock, Mail, Shield } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout 
            title="Selamat Datang Kembali" 
            description="Masuk ke akun Anda untuk melanjutkan mengelola bisnis"
        >
            <Head title="Masuk" />

            {/* Status Message */}
            {status && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-medium text-green-700">{status}</p>
                    </div>
                </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Alamat Email
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Masukkan alamat email Anda"
                            className="pl-10 h-12 bg-white/50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 hover:bg-white/80"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                            Kata Sandi
                        </Label>
                        {canResetPassword && (
                            <TextLink 
                                href={route('password.request')} 
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200" 
                                tabIndex={5}
                            >
                                Lupa kata sandi?
                            </TextLink>
                        )}
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Masukkan kata sandi Anda"
                            className="pl-10 pr-12 h-12 bg-white/50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 hover:bg-white/80"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', !!checked)}
                            tabIndex={3}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Ingat saya selama 30 hari
                        </Label>
                    </div>
                </div>

                {/* Login Button */}
                <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02]" 
                    tabIndex={4} 
                    disabled={processing}
                >
                    {processing ? (
                        <div className="flex items-center gap-2">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            <span>Sedang masuk...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <span>Masuk</span>
                        </div>
                    )}
                </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            Autentikasi Aman
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Data login Anda dilindungi dengan enkripsi tingkat enterprise. 
                            Kami tidak pernah menyimpan kata sandi Anda dalam bentuk teks biasa.
                        </p>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
