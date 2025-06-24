import { Badge } from '@/components/ui/badge';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronRight, Info, Sparkles } from 'lucide-react';

export function NavMain({ items }: { items: NavItem[] }) {
    return (
        <TooltipProvider delayDuration={300}>
            <SidebarGroup>
                <SidebarGroupContent className="px-3">
                    <SidebarMenu className="space-y-0.5">
                        {items.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SidebarMenuButton 
                                            asChild 
                                            className={`
                                                group w-full justify-start rounded-lg transition-all duration-200 h-10
                                                ${item.isSpecial 
                                                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100' 
                                                    : 'hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                                                }
                                            `}
                                        >
                                            <Link href={item.href} className="flex items-center gap-3 w-full px-3 py-2">
                                                {/* Icon */}
                                                <div className={`
                                                    flex items-center justify-center h-7 w-7 rounded-lg shrink-0 relative transition-all duration-200
                                                    ${item.isSpecial 
                                                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md' 
                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-700'
                                                    }
                                                `}>
                                                    <item.icon className="h-4 w-4" />
                                                    {item.isSpecial && (
                                                        <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-yellow-400 animate-pulse" />
                                                    )}
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900 text-sm truncate group-hover:text-gray-950">
                                                            {item.title}
                                                        </span>
                                                        {item.badge && (
                                                            <Badge 
                                                                variant="secondary" 
                                                                className={`
                                                                    text-xs px-1.5 py-0.5 h-4 font-medium shrink-0
                                                                    ${item.badge === 'AI' 
                                                                        ? 'bg-purple-500 text-white shadow-sm' 
                                                                        : item.badge === 'New' 
                                                                        ? 'bg-green-500 text-white shadow-sm'
                                                                        : item.badge === 'Hot'
                                                                        ? 'bg-red-500 text-white shadow-sm'
                                                                        : item.badge === 'Active'
                                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                                        : 'bg-gray-200 text-gray-700'
                                                                    }
                                                                `}
                                                            >
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Info Icon & Arrow */}
                                                <div className="flex items-center gap-1">
                                                    {item.description && (
                                                        <Info className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                    )}
                                                    <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 group-hover:translate-x-0.5" />
                                                </div>
                                            </Link>
                                        </SidebarMenuButton>
                                    </TooltipTrigger>
                                    
                                    {/* Tooltip Content */}
                                    <TooltipContent 
                                        side="right" 
                                        align="center"
                                        className="bg-gray-900 text-white border-gray-700 shadow-xl max-w-sm"
                                        sideOffset={8}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <item.icon className="h-4 w-4" />
                                                <span className="font-semibold">{item.title}</span>
                                                {item.badge && (
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`
                                                            text-xs px-1.5 py-0.5 font-medium
                                                            ${item.badge === 'AI' 
                                                                ? 'bg-purple-500 text-white' 
                                                                : item.badge === 'New' 
                                                                ? 'bg-green-500 text-white'
                                                                : item.badge === 'Hot'
                                                                ? 'bg-red-500 text-white'
                                                                : item.badge === 'Active'
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-600 text-white'
                                                            }
                                                        `}
                                                    >
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                            {item.isSpecial && (
                                                <div className="flex items-center gap-1.5 text-xs text-purple-300 mt-2 pt-2 border-t border-gray-700">
                                                    <Sparkles className="h-3 w-3" />
                                                    <span>AI-powered feature</span>
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </TooltipProvider>
    );
}