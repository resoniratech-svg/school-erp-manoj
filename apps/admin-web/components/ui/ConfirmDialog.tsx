'use client';

/**
 * ConfirmDialog Component
 * Confirmation dialog for destructive actions
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);

        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef?.(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Dialog overlay */}
            {isOpen && options && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={handleCancel}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div
                                className={`rounded-full p-2 ${options.variant === 'danger' ? 'bg-red-100' : 'bg-gray-100'
                                    }`}
                            >
                                <AlertTriangle
                                    className={`h-6 w-6 ${options.variant === 'danger' ? 'text-red-600' : 'text-gray-600'
                                        }`}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {options.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">{options.message}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCancel}>
                                {options.cancelLabel || 'Cancel'}
                            </Button>
                            <Button
                                variant={options.variant === 'danger' ? 'danger' : 'primary'}
                                onClick={handleConfirm}
                            >
                                {options.confirmLabel || 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context.confirm;
}
