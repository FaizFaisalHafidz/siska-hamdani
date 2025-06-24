import { cn } from '@/lib/utils';
import AppLogoIcon from './app-logo-icon';

interface AppLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export default function AppLogo({ className, size = 'md', showText = false }: AppLogoProps) {
    const sizeClasses = {
        sm: 'h-6 w-6 text-sm',
        md: 'h-8 w-8 text-base',
        lg: 'h-12 w-12 text-xl',
        xl: 'h-16 w-16 text-2xl'
    };

    return (
        <div className="flex items-center gap-2">
            {/* Logo Icon */}
            <div className={cn(
                "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105",
                sizeClasses[size],
                className
            )}>
                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-sm opacity-50 -z-10"></div>
                
                {/* SC Text */}
                <span className="relative z-10 font-extrabold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    SC
                </span>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </div>

            {/* Optional Text */}
            {showText && (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm leading-tight">
                        Siska Canon
                    </span>
                    <span className="text-xs text-gray-500 leading-tight">
                        POS System
                    </span>
                </div>
            )}
        </div>
    );
}
