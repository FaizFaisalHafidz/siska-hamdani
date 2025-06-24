import AppLogo from '@/components/app-logo';
import { Head } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title: string;
    description?: string;
}

export default function AuthLayout({ title, description, children }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <Head title={title} />
            
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
            </div>

            {/* Main Container */}
            <div className="relative w-full max-w-md">
                {/* Glass Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-500/5 rounded-2xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            {/* Logo with Glow */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-40 scale-110 group-hover:opacity-60 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <AppLogo size="xl" className="shadow-2xl" />
                                    </div>
                                </div>
                            </div>

                            {/* Brand Name */}
                            <div className="mb-4">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                                    Siska Canon
                                </h2>
                                <p className="text-sm text-gray-600 font-medium">
                                    Point of Sale System
                                </p>
                            </div>

                            {/* Title & Description */}
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Form Content */}
                        {children}
                    </div>

                    {/* Bottom Decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                </div>

                {/* Bottom Text */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Sistem keamanan terdepan dari{' '}
                        <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Siska Canon POS
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
