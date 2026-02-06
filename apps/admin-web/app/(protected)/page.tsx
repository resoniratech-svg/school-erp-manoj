/**
 * Dashboard Landing Page
 */

import { Home } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DashboardPage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
            <EmptyState
                icon={Home}
                title="Welcome to School ERP"
                description="Dashboard UI will be implemented in next phase"
            />
        </div>
    );
}
