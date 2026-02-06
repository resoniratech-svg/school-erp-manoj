'use client';

import { useState } from 'react';
import { CreditCard, Clock, CheckCircle, AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent, Card } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/PageLoader';
import { PageError } from '@/components/ui/PageError';
import { WithPermission } from '@/components/auth/WithPermission';
import { useQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { subscriptionClient, billingClient, type Plan } from '@school-erp/api-client';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: { email?: string };
    theme?: { color?: string };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, callback: () => void) => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    trialing: 'warning',
    active: 'success',
    past_due: 'error',
    suspended: 'error',
    cancelled: 'default',
};

const STATUS_LABELS: Record<string, string> = {
    trialing: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
};

export default function SubscriptionPage() {
    const toast = useToast();
    const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
    const [paymentPending, setPaymentPending] = useState(false);

    const { data: subscription, isLoading: subLoading, isError: subError, refetch } = useQuery(
        () => subscriptionClient.getCurrent()
    );

    const { data: plans, isLoading: plansLoading } = useQuery(() => subscriptionClient.listPlans());

    // Load Razorpay script
    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (plan: Plan) => {
        if (upgradingPlan || plan.priceMonthly === 0) return;

        setUpgradingPlan(plan.code);

        try {
            // Load Razorpay SDK
            const loaded = await loadRazorpay();
            if (!loaded) {
                toast.error('Failed to load payment gateway');
                return;
            }

            // Create order
            const order = await billingClient.createOrder(plan.code);

            // Open Razorpay checkout
            const razorpay = new window.Razorpay({
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'School ERP',
                description: `${order.planName} Plan`,
                handler: (response: RazorpayResponse) => {
                    // Payment successful on frontend
                    // BUT we don't trust this - webhook will activate subscription
                    setPaymentPending(true);
                    toast.success('Payment received! Activating your plan...');

                    // Poll for subscription update
                    const pollInterval = setInterval(async () => {
                        const updated = await subscriptionClient.getCurrent();
                        if (updated.plan.code === plan.code && updated.status === 'active') {
                            clearInterval(pollInterval);
                            setPaymentPending(false);
                            refetch();
                            toast.success(`Upgraded to ${plan.name}!`);
                        }
                    }, 2000);

                    // Stop polling after 30 seconds
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        setPaymentPending(false);
                        refetch();
                    }, 30000);
                },
                prefill: {},
                theme: { color: '#4F46E5' },
            });

            razorpay.on('payment.failed', () => {
                toast.error('Payment failed. Please try again.');
            });

            razorpay.open();
        } catch (error) {
            toast.error('Failed to create order');
        } finally {
            setUpgradingPlan(null);
        }
    };

    if (subLoading || plansLoading) return <PageLoader />;
    if (subError || !subscription) return <PageError onRetry={refetch} />;

    const isTrialing = subscription.status === 'trialing';
    const isPastDue = subscription.status === 'past_due';

    return (
        <WithPermission permission="subscription:read:tenant">
            <PageContent>
                <PageHeader title="Subscription" subtitle="Manage your subscription plan" />

                {/* Payment Pending Notice */}
                {paymentPending && (
                    <Card className="border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-800">Payment Processing</p>
                                <p className="text-sm text-blue-700">
                                    Your payment is being verified. This may take a few moments.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Trial Warning */}
                {isTrialing && subscription.trialDaysRemaining !== null && !paymentPending && (
                    <Card className="border-amber-200 bg-amber-50">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-800">Trial Period</p>
                                <p className="text-sm text-amber-700">
                                    {subscription.trialDaysRemaining} days remaining. Upgrade to continue using all features.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Past Due Warning */}
                {isPastDue && !paymentPending && (
                    <Card className="border-red-200 bg-red-50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="font-medium text-red-800">Trial Expired</p>
                                <p className="text-sm text-red-700">
                                    Your trial has ended. Some features may be restricted. Upgrade to restore access.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Current Plan */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary-100 p-3">
                                <CreditCard className="h-8 w-8 text-primary-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold">{subscription.plan.name}</h2>
                                    <Badge variant={STATUS_VARIANTS[subscription.status] ?? 'default'}>
                                        {paymentPending ? 'Processing...' : STATUS_LABELS[subscription.status] ?? subscription.status}
                                    </Badge>
                                </div>
                                <p className="text-gray-500">{subscription.plan.priceDisplay}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Plan Details */}
                <Card title="Plan Details">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Started</p>
                            <p className="font-medium">{new Date(subscription.startedAt).toLocaleDateString()}</p>
                        </div>
                        {subscription.trialEndsAt && (
                            <div>
                                <p className="text-sm text-gray-500">Trial Ends</p>
                                <p className="font-medium">{new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium capitalize">{subscription.status.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Plan Code</p>
                            <p className="font-medium">{subscription.plan.code}</p>
                        </div>
                    </div>
                </Card>

                {/* Available Plans */}
                {plans && plans.length > 0 && (
                    <Card title="Available Plans">
                        <div className="grid gap-4 md:grid-cols-3">
                            {plans.map((plan: Plan) => {
                                const isCurrentPlan = plan.code === subscription.plan.code;
                                const isUpgrading = upgradingPlan === plan.code;
                                const canUpgrade = !isCurrentPlan && plan.priceMonthly > 0 && !paymentPending;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`rounded-lg border p-4 ${isCurrentPlan
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{plan.name}</h3>
                                            {isCurrentPlan && (
                                                <CheckCircle className="h-5 w-5 text-primary-500" />
                                            )}
                                        </div>
                                        <p className="mt-1 text-lg font-bold text-primary-600">{plan.priceDisplay}</p>
                                        {plan.description && (
                                            <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                                        )}
                                        <WithPermission permission="subscription:update:tenant">
                                            <Button
                                                className="mt-4 w-full"
                                                variant={canUpgrade ? 'primary' : 'outline'}
                                                disabled={!canUpgrade || isUpgrading}
                                                onClick={() => handleUpgrade(plan)}
                                            >
                                                {isUpgrading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : isCurrentPlan ? (
                                                    'Current Plan'
                                                ) : plan.priceMonthly === 0 ? (
                                                    'Free Plan'
                                                ) : (
                                                    <>
                                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                                        Upgrade
                                                    </>
                                                )}
                                            </Button>
                                        </WithPermission>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </PageContent>
        </WithPermission>
    );
}
