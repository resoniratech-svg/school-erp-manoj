/**
 * Subscription Seed
 * Default plans for India-first SaaS
 * Run via: npx ts-node apps/api/src/modules/subscription/subscription.seed.ts
 */
import { prisma } from '@school-erp/database';
import { PLAN_CODES, PLAN_PRICING } from './subscription.constants';

interface PlanSeed {
    code: string;
    name: string;
    description: string;
    priceMonthly: number;
    isActive: boolean;
    isPublic: boolean;
    displayOrder: number;
}

const PLANS: PlanSeed[] = [
    {
        code: PLAN_CODES.FREE,
        name: 'Free',
        description: 'Get started with basic features. Perfect for trying out the platform.',
        priceMonthly: PLAN_PRICING[PLAN_CODES.FREE],
        isActive: true,
        isPublic: true,
        displayOrder: 1,
    },
    {
        code: PLAN_CODES.BASIC,
        name: 'Basic',
        description: 'Essential features for small schools. Includes fees, transport, and library.',
        priceMonthly: PLAN_PRICING[PLAN_CODES.BASIC],
        isActive: true,
        isPublic: true,
        displayOrder: 2,
    },
    {
        code: PLAN_CODES.PRO,
        name: 'Pro',
        description: 'Advanced features for growing schools. Includes all modules and priority support.',
        priceMonthly: PLAN_PRICING[PLAN_CODES.PRO],
        isActive: true,
        isPublic: true,
        displayOrder: 3,
    },
    {
        code: PLAN_CODES.ENTERPRISE,
        name: 'Enterprise',
        description: 'Custom solutions for large institutions. Contact sales for pricing.',
        priceMonthly: PLAN_PRICING[PLAN_CODES.ENTERPRISE],
        isActive: true,
        isPublic: false, // Hidden from public listing, sales-only
        displayOrder: 4,
    },
];

export async function seedPlans(): Promise<void> {
    console.log('🌱 Seeding subscription plans...');

    for (const plan of PLANS) {
        const existing = await prisma.plan.findUnique({
            where: { code: plan.code },
        });

        if (existing) {
            console.log(`  ✓ Plan ${plan.code} already exists, updating...`);
            await prisma.plan.update({
                where: { code: plan.code },
                data: {
                    name: plan.name,
                    description: plan.description,
                    priceMonthly: plan.priceMonthly,
                    isActive: plan.isActive,
                    isPublic: plan.isPublic,
                    displayOrder: plan.displayOrder,
                },
            });
        } else {
            console.log(`  + Creating plan ${plan.code}...`);
            await prisma.plan.create({ data: plan });
        }
    }

    console.log('✅ Subscription plans seeded successfully!');
}

// Run directly if executed as script
if (require.main === module) {
    seedPlans()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Seed failed:', error);
            process.exit(1);
        });
}
