import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';

const updateSchema = z.object({
  serviceId: z.string().min(1).optional(),
  model: z.string().trim().min(2).max(120).optional(),
  quality: z.string().trim().min(2).max(80).optional(),
  price: z.number().min(0).max(1000000).optional(),
  currency: z.string().trim().length(3).optional(),
  active: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Invalid repair price update.'}, {status: 400});
  try {
    const {id} = await context.params;
    const item = await prisma.repairVariantPrice.update({where: {id}, data: parsed.data});
    return NextResponse.json({price: {...item, price: Number(item.price)}});
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({error: 'A price already exists for this service, model, and quality.'}, {status: 409});
    }
    console.error('Repair price update failed', error);
    return NextResponse.json({error: 'Could not update this repair price.'}, {status: 404});
  }
}

export async function DELETE(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  try {
    const {id} = await context.params;
    await prisma.repairVariantPrice.update({where: {id}, data: {active: false}});
    return NextResponse.json({ok: true});
  } catch (error) {
    console.error('Repair price archive failed', error);
    return NextResponse.json({error: 'Could not hide this repair price.'}, {status: 404});
  }
}