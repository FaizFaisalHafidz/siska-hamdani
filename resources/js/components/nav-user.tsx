import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Award,
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    LogOut,
    Settings,
    Sparkles,
    User,
} from 'lucide-react';

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

export function NavUser() {
    const { isMobile } = useSidebar();
    const { auth } = usePage<CustomProps>().props;
    const roles = auth.user?.roles?.map(role => role.name) || [];
    const currentRole = roles.includes('admin') ? 'admin' : roles.includes('kasir') ? 'kasir' : 'user';

    const handleLogout = () => {
        router.post('/logout');
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-gradient-to-r from-purple-500 to-purple-600';
            case 'kasir':
                return 'bg-gradient-to-r from-blue-500 to-blue-600';
            default:
                return 'bg-gray-500';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Award className="h-2.5 w-2.5" />;
            case 'kasir':
                return <Activity className="h-2.5 w-2.5" />;
            default:
                return <User className="h-2.5 w-2.5" />;
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group w-full justify-start bg-white border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg h-12"
                        >
                            <div className="relative">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={auth.user.name} />
                                    <AvatarFallback className={`${getRoleColor(currentRole)} text-white font-bold text-sm`}>
                                        {getUserInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                            </div>
                            
                            <div className="grid flex-1 text-left text-sm leading-tight min-w-0 mx-2">
                                <span className="font-semibold text-gray-900 truncate">
                                    {auth.user.name}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                    {auth.user.email}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Badge className={`
                                    text-xs px-1.5 py-0.5 h-4 font-medium
                                    ${currentRole === 'admin' 
                                        ? 'bg-purple-500 text-white' 
                                        : 'bg-blue-500 text-white'
                                    }
                                `}>
                                    <div className="flex items-center gap-1">
                                        {getRoleIcon(currentRole)}
                                        <span className="hidden sm:inline">{currentRole}</span>
                                    </div>
                                </Badge>
                                <ChevronsUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 border-b">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="" alt={auth.user.name} />
                                    <AvatarFallback className={`${getRoleColor(currentRole)} text-white font-semibold`}>
                                        {getUserInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-gray-900">
                                        {auth.user.name}
                                    </span>
                                    <span className="truncate text-xs text-gray-500">
                                        {auth.user.email}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className={`
                                            text-xs px-2 py-0.5 h-5
                                            ${currentRole === 'admin' 
                                                ? 'bg-purple-500 text-white' 
                                                : 'bg-blue-500 text-white'
                                            }
                                        `}>
                                            <div className="flex items-center gap-1">
                                                {getRoleIcon(currentRole)}
                                                {currentRole.toUpperCase()}
                                            </div>
                                        </Badge>
                                        {auth.user.email_verified_at && (
                                            <BadgeCheck className="h-3 w-3 text-green-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-3">
                                    <User className="h-4 w-4" />
                                    Profile Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Sparkles className="h-4 w-4" />
                                Upgrade Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Bell className="h-4 w-4" />
                                Notifications
                                <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5 h-4">
                                    3
                                </Badge>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem>
                            <Settings className="h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
