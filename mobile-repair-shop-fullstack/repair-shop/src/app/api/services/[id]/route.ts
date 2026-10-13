import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  key: z.string().trim().min(2).max(60).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  translationKey: z.union([z.string().trim().min(1).max(80), z.literal(''), z.null()]).optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  description: z.string().trim().min(5).max(500).optional(),
  termsAndConditions: z.string().max(4000).optional(),
  price: z.number().min(0).max(100000).optional(),
  turnaround: z.string().trim().min(2).max(80).optional(),
  active: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) {
    return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({error: 'Invalid repair service update.'}, {status: 400});
  }

  try {
    const {id} = await context.params;
    const data = parsed.data;
    const normalizedKey = data.key ? data.key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined;

    const service = await prisma.repairService.update({
      where: {id},
      data: {
        ...data,
        key: normalizedKey || data.key,
        translationKey: data.translationKey ?? undefined,
      },
    });

    return NextResponse.json({service: {...service, price: Number(service.price)}});
  } catch (error) {
    console.error('Repair service update failed', error);
    return NextResponse.json({error: 'Could not update this repair service.'}, {status: 404});
  }
}

export async function DELETE(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) {
    return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  }

  try {
    const {id} = await context.params;
    await prisma.repairService.update({where: {id}, data: {active: false}});
    return NextResponse.json({ok: true});
  } catch (error) {
    console.error('Repair service archive failed', error);
    return NextResponse.json({error: 'Could not hide this repair service.'}, {status: 404});
  }
}
