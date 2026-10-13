import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {ensureStarterRepairCatalog} from '@/lib/repair-pricing';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';

const repairPriceSchema = z.object({
  serviceId: z.string().min(1),
  model: z.string().trim().min(2).max(120),
  quality: z.string().trim().min(2).max(80),
  price: z.number().min(0).max(1000000),
  currency: z.string().trim().length(3).default('THB'),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await ensureStarterRepairCatalog();
    const staff = await getRequestStaff(request);
    const includeInactive = Boolean(staff && ['OWNER', 'MANAGER'].includes(staff.role) && request.nextUrl.searchParams.get('all') === '1');
    const prices = await prisma.repairVariantPrice.findMany({
      where: includeInactive ? {} : {active: true, service: {active: true}},
      include: {service: true},
      orderBy: [{service: {name: 'asc'}}, {model: 'asc'}, {quality: 'asc'}],
    });
    return NextResponse.json({prices: prices.map(item => ({...item, price: Number(item.price), serviceName: item.service.name, serviceKey: item.service.key, serviceDescription: item.service.description, termsAndConditions: item.service.termsAndConditions, serviceIcon: item.service.icon}))});
  } catch (error) {
    console.error('Repair price list failed', error);
    return NextResponse.json({error: 'Could not load repair prices.'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});

  const parsed = repairPriceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Check the model, problem, and price.'}, {status: 400});

  try {
    const item = await prisma.repairVariantPrice.create({data: parsed.data});
    return NextResponse.json({price: {...item, price: Number(item.price)}}, {status: 201});
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({error: 'A price already exists for this service, model, and quality.'}, {status: 409});
    }
    console.error('Repair price create failed', error);
    return NextResponse.json({error: 'Could not save this repair price.'}, {status: 500});
  }
}