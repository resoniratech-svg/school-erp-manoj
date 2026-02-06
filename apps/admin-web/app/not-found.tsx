import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <p className="mt-4 text-lg text-gray-600">Page not found</p>
            <Link
                href="/"
                className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
            >
                Go Home
            </Link>
        </div>
    );
}
