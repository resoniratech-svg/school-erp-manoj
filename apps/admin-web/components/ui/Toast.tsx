'use client';

/**
 * Toast Component
 * Simple toast notifications
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        toast: addToast,
        success: (message) => addToast('success', message),
        error: (message) => addToast('error', message),
        info: (message) => addToast('info', message),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
                            toast.type === 'success' && 'bg-green-50 text-green-800',
                            toast.type === 'error' && 'bg-red-50 text-red-800',
                            toast.type === 'info' && 'bg-blue-50 text-blue-800'
                        )}
                    >
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
                        {toast.type === 'info' && <Info className="h-5 w-5" />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 rounded p-1 hover:bg-black/10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
