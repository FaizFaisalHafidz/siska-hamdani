import {
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
import { ExternalLink } from 'lucide-react';

export function NavFooter({ items, ...props }: { items: NavItem[] } & React.ComponentProps<'div'>) {
    return (
        <TooltipProvider delayDuration={300}>
            <div {...props}>
                <SidebarMenu className="space-y-0.5">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SidebarMenuButton
                                        asChild
                                        size="sm"
                                        className="group text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg h-8"
                                    >
                                        <a
                                            href={item.href}
                                            className="flex items-center gap-2 w-full px-2"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-gray-100 text-gray-500 group-hover:bg-gray-200 shrink-0">
                                                <item.icon className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                                            <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </a>
                                    </SidebarMenuButton>
                                </TooltipTrigger>

                                <TooltipContent
                                    side="right"
                                    align="center"
                                    className="bg-gray-900 text-white border-gray-700 shadow-xl"
                                    sideOffset={8}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon className="h-4 w-4" />
                                        <span className="font-semibold">{item.title}</span>
                                        <ExternalLink className="h-3 w-3 text-gray-400" />
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-300 mt-1">
                                            {item.description}
                                        </p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </div>
        </TooltipProvider>
    );
}
