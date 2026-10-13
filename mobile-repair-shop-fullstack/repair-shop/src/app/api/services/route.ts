import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {ensureStarterRepairCatalog} from '@/lib/repair-pricing';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';

const serviceSchema = z.object({
  key: z.string().trim().min(2).max(60),
  name: z.string().trim().min(2).max(100),
  translationKey: z.union([z.string().trim().min(1).max(80), z.literal(''), z.undefined()]).optional(),
  icon: z.string().trim().min(1).max(10).default('✦'),
  description: z.string().trim().min(5).max(500),
  termsAndConditions: z.string().max(4000).default(''),
  price: z.number().min(0).max(100000),
  turnaround: z.string().trim().min(2).max(80).default('48 hours'),
  active: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  await ensureStarterRepairCatalog();
  const staff = await getRequestStaff(request);
  const includeInactive = Boolean(staff && ['OWNER', 'MANAGER'].includes(staff.role) && request.nextUrl.searchParams.get('all') === '1');

  const services = await prisma.repairService.findMany({
    where: includeInactive ? {} : {active: true},
    orderBy: {createdAt: 'asc'},
  });

  return NextResponse.json({
    services: services.map(service => ({
      ...service,
      price: Number(service.price),
    })),
  });
}

export async function POST(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) {
    return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  }

  const parsed = serviceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({error: 'Check the repair service details.', details: parsed.error.flatten().fieldErrors}, {status: 400});
  }

  const data = parsed.data;
  const normalizedKey = data.key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    const service = await prisma.repairService.create({
      data: {
        ...data,
        key: normalizedKey || 'service',
        translationKey: data.translationKey || normalizedKey || null,
        description: data.description,
        icon: data.icon || '✦',
        turnaround: data.turnaround || '48 hours',
        active: data.active ?? true,
      },
    });

    return NextResponse.json({service: {...service, price: Number(service.price)}}, {status: 201});
  } catch (error) {
    console.error('Repair service create failed', error);
    return NextResponse.json({error: 'Could not save this repair service.'}, {status: 500});
  }
}
