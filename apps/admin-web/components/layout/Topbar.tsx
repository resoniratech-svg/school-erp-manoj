'use client';

/**
 * Topbar Component
 * User info and logout
 */

import { useState } from 'react';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Topbar() {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            {/* Breadcrumb / Title */}
            <div>
                <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {/* User dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
