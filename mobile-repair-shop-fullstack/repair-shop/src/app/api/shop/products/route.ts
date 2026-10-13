import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(2).max(60),
  model: z.string().trim().min(1).max(120),
  storage: z.string().trim().min(1).max(30),
  condition: z.string().trim().min(2).max(40),
  description: z.string().trim().min(5).max(2000),
  imageUrl: z.union([z.string().url().max(1000), z.literal(''), z.undefined()]).optional(),
  price: z.number().positive().max(10000000),
  stock: z.number().int().min(0).max(10000),
});

export async function GET(request: NextRequest) {
  const staff = await getRequestStaff(request);
  const includeInactive = Boolean(staff && ['OWNER', 'MANAGER'].includes(staff.role) && request.nextUrl.searchParams.get('all') === '1');
  const products = await prisma.shopProduct.findMany({where: includeInactive ? {} : {active: true}, orderBy: [{stock: 'desc'}, {createdAt: 'desc'}]});
  return NextResponse.json({products: products.map(product => ({...product, price: product.price.toNumber()}))});
}

export async function POST(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff || !['OWNER', 'MANAGER'].includes(staff.role)) return NextResponse.json({error: 'Not authorized.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Check the product details.', details: parsed.error.flatten().fieldErrors}, {status: 400});
  const data = parsed.data;
  const slug = `${data.brand}-${data.model}-${data.storage}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    const product = await prisma.shopProduct.create({data: {...data, slug, imageUrl: data.imageUrl || null}});
    return NextResponse.json({product: {...product, price: product.price.toNumber()}}, {status: 201});
  } catch (error) {
    console.error('Product create failed', error);
    return NextResponse.json({error: 'Could not save this product.'}, {status: 500});
  }
}
