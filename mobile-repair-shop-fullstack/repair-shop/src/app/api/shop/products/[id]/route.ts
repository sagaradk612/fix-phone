import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  brand: z.string().trim().min(2).max(60).optional(),
  model: z.string().trim().min(1).max(120).optional(),
  storage: z.string().trim().min(1).max(30).optional(),
  condition: z.string().trim().min(2).max(40).optional(),
  description: z.string().trim().min(5).max(2000).optional(),
  imageUrl: z.union([z.string().url().max(1000), z.literal(''), z.null()]).optional(),
  price: z.number().positive().max(10000000).optional(),
  stock: z.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Invalid product update.'}, {status: 400});
  try {
    const {id} = await context.params;
    const data = {...parsed.data, imageUrl: parsed.data.imageUrl === '' ? null : parsed.data.imageUrl};
    const product = await prisma.shopProduct.update({where: {id}, data});
    return NextResponse.json({product: {...product, price: product.price.toNumber()}});
  } catch (error) {
    console.error('Product update failed', error);
    return NextResponse.json({error: 'Could not update this product.'}, {status: 404});
  }
}

export async function DELETE(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  try {
    const {id} = await context.params;
    await prisma.shopProduct.update({where: {id}, data: {active: false}});
    return NextResponse.json({ok: true});
  } catch (error) {
    console.error('Product archive failed', error);
    return NextResponse.json({error: 'Could not archive this product.'}, {status: 404});
  }
}
