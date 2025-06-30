import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageProps, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Award,
    BarChart3,
    Bot,
    CreditCard,
    History,
    LayoutGrid,
    Package,
    Settings,
    Sparkles,
    Users,
    Zap
} from 'lucide-react';
import AppLogo from './app-logo';

interface CustomProps extends PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            email_verified_at: string | null;
            created_at: string;
            updated_at: string;
            roles: { name: string }[];
        };
    };
}

export function AppSidebar() {
    const { auth } = usePage<CustomProps>().props;
    const roles = auth.user?.roles?.map(role => role.name) || [];
    const currentRole = roles.includes('admin') ? 'admin' : roles.includes('kasir') ? 'kasir' : 'user';
    
    const getMenuItems = (): NavItem[] => {
        const baseItems: NavItem[] = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
                // badge: 'New',
                description: 'Overview & Analytics - Lihat ringkasan performa bisnis dan analitik real-time'
            },
        ];

        if (roles.includes('admin')) {
            return [
                ...baseItems,
                {
                    title: 'Manajemen Produk',
                    href: '/admin/produk',
                    icon: Package,
                    // badge: 'Hot',
                    description: 'Kelola inventori produk - Tambah, edit, dan kelola stok produk dengan mudah'
                },
                // {
                //     title: 'Point of Sale',
                //     href: '/pos',
                //     icon: CreditCard,
                //     // badge: 'Active',
                //     description: 'Transaksi penjualan - Proses pembayaran dan transaksi customer dengan cepat'
                // },
                {
                    title: 'Manajemen Pelanggan',
                    href: '/admin/pelanggan',
                    icon: Users,
                    description: 'Data customer - Kelola informasi pelanggan dan riwayat pembelian mereka'
                },
                // {
                //     title: 'Manajemen Supplier',
                //     href: '/admin/supplier',
                //     icon: UserCheck,
                //     description: 'Data supplier - Kelola informasi pemasok dan riwayat pembelian dari mereka'
                // },
                {
                    title: 'AI Rekomendasi',
                    href: '/admin/rekomendasi',
                    icon: Bot,
                    badge: 'AI',
                    isSpecial: true,
                    description: 'Smart product recommendations - Dapatkan rekomendasi produk berdasarkan AI untuk meningkatkan penjualan'
                },
                {
                    title: 'Analytics & Reports',
                    href: '/admin/laporan',
                    icon: BarChart3,
                    description: 'Business insights - Laporan penjualan, analisis trend, dan insight bisnis mendalam'
                },
                {
                    title: 'Riwayat Transaksi',
                    href: '/admin/riwayat-pembelian',
                    icon: History,
                    description: 'Transaction history - Lihat dan kelola semua riwayat transaksi penjualan'
                },
                {
                    title: 'User Management',
                    href: '/admin/users',
                    icon: Settings,
                    description: 'Manage system users - Kelola akun pengguna, role, dan permission sistem'
                },
            ];
        } else if (roles.includes('kasir')) {
            return [
                ...baseItems,
                {
                    title: 'Point of Sale',
                    href: '/pos',
                    icon: CreditCard,
                    // badge: 'Active',
                    description: 'Proses penjualan - Interface kasir untuk melayani customer dan proses pembayaran'
                },
                {
                    title: 'Kelola Pelanggan',
                    href: '/kasir/pelanggan',
                    icon: Users,
                    description: 'Manage customers - Tambah dan edit informasi pelanggan untuk transaksi'
                },
                {
                    title: 'Riwayat Penjualan',
                    href: '/kasir/riwayat-pembelian',
                    icon: History,
                    description: 'Sales history - Lihat riwayat penjualan yang telah anda proses'
                },
            ];
        }

        return baseItems;
    };

    const footerNavItems: NavItem[] = [
        // {
        //     title: 'Help Center',
        //     href: '#',
        //     icon: BookOpen,
        //     description: 'Dapatkan bantuan dan panduan penggunaan sistem'
        // },
        // {
        //     title: 'Documentation',
        //     href: '#',
        //     icon: Folder,
        //     description: 'Baca dokumentasi lengkap tentang fitur-fitur sistem'
        // },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-gray-200">
            {/* Header - Compact & Modern */}
            <SidebarHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                <div className="p-4">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-white/80 backdrop-blur-sm transition-all duration-200">
                                <Link href="/dashboard">
                                    <AppLogo size="md" />
                                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                        <span className="truncate font-bold text-gray-900">Siska Canon</span>
                                        <span className="truncate text-xs text-gray-600">POS System</span>
                                    </div>
                                    <Badge className={`
                                        text-xs px-2 py-0.5 font-medium shadow-sm
                                        ${currentRole === 'admin' 
                                            ? 'bg-purple-500 text-white' 
                                            : 'bg-blue-500 text-white'
                                        }
                                    `}>
                                        {currentRole === 'admin' && <Award className="h-2.5 w-2.5 mr-1" />}
                                        {currentRole === 'kasir' && <Activity className="h-2.5 w-2.5 mr-1" />}
                                        {currentRole.toUpperCase()}
                                    </Badge>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    
                    {/* Compact Status Indicators */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1.5 border border-green-100">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-700">Online</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 border border-blue-100">
                            <Zap className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Active</span>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent className="bg-gradient-to-b from-white to-gray-50/30">
                {/* Navigation Header */}
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    </div>
                </div>
                
                <NavMain items={getMenuItems()} />
                
                <SidebarSeparator className="mx-3 bg-gray-200" />
                
                {/* Quick Actions - Compact dengan Tooltip */}
                {roles.includes('admin') && (
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <Zap className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
                        </div>
                        
                        <TooltipProvider delayDuration={300}>
                            <div className="space-y-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link 
                                            href="/pos" 
                                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">New Sale</div>
                                            </div>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                        side="right" 
                                        className="bg-blue-900 text-white border-blue-700"
                                        sideOffset={8}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="font-semibold">New Sale</span>
                                        </div>
                                        <p className="text-sm text-blue-200 mt-1">
                                            Mulai transaksi penjualan baru dan proses pembayaran customer
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link 
                                            href="/admin/rekomendasi" 
                                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 p-2.5 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                                        >
                                            <Bot className="h-4 w-4" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">AI Insights</div>
                                            </div>
                                            <Badge className="bg-white/20 text-white text-xs px-1.5 py-0.5">
                                                NEW
                                            </Badge>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                        side="right" 
                                        className="bg-purple-900 text-white border-purple-700"
                                        sideOffset={8}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bot className="h-4 w-4" />
                                            <span className="font-semibold">AI Insights</span>
                                            <Badge className="bg-purple-700 text-white text-xs">NEW</Badge>
                                        </div>
                                        <p className="text-sm text-purple-200 mt-1">
                                            Dapatkan rekomendasi produk cerdas berbasis AI untuk meningkatkan penjualan
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-purple-300 mt-2 pt-2 border-t border-purple-700">
                                            <Sparkles className="h-3 w-3" />
                                            <span>Powered by AI</span>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="border-t border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                <div className="p-3 space-y-2">
                    {/* Footer Links */}
                    <NavFooter items={footerNavItems} />
                    
                    <SidebarSeparator className="bg-gray-200" />
                    
                    {/* User Profile */}
                    <NavUser />
                    
                    {/* System Status */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                        <span className="text-gray-500 font-medium">Status</span>
                        <div className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-600 font-medium">OK</span>
                        </div>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
