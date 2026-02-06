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
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastOptions {
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextValue {
    toast: (type: ToastType, message: string, options?: ToastOptions) => void;
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
        const id = Math.random().toString(36).slice(2);
        const toast: Toast = { id, type, message, action: options?.action };
        setToasts((prev) => [...prev, toast]);

        // Auto remove
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, options?.duration || 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        toast: addToast,
        success: (message, options) => addToast('success', message, options),
        error: (message, options) => addToast('error', message, options),
        info: (message, options) => addToast('info', message, options),
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
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className="ml-2 rounded bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
                            >
                                {toast.action.label}
                            </button>
                        )}
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
