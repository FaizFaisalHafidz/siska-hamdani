// Add these properties to your existing NavItem type

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    description?: string;
    isSpecial?: boolean;
}

// ... rest of existing types