/**
 * Navigation Configuration
 * Permission & feature flag aware
 */

import {
    Users,
    GraduationCap,
    Calendar,
    ClipboardCheck,
    FileText,
    DollarSign,
    Bus,
    BookOpen,
    MessageSquare,
    Settings,
    Shield,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
    featureFlag?: string;
    children?: NavItem[];
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export const navigation: NavSection[] = [
    {
        title: 'Administration',
        items: [
            {
                label: 'Users',
                href: '/users',
                icon: Users,
                permission: 'user:read:tenant',
            },
            {
                label: 'Roles & Permissions',
                href: '/users/roles',
                icon: Shield,
                permission: 'role:read:tenant',
            },
        ],
    },
    {
        title: 'Academics',
        items: [
            {
                label: 'Academic Setup',
                href: '/academic',
                icon: GraduationCap,
                permission: 'academic_year:read:tenant',
                featureFlag: 'academic.enabled',
            },
            {
                label: 'Timetable',
                href: '/timetable',
                icon: Calendar,
                permission: 'timetable:read:tenant',
            },
            {
                label: 'Attendance',
                href: '/attendance',
                icon: ClipboardCheck,
                permission: 'attendance:read:tenant',
                featureFlag: 'attendance.enabled',
            },
            {
                label: 'Exams',
                href: '/exams',
                icon: FileText,
                permission: 'exams:read:tenant',
                featureFlag: 'exams.enabled',
            },
        ],
    },
    {
        title: 'Finance',
        items: [
            {
                label: 'Fee Management',
                href: '/fees',
                icon: DollarSign,
                permission: 'fees:read:tenant',
                featureFlag: 'fees.enabled',
            },
        ],
    },
    {
        title: 'Operations',
        items: [
            {
                label: 'Transport',
                href: '/transport',
                icon: Bus,
                permission: 'transport:read:tenant',
                featureFlag: 'transport.enabled',
            },
            {
                label: 'Library',
                href: '/library',
                icon: BookOpen,
                permission: 'library:read:tenant',
                featureFlag: 'library.enabled',
            },
            {
                label: 'Communication',
                href: '/communication',
                icon: MessageSquare,
                permission: 'communication:read:tenant',
                featureFlag: 'communication.enabled',
            },
        ],
    },
    {
        title: 'System',
        items: [
            {
                label: 'Reports',
                href: '/reports',
                icon: FileText,
                permission: 'reports:read:tenant',
                featureFlag: 'reports.enabled',
            },
            {
                label: 'Configuration',
                href: '/config',
                icon: Settings,
                permission: 'config:read:tenant',
            },
        ],
    },
];
