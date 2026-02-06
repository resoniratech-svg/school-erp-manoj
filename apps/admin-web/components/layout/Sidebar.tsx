'use client';

/**
 * Sidebar Component
 * Permission & feature flag aware navigation
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { navigation, type NavItem, type NavSection } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const pathname = usePathname();
    const { hasPermission } = useAuth();
    const { isEnabled } = useFeatureFlags();

    // Filter navigation based on permissions and feature flags
    const filteredNavigation = navigation
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                // Check permission
                if (item.permission && !hasPermission(item.permission)) {
                    return false;
                }
                // Check feature flag
                if (item.featureFlag && !isEnabled(item.featureFlag)) {
                    return false;
                }
                return true;
            }),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg text-white">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-gray-700 px-6">
                <span className="text-xl font-bold">School ERP</span>
            </div>

            {/* Navigation */}
            <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
                {filteredNavigation.map((section) => (
                    <NavSectionComponent
                        key={section.title}
                        section={section}
                        pathname={pathname}
                    />
                ))}
            </nav>
        </aside>
    );
}

interface NavSectionComponentProps {
    section: NavSection;
    pathname: string;
}

function NavSectionComponent({ section, pathname }: NavSectionComponentProps) {
    return (
        <div className="mb-4">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
            </h3>
            <ul className="space-y-1">
                {section.items.map((item) => (
                    <NavItemComponent key={item.href} item={item} pathname={pathname} />
                ))}
            </ul>
        </div>
    );
}

interface NavItemComponentProps {
    item: NavItem;
    pathname: string;
}

function NavItemComponent({ item, pathname }: NavItemComponentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    if (item.children && item.children.length > 0) {
        return (
            <li>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive ? 'bg-sidebar-active text-white' : 'text-gray-300 hover:bg-sidebar-hover'
                    )}
                >
                    <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {item.label}
                    </span>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
                {isOpen && (
                    <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                            <NavItemComponent key={child.href} item={child} pathname={pathname} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    return (
        <li>
            <Link
                href={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-sidebar-active text-white' : 'text-gray-300 hover:bg-sidebar-hover'
                )}
            >
                <Icon className="h-5 w-5" />
                {item.label}
            </Link>
        </li>
    );
}
