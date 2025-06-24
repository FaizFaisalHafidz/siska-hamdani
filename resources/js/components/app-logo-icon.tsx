import { cn } from '@/lib/utils';

interface AppLogoIconProps {
    className?: string;
}

export default function AppLogoIcon({ className }: AppLogoIconProps) {
    return (
        <div className={cn(
            "flex items-center justify-center font-bold text-current",
            className
        )}>
            SC
        </div>
    );
}
