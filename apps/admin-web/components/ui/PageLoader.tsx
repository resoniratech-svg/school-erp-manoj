/**
 * PageLoader Component
 * Full-page loading state
 */

import { Loader } from './Loader';

export function PageLoader() {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
                <Loader size="lg" className="mx-auto" />
                <p className="mt-4 text-sm text-gray-500">Loading...</p>
            </div>
        </div>
    );
}
